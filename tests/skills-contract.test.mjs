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
