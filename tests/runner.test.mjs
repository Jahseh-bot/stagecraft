const releaseMetadata = JSON.parse(await readFile(new URL('../packages/runner/package.json', import.meta.url)));
const releaseScope = releaseMetadata.name.split('/')[0];
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir, hostname } from 'node:os';
import { createServer } from 'node:net';
import { createRun, readState, saveState, withLock } from '../packages/runner/src/store.mjs';
import { drive, answerRun } from '../packages/runner/src/engine.mjs';
import { runCommand } from '../packages/runner/src/process.mjs';
import { skillContext } from '../packages/runner/src/skills.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const done = (summary = 'Finished') => ({ status: 'done', summary, questions: [], plan: null });
async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function setup(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'stagecraft-engine-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, 'app');
  const prd = join(root, 'prd.md');
  await writeFile(prd, 'Convert Celsius to Fahrenheit. Confirm rounding. HTTP health endpoint.');
  const run = await createRun({ project, prd, stateRoot: join(root, 'runs'), maxRepairs: options.maxRepairs ?? 2, until: options.until ?? 'runnable' });
  const port = await freePort();
  const plan = {
    stack: 'Node.js built-ins', architecture: 'Pure conversion function and HTTP server',
    tasks: ['Implement conversion', 'Test public behavior', 'Serve local health endpoint'],
    checks: [{ name: 'conversion behavior', argv: [process.execPath, '--test', 'app.test.mjs'], timeoutMs: 5000 }],
    testFiles: ['app.test.mjs'],
    smoke: { argv: [process.execPath, 'server.mjs'], url: `http://127.0.0.1:${port}/health`,
      expectedStatus: 200, bodyIncludes: 'ok', timeoutMs: 3000 },
  };
  const calls = [];
  async function agent({ phase, state, signal }) {
    calls.push(phase);
    if (phase === 'clarify') {
      if (!state.decisions.some(d => d.answers.rounding)) return {
        status: 'needs_input', summary: 'Rounding needs a decision',
        questions: [{ id: 'rounding', question: 'How should results be rounded?', recommendation: 'Two decimals' }], plan: null,
      };
      return done();
    }
    if (phase === 'plan') return { ...done(), plan };
    if (phase === 'implement') {
      await writeFile(join(project, 'app.mjs'), 'export const convert = c => c * 9 / 5 + 31;');
      await writeFile(join(project, 'app.test.mjs'), `import test from 'node:test';
import assert from 'node:assert/strict';
import { convert } from './app.mjs';
test('known temperature examples', () => {
 assert.equal(convert(0), 32);
 assert.equal(convert(100), 212);
 assert.equal(convert(-40), -40);
});`);
      await writeFile(join(project, 'server.mjs'), `import { createServer } from 'node:http';
createServer((req,res)=>res.end('ok')).listen(${port},'127.0.0.1');`);
      if (options.interrupt && calls.filter(c => c === 'implement').length === 1) {
        options.interrupt();
        signal.throwIfAborted();
      }
      return done();
    }
    if (phase === 'repair') {
      if (options.repairQuestion && !state.decisions.some(d => d.answers.repair_choice)) {
        return { status: 'needs_input', summary: 'Need a product decision during repair', plan: null,
          questions: [{ id: 'repair_choice', question: 'Apply formula from PRD?', recommendation: 'yes' }] };
      }
      if (options.tamper) await writeFile(join(project, 'app.test.mjs'), 'process.exit(0)');
      else if (!options.neverRepair) await writeFile(join(project, 'app.mjs'), 'export const convert = c => c * 9 / 5 + 32;');
      return done();
    }
    throw new Error(`Unexpected phase ${phase}`);
  }
  async function approve() {
    let state = await drive(run, { agent });
    assert.equal(state.pending.kind, 'agent');
    await answerRun(run, { rounding: 'Two decimals' });
    state = await drive(run, { agent });
    assert.equal(state.pending.kind, 'plan_approval');
    assert.equal(calls.includes('implement'), false);
    await answerRun(run, { approve_plan: 'yes' });
  }
  return { root, project, run, plan, agent, calls, approve };
}

