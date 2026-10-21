import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectTechnologies, selectSkillIds } from '../packages/runner/src/stack-skills.mjs';
import { snapshotSkills, skillContext, resolveSkills } from '../packages/runner/src/skills.mjs';
async function fixture(t) {
 const root=await mkdtemp(join(tmpdir(),'stagecraft-stack-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;
}
const profile=JSON.parse(await readFile(new URL('../packages/runner/skills.profile.json',import.meta.url),'utf8'));
test('Vue dependency routes implementation, tests and repairs to separate methods',async t=>{
 const root=await fixture(t);await writeFile(join(root,'package.json'),JSON.stringify({dependencies:{vue:'^3.5.0',pinia:'^3.0.0'}}));
 const detected=await detectTechnologies(root);assert.deepEqual(detected.technologies,['pinia','vue']);
 assert.ok(selectSkillIds(profile,'implement',detected).ids.includes('vue-best-practices'));
 assert.ok(selectSkillIds(profile,'test_prepare',detected).ids.includes('vue-testing-best-practices'));
 assert.ok(selectSkillIds(profile,'repair',detected).ids.includes('vue-debug-guides'));
 assert.ok(!selectSkillIds(profile,'implement',detected).ids.includes('react-best-practices'));
});
test('Flutter receives official architecture/widget methods and no default web design skill',async t=>{
 const root=await fixture(t);await writeFile(join(root,'pubspec.yaml'),'name: sample\ndependencies:\n  flutter:\n    sdk: flutter\n');
 const detected=await detectTechnologies(root);assert.deepEqual(detected.technologies,['flutter']);
 const implementation=selectSkillIds(profile,'implement',detected);
 assert.ok(implementation.ids.includes('flutter-build-responsive-layout'));assert.ok(!implementation.ids.includes('frontend-design'));
 const tests=selectSkillIds(profile,'test_prepare',detected);assert.ok(tests.ids.includes('flutter-add-widget-test'));assert.ok(!tests.ids.includes('webapp-testing'));
});
test('confirmed stack works before files exist; unsupported tags and Vue 2 remain visible gaps',async t=>{
 const root=await fixture(t);
 assert.ok((await detectTechnologies(root,[],'Vue 3 and TypeScript')).technologies.includes('vue'));
 assert.deepEqual(selectSkillIds(profile,'implement',await detectTechnologies(root,['unknown-stack'])).uncovered,['unknown-stack']);
 await writeFile(join(root,'package.json'),JSON.stringify({dependencies:{vue:'^2.7.0'}}));
 const result=selectSkillIds(profile,'implement',await detectTechnologies(root));assert.deepEqual(result.uncovered,['vue2']);assert.ok(!result.ids.includes('vue-best-practices'));
});
test('resolved stack methods and references come from immutable run snapshot',async t=>{
 const root=await fixture(t);const run=join(root,'run');await snapshotSkills(run);
 const selection=await resolveSkills(run,'test_prepare',{project:root,technologies:['vue']});
 const context=await skillContext(run,'test_prepare',selection);assert.match(context,/vue-testing-best-practices/);
 await writeFile(join(run,'skills','vue-testing-best-practices','SKILL.md'),'tampered');
 await assert.rejects(skillContext(run,'test_prepare',selection),/snapshot changed/);
});
test('full-stack manifests select backend, database and test-framework methods',async t=>{
 const root=await fixture(t);
 await writeFile(join(root,'package.json'),JSON.stringify({dependencies:{vue:'^3.5',fastify:'^5',pg:'^8'},devDependencies:{vitest:'^3'}}));
 const detected=await detectTechnologies(root);assert.deepEqual(detected.technologies,['fastify','nodejs','postgres','vitest','vue']);
 const result=selectSkillIds(profile,'implement',detected);assert.deepEqual(result.uncovered,[]);
 for(const id of ['nodejs-backend-patterns','supabase-postgres-best-practices','vitest','vue-best-practices'])assert.ok(result.ids.includes(id),id);
 assert.equal(result.ids.filter(id=>id==='nodejs-backend-patterns').length,1);
});
test('Python, SQL driver and pytest detection does not turn all Python into FastAPI',async t=>{
 const root=await fixture(t);
 await writeFile(join(root,'requirements.txt'),'psycopg[binary]>=3\npytest>=8\n# fastapi is not installed\n');
 const detected=await detectTechnologies(root);assert.ok(detected.technologies.includes('postgres'));assert.ok(detected.technologies.includes('pytest'));assert.ok(!detected.technologies.includes('fastapi'));
 const result=selectSkillIds(profile,'implement',detected);assert.ok(result.ids.includes('python-design-patterns'));assert.ok(!result.ids.includes('fastapi-templates'));
});
test('Compose, Go and Java build manifests identify database and backend stacks',async t=>{
 const root=await fixture(t);
 await writeFile(join(root,'compose.yaml'),'services:\n  cache:\n    image: redis:7\n  db:\n    image: mysql:8\n');
 await writeFile(join(root,'go.mod'),'module example.com/service\ngo 1.23\n');
 const detected=await detectTechnologies(root);assert.deepEqual(detected.technologies,['go','mysql','redis']);
 const result=selectSkillIds(profile,'deploy_plan',detected);assert.ok(result.ids.includes('redis-connections'));assert.ok(result.ids.includes('mysql'));
 await writeFile(join(root,'pom.xml'),'<project><artifactId>spring-boot-starter-web</artifactId></project>');
 const java=selectSkillIds(profile,'implement',await detectTechnologies(root));
 assert.ok(java.technologies.includes('java'));assert.ok(java.technologies.includes('springboot'));
 assert.equal(java.ids.filter(id=>id==='java-architect').length,1);
});
