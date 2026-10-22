import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, writeFile, mkdir, readFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handoff } from '../tooling/skill-shared/handoff.mjs';
async function rig(t, entry = 'build', until = 'test') {
  const project = await realpath(await mkdtemp(join(tmpdir(), 'stagecraft-handoff-')));
  t.after(() => rm(project, { recursive: true, force: true }));
  const state = await handoff('init', { project, entry, until, goal: 'Implement and verify converter' });
  await writeFile(join(project, 'code.mjs'), 'export const x = 1;');
  await writeFile(join(project, 'check.log'), 'actual observed check results');
  const receipt = join(project, 'receipt.json');
  async function submit(stage) {
    await writeFile(receipt, JSON.stringify({ stage, summary: 'Verified', artifacts: ['code.mjs'], evidence: [{ path: 'check.log', check: 'AC-1', method: 'node --test, exit 0', result: 'passed' }], next: 'test or deliver' }));
    return handoff('submit', { workflow: state.workflow, stage, receipt });
  }
  async function review(stage, decision = 'approved', submission) {
    const current = await handoff('status', { workflow: state.workflow });
    const record = join(project, 'review-input.json');
    await writeFile(record, JSON.stringify({ submission: submission ?? current.stages[stage].currentSubmission,
      decision, reviewer: 'user', source: 'test fixture: explicit user reply', comment: 'Fixture review response', presented: ['code.mjs preview and check.log'] }));
    return handoff('review', { workflow: state.workflow, stage, record });
  }
  async function complete(stage) {
    await submit(stage); await review(stage);
    return handoff('complete', { workflow: state.workflow, stage });
  }
  return { project, workflow: state.workflow, receipt, complete, submit, review };
}
test('idea-to-release workflow stops at every submission and revised artifacts need fresh approval', async t => {
  const r = await rig(t, 'discover', 'deploy');
  const stages = ['discover', 'spec', 'design', 'architect', 'build', 'test', 'deploy'];
  for (const [index, stage] of stages.entries()) {
    await handoff('begin', { ...r, stage });
    const submitted = await r.submit(stage);
    assert.equal(submitted.stages[stage].status, 'awaiting_review');
    await assert.rejects(handoff('complete', { ...r, stage }), /review approval/);
    for (const downstream of stages.slice(index + 1)) {
      await assert.rejects(handoff('begin', { ...r, stage: downstream }), /Upstream/);
    }
    await r.review(stage, 'changes_requested');
    await assert.rejects(handoff('complete', { ...r, stage }), /review approval/);
    await handoff('begin', { ...r, stage });
    const revision = await r.submit(stage);
    assert.notEqual(revision.stages[stage].currentSubmission, submitted.stages[stage].currentSubmission);
    await assert.rejects(r.review(stage, 'approved', submitted.stages[stage].currentSubmission), /current submission/);
    await assert.rejects(handoff('complete', { ...r, stage }), /review approval/);
    await r.review(stage);
    await handoff('complete', { ...r, stage });
  }
  const result = await handoff('status', r);
  for (const stage of stages) assert.equal(result.stages[stage].status, 'completed');
});
test('direct entry, target boundary and predecessor checks preserve evidence and legacy runs', async t => {
  const r = await rig(t);
  await mkdir(join(r.project, '.stagecraft/runs/legacy'), { recursive: true });
  await writeFile(join(r.project, '.stagecraft/runs/legacy/state.json'), '{"version":1}');
  await assert.rejects(handoff('begin', { ...r, stage: 'test' }), /Upstream/);
  await assert.rejects(handoff('begin', { ...r, stage: 'deploy' }), /outside/);
  await handoff('begin', { ...r, stage: 'build' });
  await r.complete('build');
  await handoff('begin', { ...r, stage: 'test' });
  const done = await r.complete('test');
  assert.equal(done.stages.test.status, 'completed');
  assert.match(done.stages.build.artifacts[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal(await readFile(join(r.project, '.stagecraft/runs/legacy/state.json'), 'utf8'), '{"version":1}');
});
test('changed upstream artifacts invalidate downstream completion and require revalidation', async t => {
  const r = await rig(t);
  await handoff('begin', { ...r, stage: 'build' }); await r.complete('build');
  await handoff('begin', { ...r, stage: 'test' }); await r.complete('test');
  await writeFile(join(r.project, 'code.mjs'), 'export const x = 2;');
  let state = await handoff('status', r);
  assert.equal(state.stages.build.status, 'stale'); assert.equal(state.stages.test.status, 'stale');
  await assert.rejects(handoff('begin', { ...r, stage: 'test' }), /Upstream/);
  await handoff('begin', { ...r, stage: 'build' }); await r.complete('build');
  await handoff('begin', { ...r, stage: 'test' }); state = await r.complete('test');
  assert.equal(state.stages.test.status, 'completed');
});
test('reject evidence-free completion, failed checks, unsafe paths and symlink artifacts', async t => {
  const r = await rig(t);
  await handoff('begin', { ...r, stage: 'build' });
  const receipt = { stage: 'build', summary: 'Claim', next: 'test', artifacts: ['code.mjs'], evidence: [] };
  await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('submit', { ...r, stage: 'build' }), /evidence/);
  receipt.evidence = [{ path: 'check.log', check: 'AC-1', method: 'npm test', result: 'failed' }];
  await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('submit', { ...r, stage: 'build' }), /passed checks/);
  receipt.evidence[0].result = 'passed'; receipt.artifacts = ['../outside'];
  await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('submit', { ...r, stage: 'build' }), /safe project-relative/);
  await symlink(join(r.project, 'code.mjs'), join(r.project, 'alias.mjs'));
  receipt.artifacts = ['alias.mjs']; await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('submit', { ...r, stage: 'build' }), /Symlink/);
  assert.equal((await handoff('status', r)).stages.build.status, 'in_progress');
});
test('blockers and concurrent writer locks never masquerade as completion', async t => {
  const r = await rig(t);
  await handoff('begin', { ...r, stage: 'build' });
  await handoff('block', { ...r, stage: 'build', reason: 'Dependency registry unavailable; restore network before retry' });
  await assert.rejects(handoff('begin', { ...r, stage: 'test' }), /Upstream/);
  await writeFile(join(r.workflow, '.handoff.lock'), JSON.stringify({ pid: process.pid }));
  await assert.rejects(handoff('status', r), /locked/);
  assert.ok(await readFile(join(r.workflow, '.handoff.lock')));
});