test('PRD questions → approved architecture → actual failing tests → repair → live HTTP smoke', async t => {
  const rig = await setup(t);
  await rig.approve();
  const state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.status, 'completed');
  assert.equal(state.repairsUsed, 1);
  assert.equal(state.verification.length, 2);
  assert.equal(state.verification[0].ok, false);
  assert.match(state.verification[0].results[0].tail, /31 !== 32/);
  assert.equal(state.verification[1].results.at(-1).kind, 'smoke');
  assert.equal(state.verification[1].ok, true);
  const oldCalls = rig.calls.length;
  await drive(rig.run, { agent: rig.agent });
  assert.equal(rig.calls.length, oldCalls, 'completed run must not re-execute');
  await assert.rejects(fetch(rig.plan.smoke.url), 'smoke server must be stopped');
});

test('repair budget requires human intervention, grants only one extra repair', async t => {
  const rig = await setup(t, { maxRepairs: 0 });
  await rig.approve();
  let state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.pending.kind, 'repair_budget');
  assert.equal(state.repairsUsed, 0);
  await assert.rejects(answerRun(rig.run, { unknown: 'yes' }), /exactly/);
  await answerRun(rig.run, { resume_action: 'retry' });
  state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.status, 'completed');
  assert.equal(state.repairLimit, 1);
});

test('mid-repair question persists; answers resume the repair without repeating planning', async t => {
  const rig = await setup(t, { repairQuestion: true });
  await rig.approve();
  let state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.pending.kind, 'agent');
  assert.equal(state.phase, 'repair');
  assert.equal(state.repairsUsed, 0);
  const before = rig.calls.length;
  await drive(rig.run, { agent: rig.agent });
  assert.equal(rig.calls.length, before);
  await answerRun(rig.run, { repair_choice: 'yes' });
  state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.status, 'completed');
  assert.equal(rig.calls.filter(c => c === 'plan').length, 1);
});

test('interruption retains decisions and resumes unfinished implementation', async t => {
  const controller = new AbortController();
  const rig = await setup(t, { interrupt: () => controller.abort() });
  await rig.approve();
  let state = await drive(rig.run, { agent: rig.agent, signal: controller.signal });
  assert.equal(state.status, 'paused');
  assert.equal(state.phase, 'implement');
  const saved = await readState(rig.run);
  assert.equal(saved.decisions.length, 2);
  state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.status, 'completed');
  assert.equal(rig.calls.filter(c => c === 'plan').length, 1);
});

test('repair cannot get green by rewriting acceptance tests', async t => {
  const rig = await setup(t, { tamper: true });
  await rig.approve();
  const state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.status, 'waiting_input');
  assert.equal(state.pending.kind, 'test_integrity');
  assert.equal(state.verification.length, 1);
});

test('malformed agent output and missing executables never mark a run complete', async t => {
  const rig = await setup(t);
  let state = await drive(rig.run, { agent: async () => ({ status: 'done' }) });
  assert.equal(state.pending.kind, 'execution_error');
  await answerRun(rig.run, { resume_action: 'retry' });
  rig.plan.checks[0].argv = ['stagecraft-intentionally-missing-command'];
  await rig.approve();
  state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.pending.kind, 'environment');
  assert.equal(state.repairsUsed, 0);
});

test('single owner lock and crash reconciliation', async t => {
  const rig = await setup(t);
  await withLock(rig.run, async () => {
    await assert.rejects(drive(rig.run, { agent: rig.agent }), /already active/);
  });
  const state = await readState(rig.run);
  state.status = 'running';
  await saveState(rig.run, state);
  // Use a nonexistent PID without assuming a particular large PID is free.
  await writeFile(join(rig.run, 'runner.lock'), JSON.stringify({ pid: 2147483647, host: hostname() }));
  const resumed = await drive(rig.run, { agent: rig.agent });
  assert.equal(resumed.pending.kind, 'crash_recovery');
  assert.equal(rig.calls.length, 0);
  await answerRun(rig.run, { resume_action: 'retry' });
  const next = await drive(rig.run, { agent: rig.agent });
  assert.equal(next.pending.kind, 'agent');
});

