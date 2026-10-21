#!/usr/bin/env node
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function assertNoLinks(path) {
  const absolute = resolve(path);
  const { root } = parse(absolute);
  let current = root;
  for (const part of absolute.slice(root.length).split('/').filter(Boolean)) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`拒绝符号链接路径：${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

async function files(path, prefix = '') {
  const output = {};
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const key = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`拒绝符号链接：${join(path, entry.name)}`);
    if (entry.isDirectory()) Object.assign(output, await files(join(path, entry.name), key));
    else if (entry.isFile()) output[key] = (await readFile(join(path, entry.name))).toString('base64');
    else throw new Error(`不支持的文件类型：${key}`);
  }
  return output;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 1 && ['--help', 'help'].includes(args[0]))) {
    console.log('init --agent codex|claude [--dir <project>] [--dry-run]\n仅安装本包技能；不会运行模型、部署应用或覆盖不同内容。');
    return;
  }
  if (args.shift() !== 'init') throw new Error('仅支持 init，使用 --help 查看用法。');
  const options = {};
  while (args.length) {
    const flag = args.shift();
    if (!['--agent', '--dir', '--dry-run'].includes(flag) || flag in options) {
      throw new Error(`未知或重复参数：${flag}`);
    }
    if (flag === '--dry-run') options[flag] = true;
    else {
      const value = args.shift();
      if (!value || value.startsWith('--')) throw new Error(`缺少参数值：${flag}`);
      options[flag] = value;
    }
  }
  const hostDirectory = { codex: '.agents', claude: '.claude' }[options['--agent']];
  if (!hostDirectory) throw new Error('--agent 必须为 codex 或 claude。');
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  const stage = manifest.name.split('/').at(-1);
  const skillName = `stagecraft-${stage}`;
  const source = join(packageRoot, 'skills', skillName);
  const destination = resolve(options['--dir'] ?? process.cwd(), hostDirectory, 'skills', skillName);
  await assertNoLinks(destination);
  const expected = await files(source);
  let installed;
  try {
    await lstat(destination);
    installed = await files(destination);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (installed) {
    const equal = Object.keys(expected).length === Object.keys(installed).length
      && Object.keys(expected).every(key => installed[key] === expected[key]);
    if (!equal) throw new Error(`目标存在不同内容，已保留原文件：${destination}`);
    console.log(`已安装且内容一致：${destination}`);
    return;
  }
  if (options['--dry-run']) {
    console.log(`将安装：${destination}`);
    return;
  }
  const parent = dirname(destination);
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(join(parent, '.stagecraft-'));
  try {
    const payload = join(temporary, skillName);
    await cp(source, payload, { recursive: true, force: false, errorOnExist: true });
    await rename(payload, destination);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  console.log(`已安装：${destination}\n在宿主中重新加载技能并调用 ${skillName}；安装不代表阶段任务完成。`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