test('drafts cannot complete or unlock downstream; feedback binds to the presented revision', async t => {
  const r = await rig(t);
  await handoff('begin', { ...r, stage: 'build' });
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /review approval/);
  const submitted = await r.submit('build');
  assert.equal(submitted.stages.build.status, 'awaiting_review');
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /review approval/);
  await assert.rejects(handoff('begin', { ...r, stage: 'test' }), /Upstream/);
  await assert.rejects(r.review('build', 'approved', 'older-submission'), /current submission/);
  await r.review('build', 'changes_requested');
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /review approval/);
  await handoff('begin', { ...r, stage: 'build' });
  await writeFile(join(r.project, 'code.mjs'), 'export const x = 2;');
  const done = await r.complete('build');
  const history = done.stages.build.submissions;
  assert.equal(history.length, 2);
  assert.equal(history[0].review.decision, 'changes_requested');
  assert.equal(history[1].review.decision, 'approved');
  const oldCode = history[0].snapshots.find(f => f.original === 'code.mjs');
  assert.equal(await readFile(join(r.project, oldCode.path), 'utf8'), 'export const x = 1;');
  await handoff('begin', { ...r, stage: 'test' });
});
test('edits after submission or approval revoke completion and persist invalidation', async t => {
  const r = await rig(t);
  await handoff('begin', { ...r, stage: 'build' }); await r.submit('build');
  await writeFile(join(r.project, 'code.mjs'), 'changed before review');
  await assert.rejects(r.review('build'), /awaiting review/);
  assert.equal(JSON.parse(await readFile(join(r.workflow,'workflow.json'))).stages.build.status,'stale');
  await handoff('begin', { ...r, stage: 'build' }); await r.submit('build'); await r.review('build');
  await writeFile(join(r.project, 'check.log'), 'changed after approval');
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /review approval/);
  assert.equal((await handoff('status',r)).stages.build.status,'stale');
});
test('tampered archived content or review invalidates the current baseline', async t => {
  const r = await rig(t);
  await handoff('begin', { ...r, stage: 'build' });
  let done = await r.complete('build');
  let submission = done.stages.build.submissions.at(-1);
  await writeFile(join(r.project,submission.snapshots[0].path),'tampered snapshot');
  assert.equal((await handoff('status',r)).stages.build.status,'stale');
  await handoff('begin', { ...r, stage: 'build' }); done = await r.complete('build');
  submission = done.stages.build.submissions.at(-1);
  await writeFile(join(r.project,submission.review.record.path),'tampered review');
  assert.equal((await handoff('status',r)).stages.build.status,'stale');
});
test('legacy workflows retain old records but cannot bypass artifact review', async t => {
  const r = await rig(t);
  const path = join(r.workflow,'workflow.json');
  const legacy = JSON.parse(await readFile(path));
  legacy.schema = 'stagecraft-handoff/v1';
  legacy.stages.build = { status:'completed', summary:'legacy completion', artifacts:[], evidence:[] };
  await writeFile(path,JSON.stringify(legacy));
  const migrated = await handoff('status',r);
  assert.equal(migrated.schema,'stagecraft-handoff/v2');
  assert.equal(migrated.stages.build.status,'stale');
  assert.equal(migrated.stages.build.summary,'legacy completion');
  const { readdir } = await import('node:fs/promises');
  const backup = (await readdir(r.workflow)).find(f => f.startsWith('legacy-v1-'));
  assert.deepEqual(JSON.parse(await readFile(join(r.workflow,backup))),legacy);
  await assert.rejects(handoff('begin',{...r,stage:'test'}),/Upstream/);
});
test('agent self-review, missing presentation and invalid decisions cannot approve a stage', async t => {
  const r = await rig(t);
  await handoff('begin',{...r,stage:'build'});
  const submitted = await r.submit('build');
  const record = join(r.project,'invalid-review.json');
  const feedback = { submission:submitted.stages.build.currentSubmission, decision:'approved', reviewer:'agent',
    source:'self assessment',comment:'Looks good',presented:['code.mjs'] };
  const attempt = async () => {
    await writeFile(record,JSON.stringify(feedback));
    return handoff('review',{...r,stage:'build',record});
  };
  await assert.rejects(attempt(),/user response/);
  feedback.reviewer='user'; feedback.presented=[];
  await assert.rejects(attempt(),/presented/);
  feedback.presented=['code.mjs']; feedback.decision='default';
  await assert.rejects(attempt(),/decision/);
  assert.equal((await handoff('status',r)).stages.build.status,'awaiting_review');
});

