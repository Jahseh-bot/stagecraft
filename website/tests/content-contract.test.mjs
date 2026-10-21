import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const read = p => readFileSync(p, 'utf8');
const normalize = s => s.replace(/\s+/g, ' ').trim();
test('零基础指南保留来源的每一操作段落和代码示例', () => {
  const source = read('source-material/npm-usage.md');
  const pages = readdirSync('docs/guide').filter(f => f.endsWith('.md')).map(f => read(`docs/guide/${f}`)).join('\n');
  // Independent source snapshot is the content contract, not a generated manifest.
  for (const paragraph of source.split(/\n\s*\n/)) {
    if (/^#/.test(paragraph)) continue;
    const expected = paragraph.replace('(npm-publishing.md)', '(https://github.com/Jahseh-bot/stagecraft/blob/main/docs/npm-publishing.md)');
    assert.ok(normalize(pages).includes(normalize(expected)), `遗漏来源段落: ${paragraph.slice(0, 100)}`);
  }
});
test('CLI 覆盖公共帮助中的命令与退出码，明确 init 的限制', () => {
  const cli = read('docs/cli/index.md');
  for (const command of ['start', 'test', 'deploy', 'status', 'answer', 'resume', 'skills']) {
    assert.ok(cli.includes(` ${command} `), `缺少命令 ${command}`);
  }
  for (const flag of ['--prd', '--dir', '--state-root', '--max-repairs', '--agent-timeout-ms', '--skills', '--mode', '--goal', '--target', '--run', '--file', '--stack', '--phase', '--until']) assert.ok(cli.includes(flag), flag);
  for (const code of ['0', '1', '2', '3', '130']) assert.match(cli, new RegExp(`\\| ${code} \\|`));
  assert.match(cli, /init.*只安装技能/);
  assert.match(cli, /answers\.json/);
});
