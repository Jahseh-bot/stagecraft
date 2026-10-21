import { chmod, copyFile, cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

await import('./docs.mjs');
const root = fileURLToPath(new URL('../', import.meta.url));
const profile = JSON.parse(await readFile(join(root, 'packages/runner/skills.profile.json'), 'utf8'));
const stageMethods = {
  discover: ['grilling'],
  spec: ['grilling'],
  design: ['frontend-design'],
  architect: ['codebase-design'],
  build: ['tdd', 'codebase-design'],
  test: ['tdd', 'webapp-testing', 'diagnosing-bugs'],
  deploy: ['docker-expert'],
};
const stagePhases = { architect: ['plan'], build: ['implement'], test: ['test_plan', 'test_prepare', 'repair'],
  deploy: ['deploy_discover', 'deploy_plan'] };
for (const entry of await readdir(join(root, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'runner') continue;
  const skillRoot = join(root, 'packages', entry.name, 'skills', `stagecraft-${entry.name}`);
  await mkdir(join(skillRoot, 'scripts'), { recursive: true });
  await mkdir(join(skillRoot, 'references'), { recursive: true });
  await copyFile(join(root, 'tooling/skill-shared/protocol.md'), join(skillRoot, 'references/protocol.md'));
  await copyFile(join(root, 'tooling/skill-shared/handoff.mjs'), join(skillRoot, 'scripts/handoff.mjs'));
  const bin = join(root, 'packages', entry.name, 'bin');
  await mkdir(bin, { recursive: true });
  const target = join(bin, 'cli.mjs');
  await copyFile(join(root, 'tooling/installer.mjs'), target);
  await chmod(target, 0o755);
  if (['build', 'test', 'deploy'].includes(entry.name)) {
    await copyFile(target, join(bin, 'installer.mjs'));
    await copyFile(join(root, 'tooling/stage-cli.mjs'), target);
    const runtime = join(root, 'packages', entry.name, 'runtime');
    await rm(runtime, { recursive: true, force: true });
    await mkdir(runtime, { recursive: true });
    for (const path of ['bin', 'src', 'vendor', 'skills.profile.json', 'package.json', 'README.md', 'LICENSE', 'NOTICE.md']) {
      await cp(join(root, 'packages/runner', path), join(runtime, path), { recursive: true });
    }
  }
  if (stageMethods[entry.name]) {
    const upstream = join(root, 'packages', entry.name, 'skills', `stagecraft-${entry.name}`, 'references', 'upstream');
    await rm(upstream, { recursive: true, force: true });
    await mkdir(upstream, { recursive: true });
    const sources = [];
    const technologySkills = {};
    for (const [technology, phases] of Object.entries(profile.technologySkills ?? {})) {
      const ids = [...new Set((stagePhases[entry.name] ?? []).flatMap(phase => phases[phase] ?? []))];
      if (entry.name === 'design' && technology === 'flutter') ids.push('flutter-build-responsive-layout');
      if (ids.length) technologySkills[technology] = ids;
    }
    const methods = new Set([...stageMethods[entry.name], ...Object.values(technologySkills).flat()]);
    for (const id of methods) {
      const skill = profile.skills.find(s => s.id === id);
      await cp(join(root, 'packages/runner', skill.path), join(upstream, id), { recursive: true });
      if (skill.path.startsWith('vendor/mattpocock/')) {
        await copyFile(join(root, 'packages/runner/vendor/mattpocock/LICENSE'), join(upstream, id, 'LICENSE'));
      }
      sources.push({ id, source: skill.source, revision: skill.revision, license: skill.license });
    }
    await writeFile(join(upstream, 'sources.json'), JSON.stringify(sources, null, 2) + '\n');
    await writeFile(join(upstream, 'technology-skills.json'), JSON.stringify(technologySkills, null, 2) + '\n');
  }
  // Public skills CLI discovery root; keep every bundled reference and license.
  const publicSkill = join(root, 'skills', `stagecraft-${entry.name}`);
  await rm(publicSkill, { recursive: true, force: true });
  await cp(skillRoot, publicSkill, { recursive: true });
}
console.log('已构建所有阶段包的独立安装器。');