async function linked(t) {
  const r = await rig(t);
  await handoff('begin',{...r,stage:'build'}); await r.complete('build');
  await handoff('begin',{...r,stage:'test'}); await r.complete('test');
  const record = join(r.project,'linkage.json');
  const graph = {nodes:[{id:'CODE-1',stage:'build',path:'code.mjs',label:'implementation'}, {id:'TC-1',stage:'test',path:'code.mjs',label:'tested contract'}],edges:[{from:'CODE-1',to:'TC-1',reason:'verifies'}]};
  await writeFile(record,JSON.stringify(graph)); await handoff('trace',{...r,record});
  return {...r,record,graph};
}
test('test-origin change traverses dependencies backwards, invalidates approvals and cannot close early',async t=>{
  const r=await linked(t);
  await writeFile(r.record,JSON.stringify({originStage:'test',roots:['TC-1'],summary:'Test exposes requirement mismatch',source:'explicit user change'}));
  let s=await handoff('change',{...r,record:r.record});
  assert.equal(s.schema,'stagecraft-handoff/v3');assert.equal(s.stages.build.status,'stale');assert.equal(s.stages.test.status,'stale');
  const c=s.changes[0];assert.deepEqual(c.impact.nodes.map(n=>n.id),['CODE-1','TC-1']);
  await writeFile(r.record,JSON.stringify({change:c.id,summary:'done',items:[]}));
  await assert.rejects(handoff('change-close',{...r,record:r.record}),/fresh verified/);
  await assert.rejects(handoff('trace',{...r,record:r.record}),/open changes/);
  await handoff('begin',{...r,stage:'build'});await r.complete('build');
  await handoff('begin',{...r,stage:'test'});await r.complete('test');
  await assert.rejects(handoff('change-close',{...r,record:r.record}),/each impacted node/);
  await writeFile(r.record,JSON.stringify({change:c.id,summary:'Revalidated both revised baselines',items:[{id:'CODE-1',action:'retained',reason:'No code change after clarified requirement',evidence:'check.log'},{id:'TC-1',action:'retained',reason:'Reviewed against clarified requirement',evidence:'check.log'}]}));
  s=await handoff('change-close',{...r,record:r.record});assert.equal(s.changes[0].status,'closed');
  assert.equal(s.stages.build.submissions.length,2);assert.equal(s.stages.test.submissions.length,2);
});
test('unmapped changes fall back to full workflow; unsafe or dangling trace entries are refused',async t=>{
  const r=await linked(t);
  await writeFile(r.record,JSON.stringify({originStage:'test',roots:['unknown'],summary:'Unmapped change',source:'user'}));
  const s=await handoff('change',{...r,record:r.record});assert.equal(s.changes[0].impact.conservative,true);assert.equal(s.stages.build.status,'stale');
  const fresh=await rig(t);
  for(const graph of [
    {nodes:[{id:'X',stage:'build',path:'../out',label:'unsafe'}],edges:[]},
    {nodes:[{id:'X',stage:'build',path:'code.mjs',label:'ok'}],edges:[{from:'X',to:'missing',reason:'bad'}]}
  ]) {await writeFile(fresh.receipt,JSON.stringify(graph));await assert.rejects(handoff('trace',{...fresh,record:fresh.receipt}),/safe project-relative|existing IDs/);}
});
test('file edits propagate backwards through trace links even when detected at a later stage',async t=>{
  const r=await rig(t);await writeFile(join(r.project,'cases.md'),'case v1');
  await handoff('begin',{...r,stage:'build'});await r.complete('build');
  await handoff('begin',{...r,stage:'test'});
  await writeFile(r.receipt,JSON.stringify({stage:'test',summary:'Test cases',next:'review',artifacts:['cases.md'],evidence:[{path:'check.log',check:'review',method:'inspection',result:'passed'}]}));
  await handoff('submit',{...r,stage:'test'});await r.review('test');await handoff('complete',{...r,stage:'test'});
  const record=join(r.project,'trace.json');
  await writeFile(record,JSON.stringify({nodes:[{id:'CODE',stage:'build',path:'code.mjs',label:'code'},{id:'TC',stage:'test',path:'cases.md',label:'cases'}],edges:[{from:'CODE',to:'TC',reason:'verifies'}]}));
  await handoff('trace',{...r,record});await writeFile(join(r.project,'cases.md'),'changed test expectation');
  const s=await handoff('status',r);assert.equal(s.stages.build.status,'stale');assert.equal(s.stages.test.status,'stale');
});
test('trace record tampering invalidates the baseline and persists after rejected transition',async t=>{
  const r=await linked(t);const s=await handoff('status',r);await writeFile(join(r.project,s.trace.record.path),'{}');
  await assert.rejects(handoff('complete',{...r,stage:'test'}),/review approval/);
  assert.equal((await handoff('status',r)).stages.build.status,'stale');
});
