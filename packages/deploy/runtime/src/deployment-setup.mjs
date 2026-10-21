import { lstat, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { validateTarget } from './deployment.mjs';

const allowed = new Set(['Dockerfile', '.dockerignore', 'compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml']);
export const digest = content => createHash('sha256').update(content).digest('hex');
export function validateSetup(setup, target) {
  if (!setup || typeof setup.stack !== 'string' || !setup.stack.trim()
    || !Array.isArray(setup.evidence) || !setup.evidence.length || !setup.evidence.every(e => typeof e === 'string' && e.trim())
    || !Array.isArray(setup.files)) throw new Error('Deployment setup requires detected stack, repository evidence and files');
  validateTarget(setup.target);
  if (target && JSON.stringify(target) !== JSON.stringify(setup.target)) {
    // Compare semantic fields, not JSON object key order.
    if (Object.keys(target).some(key => target[key] !== setup.target[key])) throw new Error('Setup must preserve supplied deployment target');
  }
  const seen = new Set();
  for (const file of setup.files) {
    if (!file || !allowed.has(file.path) || seen.has(file.path) || typeof file.content !== 'string'
      || !file.content.trim() || file.content.length > 200000) throw new Error('Invalid generated deployment file');
    seen.add(file.path);
  }
  return setup;
}
async function contents(project, file) {
  try {
    const path = join(project, file);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Deployment file must be a regular file: ${file}`);
    return await readFile(path, 'utf8');
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function checkNewFiles(project, setup) {
  for (const file of setup.files) {
    if (await contents(project, file.path) !== null) throw new Error(`Refusing to overwrite existing deployment file: ${file.path}`);
  }
}
export async function writeSetup(state, save) {
  const setup = validateSetup(state.approvedSetup, state.target);
  if (!state.setupWriteIntent) {
    await checkNewFiles(state.project, setup);
    state.setupWriteIntent = true;
    await save({ type: 'setup_write_intent' });
  }
  // Intent is durable before the first write. Exclusive creation prevents overwrites;
  // matching contents permit recovery after a write completed before its checkpoint.
  for (const file of setup.files) {
    const existing = await contents(state.project, file.path);
    if (existing === null) await writeFile(join(state.project, file.path), file.content, { flag: 'wx', mode: 0o600 });
    else if (existing !== file.content) throw new Error(`Generated file changed; reconcile before resuming: ${file.path}`);
  }
  state.generatedFiles = Object.fromEntries(setup.files.map(file => [file.path, digest(file.content)]));
}
export async function verifyGeneratedFiles(state) {
  for (const [file, hash] of Object.entries(state.generatedFiles ?? {})) {
    const content = await contents(state.project, file);
    if (content === null || digest(content) !== hash) throw new Error(`Generated deployment file changed after confirmation: ${file}`);
  }
}
