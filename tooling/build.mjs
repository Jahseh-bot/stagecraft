import { chmod, copyFile, cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

await import('./docs.mjs');
const root = fileURLToPath(new URL('../', import.meta.url));
const profile = JSON.parse(await readFile(join(root, 'packages/runner/skills.profile.json'), 'utf8'));
const methodCatalog = JSON.parse(await readFile(join(root, 'tooling/stage-methods.json'), 'utf8'));
const stageMethods = Object.fromEntries(Object.entries(methodCatalog).map(([stage, recipe]) => [stage, recipe.methods.map(method => method.id)]));
const stagePhases = { architect: ['plan'], build: ['implement'], test: ['test_plan', 'test_prepare', 'repair'],
  deploy: ['deploy_discover', 'deploy_plan'] };
for (const entry of await readdir(join(root, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'runner') continue;
  const skillRoot = join(root, 'packages', entry.name, 'skills', `stagecraft-${entry.name}`);
  await mkdir(join(skillRoot, 'scripts'), { recursive: true });
  await mkdir(join(skillRoot, 'references'), { recursive: true });
  await copyFile(join(root, 'tooling/skill-shared/protocol.md'), join(skillRoot, 'references/protocol.md'));
  await copyFile(join(root, 'tooling/skill-shared/artifact-reviews.md'), join(skillRoot, 'references/artifact-reviews.md'));
  await copyFile(join(root, 'tooling/skill-shared/coverage.md'), join(skillRoot, 'references/coverage.md'));
  await copyFile(join(root, 'tooling/skill-shared/upstream-adapters.md'), join(skillRoot, 'references/upstream-adapters.md'));
  await copyFile(join(root, 'tooling/skill-shared/handoff.mjs'), join(skillRoot, 'scripts/handoff.mjs'));
  const recipe = methodCatalog[entry.name];
  const methodText = `# 本阶段方法编排\n\n${recipe.workflow}\n\n先按任务判断适用条件，再实际读取并应用对应方法。无需用户选底层 Skill；也不为了展示数量而加载全部方法。未采用的方法在报告中注明不适用的原因。\n\n` + recipe.methods.map(method => `## ${method.id}\n\n读取 [${method.id}](upstream/${method.id}/SKILL.md)。\n\n适用条件：${method.when}。\n\n执行要求：${method.action}。\n\n验收产物：${method.output}。\n`).join('\n') + `\n## 技术栈专项方法\n\n按已确认技术栈检查 [技术映射](upstream/technology-skills.json)，读取匹配方法及其必要引用；不自动迁移到某个方法偏好的框架。每个已应用方法必须对应本次具体产物、验证证据或记录的决定，仅列出方法名不算应用。\n\n## 组合方法适配\n\n上游要求调用 Skill 工具时，在无该工具的宿主中直接读取所指的内置 SKILL.md；禁止仅因宿主工具名不同跳过实际方法。采用 grill-with-docs 的阶段同时提供其依赖 grilling/domain-modeling。沿用项目已有术语文档路径；没有时按所附 domain-modeling 版本使用 GLOSSARY.md，避免无意义创建第二份术语表。确认术语即时记录，ADR 仅用于有重要真实取舍的决定。阶段报告链接到这些文件。上游要求全量采访、特定问答格式或强制子代理时，以统一协议的范围、实际选择与宿主能力为准；保留方法实质，不能以适配为理由省略文档与验收。\n`;
  const localMethodText = (recipe.localMethods ?? []).map(method => `## ${method.id}（Stagecraft 内置）\n\n读取 [${method.id}](${method.path})。\n\n适用条件：${method.when}。\n\n执行要求：${method.action}。\n\n验收产物：${method.output}。\n`).join('\n');
  await writeFile(join(skillRoot, 'references/methods.md'), methodText.replace('# 本阶段方法编排\n\n', '# 本阶段方法编排\n\n' + (localMethodText ? localMethodText + '\n' : '')));
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
      const hasLicense = (await readdir(join(upstream, id))).some(name => /^(LICENSE|LICENCE)(\.(md|txt))?$/i.test(name));
      if (skill.path.startsWith('vendor/mattpocock/') && !hasLicense) {
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
