import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { createRun, readState, saveState } from '../packages/runner/src/store.mjs';
import { drive, answerRun } from '../packages/runner/src/engine.mjs';
import { validateTarget } from '../packages/runner/src/deployment.mjs';

const done = plan => ({ status: 'done', summary: 'Reviewed existing project', questions: [], plan: plan ?? null });
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'stagecraft-entry-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, 'app'); await mkdir(project);
  await writeFile(join(project, 'app.mjs'), 'export const convert = c => c * 9/5 + 31;');
  const testSource = `import test from 'node:test'; import assert from 'node:assert/strict'; import {convert} from './app.mjs'; test('freezing',()=>assert.equal(convert(0),32));`;
  await writeFile(join(project, 'app.test.mjs'), testSource);
  const plan = { stack: 'Existing Node', architecture: 'Preserve project', tasks: ['Verify conversion'],
    checks: [{ name: 'behavior', argv: [process.execPath, '--test', 'app.test.mjs'], timeoutMs: 3000 }],
    testFiles: ['app.test.mjs'], smoke: null };
  return { root, project, plan, testSource };
}
for (const mode of ['audit', 'repair']) test(`direct test ${mode} skips PRD and implementation, executes real checks`, async t => {
  const f = await fixture(t); const phases = [];
  const run = await createRun({ project: f.project, entry: 'test', mode, stateRoot: join(f.root, 'runs') });
  const agent = async ({phase}) => {
    phases.push(phase);
    if (phase === 'test_plan') return done(f.plan);
    assert.equal(phase, 'repair');
    await writeFile(join(f.project, 'app.mjs'), 'export const convert = c => c * 9/5 + 32;');
    return done();
  };
  assert.equal((await drive(run,{agent})).pending.kind, 'plan_approval');
  await answerRun(run,{approve_plan:'yes'});
  const state = await drive(run,{agent});
  assert.equal(state.status,'completed');
  assert.equal(state.outcome,mode === 'repair' ? 'passed' : 'failed');
  assert.deepEqual(phases,mode === 'repair' ? ['test_plan','repair'] : ['test_plan']);
  assert.equal(await readFile(join(f.project,'app.test.mjs'),'utf8'),f.testSource);
  assert.match(state.verification[0].results[0].tail,/31 !== 32/);
});
test('missing tests are created after approval, then frozen before repair', async t => {
  const f=await fixture(t); await rm(join(f.project,'app.test.mjs'));
  const run=await createRun({project:f.project,entry:'test',mode:'repair',stateRoot:join(f.root,'runs')});
  const phases=[]; const agent=async({phase})=>{
    phases.push(phase);
    if(phase==='test_plan')return done(f.plan);
    if(phase==='test_prepare')await writeFile(join(f.project,'app.test.mjs'),f.testSource);
    else if(phase==='repair')await writeFile(join(f.project,'app.mjs'),'export const convert = c => c * 9/5 + 32;');
    else assert.fail(phase);
    return done();
  };
  await drive(run,{agent});await answerRun(run,{approve_plan:'yes'});
  assert.equal((await drive(run,{agent})).outcome,'passed');
  assert.deepEqual(phases,['test_plan','test_prepare','repair']);
});
test('existing tests cannot be rewritten while adding coverage', async t=>{
  const f=await fixture(t);f.plan.testFiles.push('extra.test.mjs');
  const run=await createRun({project:f.project,entry:'test',mode:'repair',stateRoot:join(f.root,'runs')});
  const agent=async({phase})=>{
    if(phase==='test_plan')return done(f.plan);
    await writeFile(join(f.project,'app.test.mjs'),'process.exit(0)');
    await writeFile(join(f.project,'extra.test.mjs'),f.testSource);return done();
  };
  await drive(run,{agent});await answerRun(run,{approve_plan:'yes'});
  const state=await drive(run,{agent});assert.equal(state.status,'waiting_input');assert.match(state.pending.detail,/Existing acceptance test changed/);
});
test('deployment rejects remote target health URLs and unsafe files',()=>{
  const target={provider:'compose',context:'local',projectName:'test',file:'compose.yaml',url:'http://127.0.0.1:43189/health',expectedStatus:200,bodyIncludes:'ok',timeoutMs:1000};
  assert.equal(validateTarget(target).provider,'compose');
  for(const patch of [{url:'https://example.com'},{file:'../compose.yaml'},{context:'--host'},{projectName:'-other'},{timeoutMs:0}])assert.throws(()=>validateTarget({...target,...patch}));
});
async function deploymentFixture(t) {
  const f=await fixture(t);const bin=join(f.root,'bin');await mkdir(bin);
  const callLog=join(f.root,'calls.jsonl');
  const docker=join(bin,'docker');
  await writeFile(docker,`#!/usr/bin/env node
import {appendFileSync} from 'node:fs';
const args=process.argv.slice(2);appendFileSync(${JSON.stringify(callLog)},JSON.stringify(args)+'\\n');
if(args[0]==='context')console.log('unix:///test.sock');
else if(args.includes('config')) {console.error('a harmless stderr warning');console.log(JSON.stringify({services:{web:{image:'example'}}}));}
else if(args.includes('ps'))console.log(JSON.stringify({Service:'web',State:'running',Health:'healthy'}));
else if(args.includes('up'))console.log('started');
else process.exit(1);
`);await chmod(docker,0o755);
  // Node treats extensionless executable as ESM because its source contains import.
  const oldPath=process.env.PATH;process.env.PATH=`${bin}:${oldPath}`;t.after(()=>{process.env.PATH=oldPath;});
  const server=createServer((req,res)=>res.end('ok'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const target={provider:'compose',context:'local',projectName:'entry-test',file:'compose.yaml',url:`http://127.0.0.1:${server.address().port}/health`,expectedStatus:200,bodyIncludes:'ok',timeoutMs:3000};
  await writeFile(join(f.project,'compose.yaml'),'services: {}');
  const run=await createRun({project:f.project,entry:'deploy',target,stateRoot:join(f.root,'runs')});
  const plan={...f.plan,testFiles:[],checks:[{name:'preflight',argv:[process.execPath,'--check','app.mjs'],timeoutMs:3000}]};
  const phases=[];const agent=async({phase})=>{phases.push(phase);assert.equal(phase,'deploy_plan');return done(plan);};
  return {...f,run,target,phases,agent,callLog};
}
test('deployment applies once, verifies persistent service and records scoped cleanup', async t=>{
  const f=await deploymentFixture(t);
  assert.equal((await drive(f.run,{agent:f.agent})).pending.kind,'plan_approval');
  await answerRun(f.run,{approve_plan:'yes'});
  const state=await drive(f.run,{agent:f.agent});assert.equal(state.status,'completed');
  assert.deepEqual(f.phases,['deploy_plan']);assert.equal(await (await fetch(f.target.url)).text(),'ok');
  assert.equal(state.deployment.cleanupArgv.at(-1),'down');
  await drive(f.run,{agent:f.agent});
  const calls=(await readFile(f.callLog,'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(calls.filter(a=>a.includes('up')).length,1);
});
test('interruption after apply resumes health reconciliation without repeating deployment', async t=>{
  const f=await deploymentFixture(t);await drive(f.run,{agent:f.agent});await answerRun(f.run,{approve_plan:'yes'});
  const controller=new AbortController();
  const paused=await drive(f.run,{agent:f.agent,signal:controller.signal,onEvent:e=>{if(e.type==='deployment_applied')controller.abort();}});
  assert.equal(paused.status,'paused');assert.equal(paused.phase,'deploy_verify');
  assert.equal((await drive(f.run,{agent:f.agent})).status,'completed');
  const calls=(await readFile(f.callLog,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(calls.filter(a=>a.includes('up')).length,1);
});
test('modified approved Compose config prevents apply',async t=>{
  const f=await deploymentFixture(t);await drive(f.run,{agent:f.agent});await answerRun(f.run,{approve_plan:'yes'});
  await writeFile(join(f.run,'compose.approved.json'),'{}');
  const state=await drive(f.run,{agent:f.agent});assert.equal(state.status,'waiting_input');assert.match(state.pending.detail,/config changed/);
  const calls=(await readFile(f.callLog,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(calls.filter(a=>a.includes('up')).length,0);
});
test('healthy containers cannot mask failed deployment, reconciliation requires explicit acknowledgement',async t=>{
  const f=await deploymentFixture(t);await drive(f.run,{agent:f.agent});await answerRun(f.run,{approve_plan:'yes'});
  const docker=join(f.root,'bin','docker');const code=await readFile(docker,'utf8');
  await writeFile(docker,code.replace("console.log('started');","process.exit(17);"));
  let state=await drive(f.run,{agent:f.agent});assert.equal(state.status,'waiting_input');assert.equal(state.deployment.apply.ok,false);
  await answerRun(f.run,{resume_action:'retry'});state=await drive(f.run,{agent:f.agent});assert.equal(state.status,'waiting_input');
  await answerRun(f.run,{resume_action:'manual_fix'});state=await drive(f.run,{agent:f.agent});assert.equal(state.status,'completed');
  const calls=(await readFile(f.callLog,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(calls.filter(a=>a.includes('up')).length,1);
});
test('deployment discovers missing config, asks questions, confirms files then deploys without PRD', async t => {
  const f = await deploymentFixture(t);
  await rm(join(f.project,'compose.yaml'));
  const run = await createRun({project:f.project,entry:'deploy',stateRoot:join(f.root,'auto-runs')});
  const setup = {stack:'Node.js',evidence:['app.mjs exports conversion'],target:f.target,files:[
    {path:'Dockerfile',content:'FROM node:22-alpine\n'},
    {path:'compose.yaml',content:'services:\n  web:\n    build: .\n'},
  ]};
  const phases=[];
  const agent=async({phase,state})=>{
    phases.push(phase);
    if(phase==='deploy_discover') {
      if(!state.decisions.length)return {status:'needs_input',summary:'Choose local port',questions:[{id:'port',question:'Use this local port?',recommendation:'yes'}],plan:null,setup:null};
      return {...done(),setup};
    }
    return f.agent({phase});
  };
  assert.equal((await drive(run,{agent})).pending.kind,'agent');
  await answerRun(run,{port:'yes'});
  assert.equal((await drive(run,{agent})).pending.kind,'setup_approval');
  await assert.rejects(readFile(join(f.project,'Dockerfile')),{code:'ENOENT'});
  await answerRun(run,{approve_setup:'yes'});
  assert.equal((await drive(run,{agent})).pending.kind,'plan_approval');
  assert.equal(await readFile(join(f.project,'Dockerfile'),'utf8'),setup.files[0].content);
  await answerRun(run,{approve_plan:'yes'});
  assert.equal((await drive(run,{agent})).status,'completed');
  assert.deepEqual(phases,['deploy_discover','deploy_discover','deploy_plan']);
});
test('generation refuses overwrite including files added after proposal',async t=>{
  const f=await fixture(t);
  const target={provider:'compose',context:'local',projectName:'test',file:'compose.yaml',url:'http://127.0.0.1:43191/health',expectedStatus:200,bodyIncludes:'ok',timeoutMs:3000};
  const run=await createRun({project:f.project,entry:'deploy',target,stateRoot:join(f.root,'runs')});
  const agent=async()=>({...done(),setup:{stack:'Node',evidence:['app.mjs'],target,files:[{path:'Dockerfile',content:'FROM node:22\n'}]}});
  assert.equal((await drive(run,{agent})).pending.kind,'setup_approval');
  await writeFile(join(f.project,'Dockerfile'),'user content');
  await answerRun(run,{approve_setup:'yes'});
  const state=await drive(run,{agent});assert.equal(state.status,'waiting_input');assert.match(state.pending.detail,/overwrite/);
  assert.equal(await readFile(join(f.project,'Dockerfile'),'utf8'),'user content');
});
test('configuration writing resumes after durable intent and rejects traversal',async t=>{
  const {writeSetup,validateSetup}=await import('../packages/runner/src/deployment-setup.mjs');
  const f=await fixture(t);
  const target={provider:'compose',context:'local',projectName:'test',file:'compose.yaml',url:'http://127.0.0.1:43191/health',expectedStatus:200,bodyIncludes:'ok',timeoutMs:3000};
  const setup={stack:'Node',evidence:['app.mjs'],target,files:[{path:'Dockerfile',content:'FROM node:22\n'},{path:'compose.yaml',content:'services: {}\n'}]};
  assert.throws(()=>validateSetup({...setup,files:[{path:'../Dockerfile',content:'bad'}]}));
  const state={project:f.project,target,approvedSetup:setup,setupWriteIntent:true};
  await writeFile(join(f.project,'Dockerfile'),setup.files[0].content);
  await writeSetup(state,async()=>{});
  assert.equal(Object.keys(state.generatedFiles).length,2);
});

test('a PRD-origin run approves the deployment plan without returning to implementation',async t=>{
  const f=await deploymentFixture(t);await drive(f.run,{agent:f.agent});
  const before=await readState(f.run);before.entry='prd';before.until='deploy';await saveState(f.run,before);
  await answerRun(f.run,{approve_plan:'yes'});
  assert.equal((await readState(f.run)).phase,'deploy');
  assert.equal((await drive(f.run,{agent:f.agent})).status,'completed');
});

test('image build time does not consume the container health timeout', async t => {
  const f = await deploymentFixture(t);
  await drive(f.run, {agent: f.agent});
  const state = await readState(f.run);
  state.target.timeoutMs = 100;
  const docker = join(f.root, 'bin', 'docker');
  await writeFile(docker, (await readFile(docker, 'utf8')).replace("console.log('started');", "{ await new Promise(resolve=>setTimeout(resolve,300)); console.log('started'); }"));
  const { applyDeployment } = await import('../packages/runner/src/deployment.mjs');
  const result = await applyDeployment(state, f.run);
  assert.equal(result.ok, true);
  assert.ok(result.durationMs >= 300);
});
