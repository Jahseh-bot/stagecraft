import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const guide = 'https://github.com/Jahseh-bot/stagecraft/blob/main/docs/npm-usage.md';
for (const directory of await readdir(join(root, 'packages'), { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const stage = directory.name;
  const metadata = JSON.parse(await readFile(join(root, 'packages', stage, 'package.json')));
  const body = stage === 'runner' ? `兼容入口：保留旧 Codex runner 和 .stagecraft/runs 检查点。新项目推荐在当前 coding agent 中直接调用各阶段 Skill，无需 runner、嵌套模型或 answers.json。\n\n\`\`\`sh\nnpx --yes ${metadata.name}@${metadata.version} resume --run /absolute/path/to/run\n\`\`\`\n\n终端支持直接回答；--json 保留自动化协议。旧 runner 仍需已登录的 Codex CLI，部署范围仍为本机 Compose。` : `在当前 coding agent 中完成 ${stage} 阶段的执行、验证、修复与交接，无需安装其他阶段包。Stagecraft 按任务选择内置方法；请读取 references/methods.md 并实际应用，阶段报告记录具体产物和验证证据。\n\n\`\`\`sh\nnpx --yes ${metadata.name}@${metadata.version} init --agent codex --dir ./my-project\n\`\`\`\n\n然后在 agent 中说：“使用 stagecraft-${stage} 完成本次任务，未确认的关键方向先讨论方案，选项 1 为最推荐并说明理由，列出其他选项，最后允许自由输入补充，等待我选择；确认后执行、验证和修复；每阶段成果保存到项目并展示给我评审，具体版本通过后才交接。”\n\n支持 --agent codex、claude、cursor、copilot、gemini、opencode、generic；也可用 --skills-dir 指定宿主目录。使用 --dry-run 预览；不同内容拒绝覆盖。没有原生 Skills 的宿主可直接读取安装目录里的 SKILL.md。宿主必须有任务所需的文件、执行及验证能力。\n\n统一协议、报告模板和可选 Node.js 22+ 交接脚本随包提供；检查点写到目标项目 .stagecraft/workflows。${['build','test','deploy'].includes(stage) ? ' run/status/resume 等旧命令仅作为兼容入口保留。' : ''}`;
  await writeFile(join(root, 'packages', stage, 'README.md'), `# ${metadata.name}\n\n${metadata.description}\n\n版本 ${metadata.version}。npm 命令以该版本已实际发布为前提；未发布时从仓库执行 node packages/${stage}/bin/cli.mjs。\n\n${body}\n\n[完整零基础指南](${guide}) · [宿主兼容说明](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/agent-compatibility.md)\n\nMIT；第三方方法保留原许可证，见 NOTICE.md。\n`);
}
console.log('Updated Skills-first package READMEs; preserved hand-maintained guides.');
