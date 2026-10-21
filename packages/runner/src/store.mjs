import { mkdir, open, readFile, rename, rm, writeFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

export async function atomicJSON(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
}
export async function readState(runDir) {
  const state = JSON.parse(await readFile(join(runDir, 'state.json'), 'utf8'));
  if (state.version !== 1) throw new Error('Unsupported state version');
  return state;
}
export async function saveState(runDir, state, event) {
  state.updatedAt = new Date().toISOString();
  if (event) state.events.push({ at: state.updatedAt, ...event });
  await atomicJSON(join(runDir, 'state.json'), state);
}
export async function createRun({ project, prd, stateRoot, maxRepairs = 2, agentTimeoutMs = 600_000, skillsProfile, entry = 'prd', mode = 'repair', goal = '', target, technologies = [], until = 'runnable' }) {
  if (!['runnable', 'deploy'].includes(until)) throw new Error('until must be runnable or deploy');
  if (!Number.isInteger(maxRepairs) || maxRepairs < 0 || maxRepairs > 20) throw new Error('maxRepairs must be 0..20');
  if (!Number.isInteger(agentTimeoutMs) || agentTimeoutMs < 100 || agentTimeoutMs > 3_600_000) throw new Error('Invalid agent timeout');
  if (!Array.isArray(technologies) || !technologies.every(t => /^[a-z][a-z0-9-]*$/.test(t))) throw new Error('Invalid stack tags');
  if (!['prd', 'test', 'deploy'].includes(entry)) throw new Error('Invalid entry');
  if (!['audit', 'repair'].includes(mode)) throw new Error('Invalid test mode');
  const input = entry === 'prd' ? await readFile(resolve(prd), 'utf8') : goal || `Inspect existing project for ${entry}. Preserve current stack and architecture.`;
  if (!input.trim()) throw new Error('PRD is empty');
  if (entry !== 'prd' && !(await stat(resolve(project))).isDirectory()) throw new Error('Existing project directory required');
  if (entry === 'deploy' && target) {
    const { validateTarget } = await import('./deployment.mjs');
    target = validateTarget(target);
  }
  const projectDir = resolve(project);
  await mkdir(projectDir, { recursive: true });
  const id = randomUUID();
  const runDir = join(resolve(stateRoot ?? join(projectDir, '.stagecraft', 'runs')), id);
  await mkdir(join(runDir, 'attempts'), { recursive: true });
  const { snapshotSkills } = await import('./skills.mjs');
  await snapshotSkills(runDir, skillsProfile && resolve(skillsProfile));
  let needsSetup = entry === 'deploy' && !target;
  if (entry === 'deploy' && target) {
    try { await stat(join(projectDir, target.file)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; needsSetup = true; }
  }
  const state = {
    version: 1, id, project: projectDir, createdAt: new Date().toISOString(),
    status: 'ready', phase: needsSetup ? 'deploy_discover' : entry === 'prd' ? 'clarify' : `${entry}_plan`, prd: input, entry, mode, target, technologies, until,
    decisions: [], pending: null, plan: null, approvedPlan: null,
    attempts: [], verification: [], frozenTests: null,
    repairsUsed: 0, repairLimit: maxRepairs, agentTimeoutMs, events: [],
  };
  await saveState(runDir, state, { type: 'created' });
  return runDir;
}
export async function withLock(runDir, work) {
  const lockPath = join(runDir, 'runner.lock');
  for (let attempt = 0; attempt < 3; attempt++) {
    let fd;
    try {
      fd = await open(lockPath, 'wx', 0o600);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      // Serialize stale-lock cleanup so two resumptions cannot delete a new
      // owner's lock after both inspected the same dead owner.
      const recoveryPath = `${lockPath}.recovery`;
      let recovery;
      try {
        recovery = await open(recoveryPath, 'wx', 0o600);
      } catch {
        throw new Error('Lock recovery in progress; retry after inspecting the lock');
      }
      try {
        let owner;
        try { owner = JSON.parse(await readFile(lockPath, 'utf8')); }
        catch (error) { if (error.code === 'ENOENT') continue; throw error; }
        // Never remove an incomplete or foreign-host lock automatically.
        if (owner.host !== hostname()) throw new Error('Run is locked on another host');
        if (!Number.isInteger(owner.pid) || owner.pid <= 0) throw new Error('Invalid lock; inspect manually');
        try {
          process.kill(owner.pid, 0);
          throw new Error(`Run is already active (PID ${owner.pid})`);
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
        await rm(lockPath);
      } finally {
        await recovery.close();
        await rm(recoveryPath, { force: true });
      }
      continue;
    }
    try {
      await fd.writeFile(JSON.stringify({ pid: process.pid, host: hostname() }));
      return await work();
    } finally {
      await fd.close();
      await rm(lockPath, { force: true });
    }
  }
  throw new Error('Could not acquire run lock');
}
