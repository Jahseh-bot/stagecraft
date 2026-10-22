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
function impact(state, roots = []) {
  const graph = state.trace?.graph;
  const currentCoverage = graph && state.sequence.every(stage => state.stages[stage].artifacts.every(a => graph.nodes.some(n => n.path === a.path && n.stage === stage)));
  // Missing mapping is uncertainty, never proof of independence.
  if (!graph || !currentCoverage || !state.trace.coverageComplete || !roots.length || roots.some(id => !graph.nodes.some(n => n.id === id)))
    return { nodes: graph?.nodes ?? [], stages: [...state.sequence], conservative: true };
  const reached = new Set(roots);
  let changed = true;
  while (changed) {
    changed = false;
    const paths = new Set(graph.nodes.filter(n => reached.has(n.id)).map(n => n.path));
    for (const node of graph.nodes) if (paths.has(node.path) && !reached.has(node.id)) { reached.add(node.id); changed = true; }
    for (const edge of graph.edges) {
      if (reached.has(edge.from) || reached.has(edge.to)) {
        for (const id of [edge.from, edge.to]) if (!reached.has(id)) { reached.add(id); changed = true; }
      }
    }
  }
  const nodes = graph.nodes.filter(n => reached.has(n.id));
  return { nodes, stages: [...new Set(nodes.map(n => n.stage))], conservative: false };
}
function invalidate(state, from, reason, paths = []) {
  if (paths.length && state.trace) {
    const roots = state.trace.graph.nodes.filter(n => paths.includes(n.path)).map(n => n.id);
    const affected = impact(state, roots);
    from = Math.min(from, ...affected.stages.map(s => state.sequence.indexOf(s)));
  }
  for (const stage of state.sequence.slice(from)) {
    const item = state.stages[stage];
    if (item.status !== 'pending') { item.status = 'stale'; item.reason = reason; }
  }
}
async function snapshotRecord(state, directory, category, value) {
  const path = join(directory, category, randomUUID() + '.json');
  await noLinks(path); await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return record(state.project, relative(state.project, path));
}
async function refresh(state) {
  for (const saved of [state.trace?.record, ...(state.changes ?? []).flatMap(c => [c.record, c.resolution?.record])].filter(Boolean)) {
    let same = false;
    try { same = (await record(state.project, saved.path)).sha256 === saved.sha256; } catch {}
    if (!same) { invalidate(state, 0, `Changed linkage/change record: ${saved.path}`); return; }
  }
  for (const [index, stage] of state.sequence.entries()) {
    const item = state.stages[stage];
    if (!['completed', 'awaiting_review', 'approved'].includes(item.status)) continue;
    const submission = item.submissions?.find(s => s.id === item.currentSubmission);
    if (!submission) { invalidate(state, index, 'Missing artifact review; submit current deliverables for review'); return; }
    for (const file of [...item.artifacts, ...item.evidence, ...submission.snapshots, ...(submission.review ? [submission.review.record] : [])]) {
      let same = false;
      try { same = (await record(state.project, file.path)).sha256 === file.sha256; } catch { /* missing or unsafe inputs invalidate the handoff */ }
      if (!same) { invalidate(state, index, `Changed or missing evidence: ${file.path}`, [file.path, file.original].filter(Boolean)); return; }
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
    const state = { schema: 'stagecraft-handoff/v2', id: directory.split(/[\\/]/).at(-1), project,
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
    ensure(['stagecraft-handoff/v1', 'stagecraft-handoff/v2', 'stagecraft-handoff/v3'].includes(state.schema) && Array.isArray(state.sequence), 'Unsupported handoff schema');
    ensure(state.sequence.length && state.sequence.every(s => stages.includes(s) && state.stages?.[s]), 'Invalid stage sequence');
    ensure(directory === join(state.project, '.stagecraft', 'workflows', state.id), 'Workflow location does not match project');
    if (state.schema === 'stagecraft-handoff/v1') {
      await atomic(join(directory, 'legacy-v1-' + randomUUID() + '.json'), state);
      state.schema = 'stagecraft-handoff/v2';
      invalidate(state, 0, 'Legacy workflow requires artifact presentation and review; old evidence retained');
    }
    await refresh(state);
    // Persist invalidation even when the requested transition is subsequently refused.
    await atomic(file, state);
    if (['trace', 'change', 'change-close'].includes(command)) {
      ensure(text(options.record), 'record is required');
      const input = JSON.parse(await readFile(resolve(options.record), 'utf8'));
      state.changes ??= [];
      if (command === 'trace') {
        ensure(!state.changes.some(c => c.status === 'open'), 'Resolve open changes before replacing the trace graph');
        ensure(Array.isArray(input.nodes) && input.nodes.length && Array.isArray(input.edges), 'Trace requires nodes and edges');
        const ids = new Set();
        for (const node of input.nodes) {
          ensure(text(node.id) && !ids.has(node.id) && state.sequence.includes(node.stage), 'Trace needs unique IDs and authorized stages');
          ensure(text(node.label), 'Trace node needs a descriptive label');
          await record(state.project, node.path); ids.add(node.id);
        }
        for (const edge of input.edges) ensure(ids.has(edge.from) && ids.has(edge.to) && text(edge.reason), 'Trace edge requires existing IDs and a reason');
        // Complete file coverage is required; omitted artifacts force conservative impact below.
        const known = state.sequence.flatMap(stage => state.stages[stage].artifacts.map(a => ({ stage, path: a.path })));
        const coverageComplete = known.every(a => input.nodes.some(n => n.path === a.path && n.stage === a.stage));
        state.traceHistory ??= []; if (state.trace) state.traceHistory.push(state.trace);
        state.trace = { graph: input, coverageComplete, record: await snapshotRecord(state, directory, 'trace', input) };
      } else if (command === 'change') {
        ensure(text(input.summary) && text(input.source) && state.sequence.includes(input.originStage), 'Change needs summary, source and authorized originStage');
        ensure(Array.isArray(input.roots) && input.roots.every(text), 'Change roots must be node IDs (empty means conservative full impact)');
        const affected = state.trace?.coverageComplete ? impact(state, input.roots) : { nodes: state.trace?.graph.nodes ?? [], stages: [...state.sequence], conservative: true };
        // Stage ordering remains conservative. Node-level work is scoped by the impact report.
        const earliest = Math.min(state.sequence.indexOf(input.originStage), ...affected.stages.map(s => state.sequence.indexOf(s)));
        const required = state.sequence.slice(earliest).filter(s => state.stages[s].status !== 'pending');
        const change = { id: randomUUID(), status: 'open', summary: input.summary, source: input.source,
          originStage: input.originStage, roots: input.roots, impact: affected, requiredStages: required,
          baseline: Object.fromEntries(required.map(s => [s, state.stages[s].currentSubmission ?? null])),
          openedAt: new Date().toISOString(), record: await snapshotRecord(state, directory, 'changes', input) };
        state.changes.push(change); invalidate(state, earliest, `Open change ${change.id}: ${input.summary}`);
      } else {
        const change = state.changes.find(c => c.id === input.change && c.status === 'open');
        ensure(change, 'Name an open change');
        ensure(text(input.summary), 'Resolution summary required');
        ensure(change.requiredStages.every(s => state.stages[s].status === 'completed' && state.stages[s].currentSubmission !== change.baseline[s]), 'Affected stages need fresh verified submissions and user approval');
        ensure(Array.isArray(input.items), 'Resolution requires artifact dispositions');
        const nodeIds = change.impact.nodes.map(n => n.id);
        ensure(input.items.length === nodeIds.length && new Set(input.items.map(i => i.id)).size === nodeIds.length, 'Resolve each impacted node exactly once');
        for (const item of input.items) {
          const node = change.impact.nodes.find(n => n.id === item.id);
          ensure(node && ['updated','retained','removed'].includes(item.action) && text(item.reason), 'Every node needs a disposition and reason');
          const current = state.stages[node.stage];
          ensure(current.status === 'completed', 'Impacted node stage must be reviewed');
          const approved = [...current.artifacts, ...current.evidence];
          ensure(approved.some(f => f.path === item.evidence), 'Disposition evidence must belong to the current approved submission');
          if (item.action !== 'removed') ensure(approved.some(f => f.path === node.path), 'Retained or updated artifact must be in its approved stage submission');
          else { let exists = true; try { await lstat(resolve(state.project,node.path)); } catch (e) { if(e.code === 'ENOENT') exists = false; else throw e; } ensure(!exists, 'Removed artifact still exists'); }
        }
        change.status = 'closed'; change.closedAt = new Date().toISOString();
        change.resolution = { summary: input.summary, record: await snapshotRecord(state, directory, 'changes', input), submissions: Object.fromEntries(change.requiredStages.map(s => [s,state.stages[s].currentSubmission])) };
      }
      // Older helpers must reject linked workflows rather than ignore change obligations.
      state.schema = 'stagecraft-handoff/v3';
    } else if (command !== 'status') {
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
      } else if (command === 'submit') {
        ensure(item.status === 'in_progress', 'Begin this stage before submitting it');
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
        const submission = { id: randomUUID(), submittedAt: new Date().toISOString(), summary: receipt.summary,
          next: receipt.next, artifacts, evidence, decisions: receipt.decisions ?? [], snapshots: [] };
        // Preserve the exact reviewed bytes, not only a hash of a mutable working file.
        for (const original of [...new Map([...artifacts, ...evidence].map(f => [f.path, f])).values()]) {
          ensure(!original.path.startsWith(relative(state.project, join(directory, 'reviews')) + '/'), 'Cannot submit review snapshots as new source artifacts');
          ensure(!['workflow.json', '.handoff.lock'].includes(original.path.split('/').at(-1)), 'Cannot submit mutable workflow state');
          const bytes = await readFile(join(state.project, original.path));
          ensure(createHash('sha256').update(bytes).digest('hex') === original.sha256, 'Artifact changed during submission; retry');
          const snapshot = join(directory, 'reviews', stage, submission.id, 'files', original.path);
          await noLinks(snapshot);
          await mkdir(dirname(snapshot), { recursive: true });
          await writeFile(snapshot, bytes, { flag: 'wx', mode: 0o600 });
          submission.snapshots.push({ ...await record(state.project, relative(state.project, snapshot)), original: original.path });
        }
        item.submissions ??= []; item.submissions.push(submission); item.currentSubmission = submission.id;
        item.status = 'awaiting_review'; item.summary = receipt.summary; item.next = receipt.next;
        item.artifacts = artifacts; item.evidence = evidence; delete item.reason;
        delete item.completedAt;
      } else if (command === 'review') {
        ensure(item.status === 'awaiting_review', 'Stage must be awaiting review of unchanged artifacts');
        ensure(text(options.record), 'A user review record is required');
        const feedback = JSON.parse(await readFile(resolve(options.record), 'utf8'));
        const submission = item.submissions.find(s => s.id === item.currentSubmission);
        ensure(feedback.submission === submission.id, 'Review must name the current submission');
        ensure(['approved', 'changes_requested'].includes(feedback.decision), 'Review decision must be approved or changes_requested');
        ensure(feedback.reviewer === 'user' && text(feedback.source) && text(feedback.comment), 'Review must record the user response and its source');
        ensure(Array.isArray(feedback.presented) && feedback.presented.length > 0 && feedback.presented.every(text), 'Record how the deliverables were presented to the user');
        const snapshot = join(directory, 'reviews', stage, submission.id, 'review.json');
        await noLinks(snapshot);
        await writeFile(snapshot, JSON.stringify(feedback, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        submission.review = { decision: feedback.decision, at: new Date().toISOString(), record: await record(state.project, relative(state.project, snapshot)) };
        item.status = feedback.decision === 'approved' ? 'approved' : 'changes_requested';
        if (item.status === 'changes_requested') invalidate(state, index + 1, `Changes requested for ${stage}`);
      } else if (command === 'complete') {
        ensure(item.status === 'approved', 'Submit artifacts, present them and obtain user review approval before completion');
        ensure(state.sequence.slice(0, index).every(s => state.stages[s].status === 'completed'), 'Upstream stages became stale');
        const submission = item.submissions.find(s => s.id === item.currentSubmission);
        ensure(submission.review?.decision === 'approved', 'Current submission must be approved');
        item.status = 'completed'; item.completedAt = new Date().toISOString(); delete item.reason;
        state.decisions.push(...submission.decisions.map(value => ({ stage, submission: submission.id, value })));
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
    console.log('init --project PATH --entry STAGE [--until STAGE] --goal TEXT\nstatus --workflow PATH\nbegin --workflow PATH --stage STAGE\nsubmit --workflow PATH --stage STAGE --receipt FILE\nreview --workflow PATH --stage STAGE --record FILE\ncomplete --workflow PATH --stage STAGE\nblock --workflow PATH --stage STAGE --reason TEXT\ntrace --workflow PATH --record FILE\nchange --workflow PATH --record FILE\nchange-close --workflow PATH --record FILE'); return;
  }
  const allowed = { init: ['project','entry','until','goal'], status: ['workflow'], trace: ['workflow','record'], change: ['workflow','record'], 'change-close': ['workflow','record'], begin: ['workflow','stage'], submit: ['workflow','stage','receipt'], review: ['workflow','stage','record'], complete: ['workflow','stage'], block: ['workflow','stage','reason'] }[command];
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