test('command timeout and abort terminate actual child processes', async t => {
  const rig = await setup(t);
  const result = await runCommand([process.execPath, '-e', 'setInterval(()=>{},1000)'], {
    cwd: rig.project, log: join(rig.root, 'timeout.log'), timeoutMs: 150,
  });
  assert.equal(result.ok, false);
  assert.equal(result.timedOut, true);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100);
  try {
    await assert.rejects(runCommand([process.execPath, '-e', 'setInterval(()=>{},1000)'], {
      cwd: rig.project, log: join(rig.root, 'abort.log'), timeoutMs: 5000, signal: controller.signal,
    }), /abort/i);
  } finally { clearTimeout(timer); }
});

test('upstream skill sources are pinned per run and changes are rejected', async t => {
  const rig = await setup(t);
  const lock = JSON.parse(await readFile(join(rig.run, 'skills.lock.json')));
  assert.ok(lock.skills.length >= 7);
  assert.match(await skillContext(rig.run, 'implement'), /Test-Driven Development/);
  const file = join(rig.run, 'skills', 'tdd', 'SKILL.md');
  await writeFile(file, 'modified');
  await assert.rejects(skillContext(rig.run, 'implement'), /snapshot changed/);
});

test('external skills profile is replaceable without changing engine code', async t => {
  const rig = await setup(t);
  const custom = join(rig.root, 'custom');
  await mkdir(custom);
  await writeFile(join(custom, 'SKILL.md'), '---\nname: custom\ndescription: Local method\n---\nUse local convention.');
  const profile = join(rig.root, 'profile.json');
  await writeFile(profile, JSON.stringify({
    version: 1, skills: [{ id: 'custom', path: 'custom', source: 'local', revision: 'v1', license: 'private' }],
    phases: { clarify: ['custom'], plan: [], implement: ['custom'], repair: [] },
  }));
  const run = await createRun({ project: rig.project, prd: join(rig.root, 'prd.md'), stateRoot: join(rig.root, 'custom-runs'), skillsProfile: profile });
  assert.match(await skillContext(run, 'implement'), /Use local convention/);
});

test('actual CLI SIGINT persists paused state and terminates the agent child', async t => {
  const rig = await setup(t);
  await rig.approve();
  const executable = join(rig.root, 'fake-codex');
  const marker = join(rig.root, 'agent.pid');
  await writeFile(executable, `#!${process.execPath}
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, String(process.pid));
setInterval(()=>{},1000);
`);
  // .mjs is required outside a package with type:module.
  const script = `${executable}.mjs`;
  await writeFile(script, await readFile(executable));
  await chmod(script, 0o755);
  const cli = fileURLToPath(new URL('../packages/runner/bin/cli.mjs', import.meta.url));
  const child = spawn(process.execPath, [cli, 'resume', '--run', rig.run], {
    env: { ...process.env, STAGECRAFT_CODEX_BIN: script }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  let output = '';
  child.stderr.on('data', data => { output += data; });
  child.stdout.resume();
  const exited = new Promise(resolve => child.on('close', code => resolve(code)));
  let pid;
  for (let i = 0; i < 100; i++) {
    try { pid = Number(await readFile(marker, 'utf8')); break; } catch {}
    await delay(30);
  }
  assert.ok(pid, output);
  child.kill('SIGINT');
  assert.equal(await exited, 130);
  assert.equal((await readState(rig.run)).status, 'paused');
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  const state = await drive(rig.run, { agent: rig.agent });
  assert.equal(state.status, 'completed');
});

test('runner tarball contains independent executable and pinned third-party resources', async t => {
  const root = await mkdtemp(join(tmpdir(), 'stagecraft-runner-pack-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const packageRoot = fileURLToPath(new URL('../packages/runner/', import.meta.url));
  const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', root], {
    cwd: packageRoot, encoding: 'utf8',
  }))[0];
  const paths = packed.files.map(file => file.path);
  assert.ok(paths.includes('vendor/mattpocock/LICENSE'));
  assert.ok(paths.includes('skills.profile.json'));
  const consumer = join(root, 'consumer');
  await mkdir(consumer);
  await writeFile(join(consumer, 'package.json'), '{"private":true}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(root, packed.filename)], {
    cwd: consumer, encoding: 'utf8',
  });
  const installed = join(consumer, 'node_modules', releaseScope, 'runner');
  const output = execFileSync(process.execPath, [join(installed, 'bin', 'cli.mjs'), '--help'], { encoding: 'utf8' });
  assert.match(output, /stagecraft start/);
  const module = await import(`file://${join(installed, 'src', 'skills.mjs')}`);
  await module.snapshotSkills(join(root, 'snapshotted'));
  assert.match(await module.skillContext(join(root, 'snapshotted'), 'repair'), /Diagnosing Bugs/);
});

