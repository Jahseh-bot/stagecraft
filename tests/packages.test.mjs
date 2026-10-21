const releaseMetadata = JSON.parse(await readFile(new URL('../packages/runner/package.json', import.meta.url)));
const releaseScope = releaseMetadata.name.split('/')[0];
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, realpath, rm, mkdir, writeFile, symlink, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const stages = ['discover', 'spec', 'design', 'architect', 'build', 'test', 'deploy'];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const stage of stages) {
  test(`${stage}: isolated tarball, seven host profiles, dry-run, repeat, conflicts and links`, async () => {
    const temporary = await realpath(await mkdtemp(join(tmpdir(), 'stagecraft-test-')));
    try {
      const packed = JSON.parse(execFileSync(npm, [
        'pack', '--json', '--pack-destination', temporary,
      ], { cwd: join(root, 'packages', stage), encoding: 'utf8' }))[0];
      const consumer = join(temporary, 'consumer');
      await mkdir(consumer);
      await writeFile(join(consumer, 'package.json'), '{"private":true}');
      execFileSync(npm, [
        'install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false',
        join(temporary, packed.filename),
      ], { cwd: consumer, encoding: 'utf8' });
      const cli = join(consumer, 'node_modules', releaseScope, stage, 'bin', 'cli.mjs');
      const installedManifest = JSON.parse(await readFile(join(consumer, 'node_modules', releaseScope, stage, 'package.json')));
      assert.equal(installedManifest.dependencies, undefined);
      const invoke = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
      for (const [agent, directory] of [['codex', '.agents'], ['claude', '.claude'], ['cursor', '.cursor'], ['copilot', '.github'], ['gemini', '.gemini'], ['opencode', '.opencode'], ['generic', '.agents']]) {
        const project = join(temporary, agent);
        const args = ['init', '--agent', agent, '--dir', project];
        assert.equal(invoke(...args, '--dry-run').status, 0);
        await assert.rejects(access(project), { code: 'ENOENT' });
        const initial = invoke(...args);
        assert.equal(initial.status, 0, initial.stderr);
        const skill = join(project, directory, 'skills', `stagecraft-${stage}`);
        const entry = join(skill, 'SKILL.md');
        const original = await readFile(entry, 'utf8');
        await access(join(skill, 'assets', 'report.md'));
        await access(join(skill, 'references', 'protocol.md'));
        const helper = spawnSync(process.execPath, [join(skill, 'scripts', 'handoff.mjs'), '--help'], { encoding: 'utf8' });
        assert.equal(helper.status, 0, helper.stderr);
        if (stage === 'deploy') await access(join(skill, 'references', 'compose.md'));
        assert.equal(invoke(...args).status, 0);
        await writeFile(entry, `${original}\nUser customization\n`);
        const conflicting = invoke(...args);
        assert.notEqual(conflicting.status, 0);
        assert.match(conflicting.stderr, /不同内容/);
        assert.equal(await readFile(entry, 'utf8'), `${original}\nUser customization\n`);
      }
      const custom = join(temporary, 'custom');
      assert.equal(invoke('init', '--dir', custom, '--skills-dir', 'my-skills').status, 0);
      await access(join(custom, 'my-skills', `stagecraft-${stage}`, 'SKILL.md'));
      assert.notEqual(invoke('init', '--agent', 'unsupported').status, 0);
      assert.notEqual(invoke('init', '--agent', 'codex', '--force').status, 0);
      const target = join(temporary, 'link-project');
      const outside = join(temporary, 'outside');
      await mkdir(target);
      await mkdir(outside);
      await symlink(outside, join(target, '.agents'), 'dir');
      assert.notEqual(invoke('init', '--agent', 'codex', '--dir', target).status, 0);
      await assert.rejects(access(join(outside, 'skills')), { code: 'ENOENT' });
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
}
