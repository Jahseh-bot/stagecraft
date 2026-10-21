import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { runCommand } from './process.mjs';

export function validateTarget(target) {
  if (!target || target.provider !== 'compose' || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(target.projectName)
    || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(target.context ?? '')
    || typeof target.file !== 'string' || !target.file || target.file.startsWith('/')
    || target.file.includes('\\') || target.file.split('/').some(p => ['..', '.', ''].includes(p))) {
    throw new Error('Target requires provider=compose, explicit context, projectName and project-relative file');
  }
  const url = new URL(target.url);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    || !url.port || url.username || url.password || url.hash
    || typeof target.bodyIncludes !== 'string' || !target.bodyIncludes
    || !Number.isInteger(target.expectedStatus) || target.expectedStatus < 200 || target.expectedStatus >= 300
    || !Number.isInteger(target.timeoutMs) || target.timeoutMs < 100 || target.timeoutMs > 600000) {
    throw new Error('Target requires loopback HTTP health URL, expectedStatus 2xx, bodyIncludes and timeoutMs 100..600000');
  }
  return structuredClone(target);
}
const digest = data => createHash('sha256').update(data).digest('hex');
export function composeArgs(state, runDir) {
  return ['docker', '--context', state.target.context, 'compose', '--project-directory', state.project,
    '-p', state.target.projectName, '-f', join(runDir, 'compose.approved.json')];
}
async function invoke(argv, state, runDir, name, signal, timeoutMs = state.target.timeoutMs) {
  return runCommand(argv, { cwd: state.project, log: join(runDir, 'attempts', `${name}.log`),
    timeoutMs, signal, stdoutLog: join(runDir, 'attempts', `${name}.stdout`) });
}
export async function prepareDeployment(state, runDir, signal) {
  const target = validateTarget(state.target);
  const context = await invoke(['docker', 'context', 'inspect', target.context, '--format', '{{.Endpoints.docker.Host}}'], state, runDir, 'deploy-context', signal);
  if (!context.ok || !context.tail.trim().startsWith('unix://')) throw new Error('Deployment v1 requires an available local Unix-socket Docker context');
  const source = resolve(state.project, target.file);
  const config = await invoke(['docker', '--context', target.context, 'compose', '--project-directory', state.project,
    '-p', target.projectName, '-f', source, 'config', '--format', 'json'], state, runDir, 'deploy-config', signal);
  if (!config.ok) throw new Error(`Compose preflight failed: ${config.tail}`);
  // Read the complete log, not the truncated diagnostic tail.
  const rendered = await readFile(join(runDir, 'attempts', 'deploy-config.stdout'), 'utf8');
  const parsed = JSON.parse(rendered);
  if (!parsed.services || !Object.keys(parsed.services).length) throw new Error('Compose has no services');
  const bytes = JSON.stringify(parsed, null, 2);
  await writeFile(join(runDir, 'compose.approved.json'), bytes, { mode: 0o600 });
  return { configHash: digest(bytes), services: Object.keys(parsed.services), context: target.context,
    projectName: target.projectName, url: target.url, cleanupArgv: [...composeArgs(state, runDir), 'down'] };
}
export async function applyDeployment(state, runDir, signal) {
  if (digest(await readFile(join(runDir, 'compose.approved.json'))) !== state.deployment.configHash) {
    throw new Error('Approved deployment config changed; create a new deployment plan');
  }
  return invoke([...composeArgs(state, runDir), 'up', '--build', '--detach', '--wait', '--wait-timeout',
    String(Math.max(1, Math.ceil(state.target.timeoutMs / 1000)))], state, runDir, 'deploy-up', signal,
    600_000 + state.target.timeoutMs);
}
export async function observeDeployment(state, runDir, signal) {
  if (digest(await readFile(join(runDir, 'compose.approved.json'))) !== state.deployment.configHash) {
    throw new Error('Approved deployment config changed; cannot reconcile this release');
  }
  const deadline = Date.now() + state.target.timeoutMs;
  let observation = 'Health check not ready';
  let healthy = false;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    try {
      const response = await fetch(state.target.url, { redirect: 'error', signal: AbortSignal.any([
        ...(signal ? [signal] : []), AbortSignal.timeout(Math.min(1000, Math.max(1, deadline - Date.now()))),
      ]) });
      const body = await response.text();
      observation = `HTTP ${response.status}: ${body.slice(0, 500)}`;
      if (response.status === state.target.expectedStatus && body.includes(state.target.bodyIncludes)) { healthy = true; break; }
    } catch (error) { observation = error.message; }
    await delay(200, undefined, { signal });
  }
  const status = await invoke([...composeArgs(state, runDir), 'ps', '--all', '--format', 'json'], state, runDir, 'deploy-status', signal);
  let containers = [];
  try {
    const raw = (await readFile(join(runDir, 'attempts', 'deploy-status.stdout'), 'utf8')).trim();
    containers = raw.startsWith('[') ? JSON.parse(raw) : raw.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch { /* Invalid or missing Docker status cannot pass verification. */ }
  const running = state.deployment.services.every(service => {
    const matches = containers.filter(c => c.Service === service);
    return matches.length > 0 && matches.every(c => c.State === 'running' && (!c.Health || c.Health === 'healthy'));
  });
  return { ok: healthy && status.ok && running, kind: 'deployment', observation, url: state.target.url, containers, status };
}