test('PRD delivery goal continues from verified build into deployment discovery in the same run', async t => {
  const rig = await setup(t, { until: 'deploy' });
  await rig.approve();
  const agent = async request => request.phase === 'deploy_discover'
    ? { status: 'needs_input', summary: 'Confirm local deployment', questions: [{ id: 'port', question: 'Which local port?', recommendation: '43193' }], plan: null, setup: null }
    : rig.agent(request);
  const state = await drive(rig.run, { agent });
  assert.equal(state.status, 'waiting_input');
  assert.equal(state.phase, 'deploy_discover');
  assert.equal(state.buildDelivery.plan.stack, rig.plan.stack);
  assert.equal(state.verification[state.buildDelivery.verificationIndex].ok, true);
  assert.ok(state.events.some(e => e.type === 'build_verified_continuing_to_deploy'));
});

test('CLI explicit stack does not become a skills profile filename', async t => {
  const root = await mkdtemp(join(tmpdir(), 'stagecraft-cli-stack-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const prd = join(root, 'prd.md'); await writeFile(prd, 'A task board');
  await runCommand([process.execPath, '--input-type=module', '-e', `process.env.STAGECRAFT_CODEX_BIN='/usr/bin/false'; process.argv.splice(1,0,'stagecraft'); await import(${JSON.stringify(new URL('../packages/runner/bin/cli.mjs', import.meta.url).href)});`, 'start', '--prd', prd, '--dir', join(root, 'app'), '--state-root', join(root, 'runs'), '--stack', 'vue,fastify,postgres', '--agent-timeout-ms', '100'], { cwd: root, timeoutMs: 10000, log: join(root, 'cli.log') });
  const { readdir } = await import('node:fs/promises');
  const runs = await readdir(join(root, 'runs')); assert.equal(runs.length, 1);
  const state = await readState(join(root, 'runs', runs[0]));
  assert.deepEqual(state.technologies, ['vue', 'fastify', 'postgres']);
});

test('aborting an agent also kills commands detached into separate process groups', async t => {
  if (process.platform === 'win32') return;
  const root = await mkdtemp(join(tmpdir(), 'stagecraft-detached-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pidfile = join(root, 'child.pid');
  await writeFile(join(root, 'child.mjs'), `import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(pidfile)},String(process.pid)); process.on('SIGTERM',()=>{}); setInterval(()=>{},1000);`);
  await writeFile(join(root, 'parent.mjs'), `import {spawn} from 'node:child_process'; spawn(process.execPath,['child.mjs'],{detached:true,stdio:'ignore'}); setInterval(()=>{},1000);`);
  const controller = new AbortController();
  const running = runCommand([process.execPath, 'parent.mjs'], { cwd: root, log: join(root,'log'), signal: controller.signal, timeoutMs:10000 });
  let pid;
  for (let i=0;i<100;i++) { try { pid=Number(await readFile(pidfile,'utf8')); break; } catch { await delay(20); } }
  assert.ok(pid, 'detached child started');
  t.after(()=>{try{process.kill(pid,'SIGKILL')}catch{}});
  controller.abort(new Error('pause test'));
  await assert.rejects(running,/pause test/);
  await delay(100);
  assert.throws(()=>process.kill(pid,0), {code:'ESRCH'});
});
