import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditSkills, treeHash } from '../tooling/audit-skills.mjs';
test('all registered upstream source trees remain unchanged and first-party entrypoints resolve', async () => {
  const report = await auditSkills();
  assert.deepEqual(report.errors,[]);
  assert.ok(report.upstream.every(s=>s.unchanged));
  assert.equal(report.counts.firstPartyCopies,16); // Seven stage entries plus case design, source/public copies.
});
test('integrity digest detects file edits, removals and renames even with equal file counts', async t => {
  const directory = await mkdtemp(join(tmpdir(),'stagecraft-integrity-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  await writeFile(join(directory,'SKILL.md'),'original');
  const original = await treeHash(directory);
  await writeFile(join(directory,'SKILL.md'),'modified');
  assert.notEqual((await treeHash(directory)).sha256,original.sha256);
  await rm(join(directory,'SKILL.md')); await writeFile(join(directory,'RENAMED.md'),'original');
  assert.notEqual((await treeHash(directory)).sha256,original.sha256);
  await rm(join(directory,'RENAMED.md'));
  assert.notEqual((await treeHash(directory)).sha256,original.sha256);
});
