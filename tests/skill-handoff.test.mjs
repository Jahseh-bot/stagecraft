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
  async function complete(stage) {
    await writeFile(receipt, JSON.stringify({ stage, summary: 'Verified', artifacts: ['code.mjs'], evidence: [{ path: 'check.log', check: 'AC-1', method: 'node --test, exit 0', result: 'passed' }], next: 'test or deliver' }));
    return handoff('complete', { workflow: state.workflow, stage, receipt });
  }
  return { project, workflow: state.workflow, receipt, complete };
}
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
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /evidence/);
  receipt.evidence = [{ path: 'check.log', check: 'AC-1', method: 'npm test', result: 'failed' }];
  await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /passed checks/);
  receipt.evidence[0].result = 'passed'; receipt.artifacts = ['../outside'];
  await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /safe project-relative/);
  await symlink(join(r.project, 'code.mjs'), join(r.project, 'alias.mjs'));
  receipt.artifacts = ['alias.mjs']; await writeFile(r.receipt, JSON.stringify(receipt));
  await assert.rejects(handoff('complete', { ...r, stage: 'build' }), /Symlink/);
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
