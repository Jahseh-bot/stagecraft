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
    for (const file of ['artifact-reviews.md','coverage.md','upstream-adapters.md']) {
      assert.equal(await readFile(join(root,'references',file),'utf8'), await readFile(join('tooling/skill-shared',file),'utf8'));
    }
    await access(join(root,'references/stage-guide.md'));
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

test('stage recipes ship every selected method and composite dependency with provenance', async () => {
  const recipes = JSON.parse(await readFile('tooling/stage-methods.json','utf8'));
  for (const [stage, recipe] of Object.entries(recipes)) {
    const root = `packages/${stage}/skills/stagecraft-${stage}`;
    const index = await readFile(join(root,'references/methods.md'),'utf8');
    const sources = JSON.parse(await readFile(join(root,'references/upstream/sources.json'),'utf8'));
    const ids = recipe.methods.map(method => method.id);
    assert.equal(new Set(ids).size,ids.length);
    for (const method of recipe.methods) {
      assert.ok(method.when && method.action && method.output);
      const source = sources.find(item => item.id===method.id);
      assert.ok(source?.revision && source?.source && source?.license,`${stage}: ${method.id}`);
      await access(join(root,'references/upstream',method.id,'SKILL.md'));
    }
    for (const [,link] of index.matchAll(/\]\(([^)]+)\)/g)) await access(join(root,'references',link));
    if(ids.includes('grill-with-docs')) for(const dependency of ['grilling','domain-modeling']) assert.ok(ids.includes(dependency));
  }
});

test('local method recipes have self-contained resources in npm and public skill copies', async () => {
  const recipes = JSON.parse(await readFile('tooling/stage-methods.json','utf8'));
  for (const [stage, recipe] of Object.entries(recipes)) {
    for (const method of recipe.localMethods ?? []) {
      assert.ok(method.id && method.when && method.action && method.output);
      assert.ok(!method.path.startsWith('/') && !method.path.split('/').includes('..'));
      const source = `packages/${stage}/skills/stagecraft-${stage}/references`;
      const publicRoot = `skills/stagecraft-${stage}/references`;
      const visited = new Set();
      async function inspect(path) {
        if (visited.has(path)) return;
        visited.add(path);
        const content = await readFile(join(source,path),'utf8');
        assert.equal(await readFile(join(publicRoot,path),'utf8'),content);
        for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
          if (link.includes('://') || link.startsWith('#')) continue;
          const { dirname, normalize } = await import('node:path');
          const linked = normalize(join(dirname(path),link));
          assert.ok(!linked.startsWith('..'),`method resource escapes bundle: ${linked}`);
          await access(join(source,linked));
          if (linked.endsWith('.md')) await inspect(linked);
        }
      }
      await inspect(method.path);
      assert.ok(visited.size > 1,'method must include its linked supporting resources');
    }
  }
});
