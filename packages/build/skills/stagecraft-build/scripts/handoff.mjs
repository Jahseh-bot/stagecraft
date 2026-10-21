#!/usr/bin/env node
import { mkdir, readFile, writeFile, rename, lstat, realpath, open, rm } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, dirname, parse } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const stages = ['discover', 'spec', 'design', 'architect', 'build', 'test', 'deploy'];
const ensure = (ok, message) => { if (!ok) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
async function noLinks(path) {
  let cursor = parse(resolve(path)).root;
  for (const part of resolve(path).slice(cursor.length).split(/[\\/]/).filter(Boolean)) {
    cursor = join(cursor, part);
    try { ensure(!(await lstat(cursor)).isSymbolicLink(), `Symlink not allowed: ${cursor}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
async function record(project, path) {
  ensure(text(path) && !isAbsolute(path) && !path.includes('\\') && !path.split('/').some(p => !p || p === '..' || p === '.'), 'Use safe project-relative file paths');
  const absolute = resolve(project, path);
  ensure(!relative(project, absolute).startsWith('..'), 'File must stay inside project');
  await noLinks(absolute);
  ensure((await lstat(absolute)).isFile(), `Not a file: ${path}`);
  return { path, sha256: createHash('sha256').update(await readFile(absolute)).digest('hex') };
}
async function atomic(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); await rename(temporary, path); }
  finally { await rm(temporary, { force: true }); }
}
function invalidate(state, from, reason) {
  for (const stage of state.sequence.slice(from)) {
    const item = state.stages[stage];
    if (item.status !== 'pending') { item.status = 'stale'; item.reason = reason; }
  }
}
async function refresh(state) {
  for (const [index, stage] of state.sequence.entries()) {
    const item = state.stages[stage];
    if (item.status !== 'completed') continue;
    for (const file of [...item.artifacts, ...item.evidence]) {
      let same = false;
      try { same = (await record(state.project, file.path)).sha256 === file.sha256; } catch { /* missing or unsafe inputs invalidate the handoff */ }
      if (!same) { invalidate(state, index, `Changed or missing evidence: ${file.path}`); return; }
    }
  }
}
export async function handoff(command, options) {
  if (command === 'init') {
    const entry = options.entry, until = options.until ?? entry;
    ensure(stages.includes(entry) && stages.includes(until) && stages.indexOf(until) >= stages.indexOf(entry), 'Invalid entry/until stage');
    ensure(text(options.project) && text(options.goal), 'project and goal are required');
    await noLinks(resolve(options.project));
    const project = await realpath(resolve(options.project));
    const directory = join(project, '.stagecraft', 'workflows', randomUUID());
    await noLinks(directory);
    await mkdir(directory, { recursive: true });
    const sequence = stages.slice(stages.indexOf(entry), stages.indexOf(until) + 1);
    const state = { schema: 'stagecraft-handoff/v1', id: directory.split(/[\\/]/).at(-1), project,
      goal: options.goal, entry, until, sequence, decisions: [], createdAt: new Date().toISOString(),
      stages: Object.fromEntries(sequence.map(s => [s, { status: 'pending', artifacts: [], evidence: [] }])) };
    await atomic(join(directory, 'workflow.json'), state);
    return { workflow: directory, ...state };
  }
  ensure(text(options.workflow), 'workflow is required');
  const directory = resolve(options.workflow);
  await noLinks(directory);
  const lock = join(directory, '.handoff.lock');
  let handle;
  try { handle = await open(lock, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Workflow is locked; inspect the owner before recovering a stale lock.'); throw error; }
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    const file = join(directory, 'workflow.json');
    await noLinks(file);
    const state = JSON.parse(await readFile(file, 'utf8'));
    ensure(state.schema === 'stagecraft-handoff/v1' && Array.isArray(state.sequence), 'Unsupported handoff schema');
    ensure(state.sequence.length && state.sequence.every(s => stages.includes(s) && state.stages?.[s]), 'Invalid stage sequence');
    ensure(directory === join(state.project, '.stagecraft', 'workflows', state.id), 'Workflow location does not match project');
    await refresh(state);
    if (command !== 'status') {
      const stage = options.stage, index = state.sequence.indexOf(stage);
      ensure(index >= 0, 'Stage is outside the authorized entry/until range');
      const item = state.stages[stage];
      if (command === 'begin') {
        ensure(state.sequence.slice(0, index).every(s => state.stages[s].status === 'completed'), 'Upstream stages are incomplete or stale');
        ensure(item.status !== 'in_progress', 'Stage already in progress; checkpoint or explicitly block it before restarting');
        invalidate(state, index + 1, `Upstream stage restarted: ${stage}`);
        item.status = 'in_progress'; item.startedAt = new Date().toISOString(); delete item.reason;
      } else if (command === 'block') {
        ensure(text(options.reason), 'A concrete blocker is required');
        invalidate(state, index + 1, `Upstream stage blocked: ${stage}`);
        item.status = 'blocked'; item.reason = options.reason;
      } else if (command === 'complete') {
        ensure(item.status === 'in_progress', 'Begin this stage before completing it');
        ensure(state.sequence.slice(0, index).every(s => state.stages[s].status === 'completed'), 'Upstream stages became stale');
        ensure(text(options.receipt), 'receipt is required');
        const receipt = JSON.parse(await readFile(resolve(options.receipt), 'utf8'));
        ensure(receipt.stage === stage && text(receipt.summary) && text(receipt.next), 'receipt needs stage, summary and next');
        ensure(Array.isArray(receipt.artifacts) && receipt.artifacts.length > 0, 'At least one artifact is required');
        ensure(Array.isArray(receipt.evidence) && receipt.evidence.length > 0, 'Actual verification evidence is required');
        const artifacts = await Promise.all(receipt.artifacts.map(path => record(state.project, path)));
        const evidence = await Promise.all(receipt.evidence.map(async e => {
          ensure(text(e.check) && text(e.method) && e.result === 'passed', 'Completed stages require named, passed checks and actual methods');
          return { ...await record(state.project, e.path), check: e.check, method: e.method, result: e.result };
        }));
        ensure(receipt.decisions === undefined || (Array.isArray(receipt.decisions) && receipt.decisions.every(text)), 'decisions must be strings');
        item.status = 'completed'; item.summary = receipt.summary; item.next = receipt.next;
        item.artifacts = artifacts; item.evidence = evidence; item.completedAt = new Date().toISOString();
        delete item.reason;
        state.decisions.push(...(receipt.decisions ?? []).map(value => ({ stage, value })));
      } else throw new Error(`Unknown command: ${command}`);
    }
    state.updatedAt = new Date().toISOString();
    await atomic(file, state);
    return { workflow: directory, ...state };
  } finally { await handle.close(); await rm(lock, { force: true }); }
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || ['--help', 'help'].includes(command)) {
    console.log('init --project PATH --entry STAGE [--until STAGE] --goal TEXT\nstatus --workflow PATH\nbegin --workflow PATH --stage STAGE\ncomplete --workflow PATH --stage STAGE --receipt FILE\nblock --workflow PATH --stage STAGE --reason TEXT'); return;
  }
  const allowed = { init: ['project','entry','until','goal'], status: ['workflow'], begin: ['workflow','stage'], complete: ['workflow','stage','receipt'], block: ['workflow','stage','reason'] }[command];
  ensure(allowed, 'Unknown command');
  const options = {};
  while (args.length) {
    const flag = args.shift(); const key = flag.slice(2); const value = args.shift();
    ensure(flag.startsWith('--') && allowed.includes(key) && !(key in options) && text(value) && !value.startsWith('--'), `Invalid option: ${flag}`);
    options[key] = value;
  }
  console.log(JSON.stringify(await handoff(command, options), null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
