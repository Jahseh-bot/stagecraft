import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

export async function launch(argv, { cwd, log, signal, stdoutLog, input = '', timeoutMs = 600_000 }) {
  signal?.throwIfAborted();
  await mkdir(dirname(log), { recursive: true });
  const stream = createWriteStream(log, { flags: 'a', mode: 0o600 });
  const stdoutStream = stdoutLog ? createWriteStream(stdoutLog, { flags: 'w', mode: 0o600 }) : null;
  let tail = '';
  let timedOut = false;
  let closed = false;
  let spawnError;
  const started = Date.now();
  const env = { ...process.env };
  // A runner launched by node:test must not leak its private child-runner mode
  // into the project's own test process (which can otherwise exit zero silently).
  delete env.NODE_TEST_CONTEXT;
  const child = spawn(argv[0], argv.slice(1), {
    cwd, env, shell: false, detached: process.platform !== 'win32',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const killGroup = sig => {
    try {
      if (child.pid) {
        if (process.platform !== 'win32') process.kill(-child.pid, sig);
        else child.kill(sig);
      }
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  };
  // Agent CLIs may launch commands in separate process groups. Capture their
  // ancestry before terminating the agent, while the parent links still exist.
  const descendants = new Set();
  const captureDescendants = () => {
    if (process.platform === 'win32' || !child.pid) return;
    try {
      const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], { encoding: 'utf8', timeout: 2000 })
        .trim().split('\n').map(line => line.trim().split(/\s+/).map(Number));
      const parents = new Set([child.pid]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const [pid, parent] of rows) if (parents.has(parent) && !parents.has(pid)) {
          parents.add(pid); descendants.add(pid); changed = true;
        }
      }
    } catch { /* Process-group termination remains available if ps fails. */ }
  };
  const killDescendants = sig => {
    for (const pid of [...descendants].reverse()) {
      try { process.kill(pid, sig); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  };
  let escalation;
  const stop = () => {
    captureDescendants();
    killDescendants('SIGTERM');
    killGroup('SIGTERM');
    if (!escalation) escalation = setTimeout(() => { killDescendants('SIGKILL'); killGroup('SIGKILL'); }, 1000);
  };
  const collect = chunk => {
    stream.write(chunk);
    tail = (tail + chunk.toString()).slice(-24_000);
  };
  child.stdout.on('data', chunk => { collect(chunk); stdoutStream?.write(chunk); });
  child.stderr.on('data', collect);
  child.stdin.on('error', () => {});
  const completion = new Promise(resolve => {
    child.on('error', error => { spawnError = error.message; });
    child.on('close', (code, exitSignal) => {
      closed = true;
      clearTimeout(timer);
      clearTimeout(escalation);
      signal?.removeEventListener('abort', stop);
      // Clean descendants left by wrapper commands such as npm.
      killDescendants('SIGKILL');
      killGroup('SIGKILL');
      const finish = () => stream.end(() => resolve({
        argv, code, signal: exitSignal, error: spawnError ?? null,
        timedOut, durationMs: Date.now() - started, log, tail,
        ok: code === 0 && !timedOut && !spawnError && !signal?.aborted,
      }));
      if (stdoutStream) stdoutStream.end(finish); else finish();
    });
  });
  const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
  signal?.addEventListener('abort', stop, { once: true });
  if (signal?.aborted) stop();
  child.stdin.end(input);
  return { child, completion, stop, isClosed: () => closed };
}
export async function runCommand(argv, options) {
  const process = await launch(argv, options);
  const result = await process.completion;
  options.signal?.throwIfAborted();
  return result;
}
async function ensureFreePort(url) {
  const host = url.hostname === '[::1]' ? '::1' : url.hostname;
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(Number(url.port), host, () => server.close(resolve));
  });
}
export async function smokeCheck(spec, options) {
  const url = new URL(spec.url);
  try {
    await ensureFreePort(url);
  } catch (error) {
    return { ok: false, kind: 'environment', error: `Smoke port unavailable: ${error.message}`, url: spec.url };
  }
  const server = await launch(spec.argv, { ...options, timeoutMs: spec.timeoutMs + 2000 });
  const deadline = Date.now() + spec.timeoutMs;
  let observation = 'Server did not become healthy';
  let passed = false;
  try {
    while (Date.now() < deadline) {
      options.signal?.throwIfAborted();
      if (server.isClosed()) { observation = 'Server exited before smoke check'; break; }
      try {
        const response = await fetch(url, {
          redirect: 'error',
          signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(1000)]) : AbortSignal.timeout(1000),
        });
        const body = await response.text();
        observation = `HTTP ${response.status}: ${body.slice(0, 1000)}`;
        if (response.status === spec.expectedStatus && body.includes(spec.bodyIncludes)) {
          await delay(100, undefined, { signal: options.signal });
          if (!server.isClosed()) { passed = true; break; }
        }
      } catch (error) { observation = error.message; }
      await delay(100, undefined, { signal: options.signal });
    }
  } finally {
    server.stop();
    await server.completion;
  }
  options.signal?.throwIfAborted();
  return { ok: passed, kind: 'smoke', url: spec.url, observation, log: options.log };
}
