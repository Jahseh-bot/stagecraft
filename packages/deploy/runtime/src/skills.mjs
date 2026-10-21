import { readFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { detectTechnologies, selectSkillIds } from './stack-skills.mjs';
import { atomicJSON } from './store.mjs';

export const defaultProfile = fileURLToPath(new URL('../skills.profile.json', import.meta.url));
async function snapshotDirectory(source, target, prefix = '') {
  const hashes = {};
  await mkdir(target, { recursive: true });
  for (const entry of (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(hashes, await snapshotDirectory(join(source, entry.name), join(target, entry.name), relative));
    else if (entry.isFile()) {
      const content = await readFile(join(source, entry.name));
      hashes[relative] = createHash('sha256').update(content).digest('hex');
      await copyFile(join(source, entry.name), join(target, entry.name));
    } else throw new Error(`Unsupported skill file type: ${relative}`);
  }
  return hashes;
}
export async function snapshotSkills(runDir, profilePath = defaultProfile) {
  const profile = JSON.parse(await readFile(profilePath, 'utf8'));
  if (profile.version !== 1 || !Array.isArray(profile.skills) || !profile.phases) throw new Error('Invalid skills profile');
  const entries = [];
  for (const skill of profile.skills) {
    if (!/^[a-z][a-z0-9-]*$/.test(skill.id) || entries.some(s => s.id === skill.id)
      || !['path', 'source', 'revision', 'license'].every(key => typeof skill[key] === 'string' && skill[key])) {
      throw new Error('Each skill needs a unique id, path, source, revision and license');
    }
    const files = await snapshotDirectory(resolve(dirname(profilePath), skill.path), join(runDir, 'skills', skill.id));
    if (!files['SKILL.md']) throw new Error(`Missing SKILL.md: ${skill.id}`);
    entries.push({ id: skill.id, source: skill.source, revision: skill.revision, license: skill.license, files });
  }
  for (const phase of new Set(['clarify', 'plan', 'implement', 'repair', ...Object.keys(profile.phases)])) {
    if (!Array.isArray(profile.phases[phase]) || !profile.phases[phase].every(id => entries.some(e => e.id === id))) {
      throw new Error(`Invalid skill selection for ${phase}`);
    }
  }
  for (const [technology, phases] of Object.entries(profile.technologySkills ?? {})) {
    if (!/^[a-z][a-z0-9-]*$/.test(technology) || !phases || typeof phases !== 'object') throw new Error('Invalid technology mapping');
    for (const [phase, ids] of Object.entries(phases)) {
      if (!Array.isArray(profile.phases[phase]) || !Array.isArray(ids) || !ids.every(id => entries.some(e => e.id === id))) throw new Error(`Invalid ${technology}/${phase} skills`);
    }
  }
  await atomicJSON(join(runDir, 'skills.lock.json'), { version: 1, phases: profile.phases, technologySkills: profile.technologySkills ?? {}, skills: entries });
}
export async function skillContext(runDir, phase, selection) {
  const lock = JSON.parse(await readFile(join(runDir, 'skills.lock.json'), 'utf8'));
  if (!Array.isArray(lock.phases[phase])) throw new Error(`Skills profile has no mapping for ${phase}`);
  const output = [];
  for (const id of selection?.ids ?? lock.phases[phase] ?? []) {
    const skill = lock.skills.find(s => s.id === id);
    const directory = join(runDir, 'skills', id);
    for (const [file, expected] of Object.entries(skill.files)) {
      const actual = createHash('sha256').update(await readFile(join(directory, file))).digest('hex');
      if (actual !== expected) throw new Error(`Skill snapshot changed: ${id}/${file}`);
    }
    output.push(`Skill ${id} (${skill.source}; revision ${skill.revision}; ${skill.license})
Read supporting relative references from ${directory}.
${await readFile(join(directory, 'SKILL.md'), 'utf8')}`);
  }
  return output.join('\n\n');
}

export async function resolveSkills(runDir, phase, state) {
  const lock = JSON.parse(await readFile(join(runDir, 'skills.lock.json'), 'utf8'));
  const detection = await detectTechnologies(state.project, state.technologies ?? [], state.approvedPlan?.stack ?? state.approvedSetup?.stack ?? '');
  return selectSkillIds(lock, phase, detection);
}
