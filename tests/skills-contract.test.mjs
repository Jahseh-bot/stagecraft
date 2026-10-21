import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
for (const stage of ['discover','spec','design','architect','build','test','deploy']) {
  test(`${stage} skill is standalone, host-neutral and ships matching protocol/helper`, async () => {
    const root = `packages/${stage}/skills/stagecraft-${stage}`;
    const skill = await readFile(join(root, 'SKILL.md'), 'utf8');
    assert.match(skill, new RegExp(`name: stagecraft-${stage}`));
    assert.ok(skill.split('\n').length < 500);
    for (const [, link] of skill.matchAll(/\]\(([^)]+)\)/g)) if (!link.includes('://')) await access(join(root, link));
    assert.match(skill, /执行闭环/); assert.match(skill, /验收/); assert.match(skill, /平滑交接/);
    assert.equal(await readFile(join(root,'references/protocol.md'),'utf8'), await readFile('tooling/skill-shared/protocol.md','utf8'));
    assert.equal(await readFile(join(root,'scripts/handoff.mjs'),'utf8'), await readFile('tooling/skill-shared/handoff.mjs','utf8'));
    const mappings = JSON.parse(await readFile(join(root,'references/upstream/technology-skills.json')));
    for (const ids of Object.values(mappings)) for (const id of ids) await access(join(root,'references/upstream',id,'SKILL.md'));
  });
}

async function inventory(root, prefix = '') {
  const entries = [];
  for (const item of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = join(prefix, item.name);
    if (item.isDirectory()) entries.push(...await inventory(root, path));
    else entries.push(path);
  }
  return entries.sort();
}
test('public skills catalog contains exactly seven complete standalone stage copies', async () => {
  const stages = ['architect','build','deploy','design','discover','spec','test'];
  assert.deepEqual((await readdir('skills')).sort(), stages.map(s => `stagecraft-${s}`));
  for (const stage of stages) {
    const source = `packages/${stage}/skills/stagecraft-${stage}`;
    const published = `skills/stagecraft-${stage}`;
    const files = await inventory(source);
    assert.deepEqual(await inventory(published), files);
    for (const path of files) assert.deepEqual(await readFile(join(published,path)), await readFile(join(source,path)), `${stage}/${path}`);
  }
});
