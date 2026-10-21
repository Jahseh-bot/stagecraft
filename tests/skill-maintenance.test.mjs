import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { safePath, parseSource, metadata, scoreSkill, roleMatch, detectLicense, missingLinks, downloadSkill, chooseUpgrade, createPlan, applyPlan, restoreRun, parseArgs, GitHub } from '../tooling/skill-maintenance.mjs';
import { treeHash } from '../tooling/audit-skills.mjs';
const sha='a'.repeat(40), latest='b'.repeat(40);
const config={searchQueries:['test skills'],searchResultsPerQuery:2,maxRepositories:2,maxCandidatesPerSkill:4,minimumScoreGain:15,allowedLicenses:['MIT'],limits:{files:20,fileBytes:10000,totalBytes:50000},roles:{}};
const license=Buffer.from('MIT License\nPermission is hereby granted, free of charge, to any person obtaining a copy');
const body=(name='vue-testing',details='Use when testing Vue.')=>`---\nname: ${name}\ndescription: Test Vue apps\n---\n${details}\n`;
async function put(path,content){await mkdir(join(path,'..'),{recursive:true});await writeFile(path,content);}
async function fixture(t) {
 const root=await mkdtemp(join(tmpdir(),'stagecraft-maintenance-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const skill={id:'vue-testing',path:'vendor/example/vue-testing',source:`https://github.com/example/skills/tree/${sha}/skills/vue-testing`,revision:sha,license:'MIT'};
 await put(join(root,'packages/runner',skill.path,'SKILL.md'),body());await put(join(root,'packages/runner',skill.path,'LICENSE'),license);
 await put(join(root,'packages/runner/skills.profile.json'),JSON.stringify({skills:[skill]}));
 await put(join(root,'tooling/upstream-integrity.json'),JSON.stringify({skills:[{id:skill.id,path:skill.path,...await treeHash(join(root,'packages/runner',skill.path))}]}));
 return {root,skill};
}
function remote(details='Use when testing Vue.\nWorkflow: steps. Validate tests. Example. Output. Constraints. Recover errors.') {
 const files=new Map([['skills/vue-testing/SKILL.md',Buffer.from(body('vue-testing',details))],['LICENSE',license]]);
 const repo={repo:'example/skills',revision:latest,tree:[...files].map(([path,b])=>({path,type:'blob',mode:'100644',size:b.length}))};
 return {repo,files,github:{repository:async()=>repo,raw:async(_r,path)=>{assert.ok(files.has(path),path);return files.get(path);},search:async()=>[]}};
}
test('source parsing and candidate paths reject traversal, unexpected hosts and mutable refs',()=>{
 assert.equal(parseSource(`https://github.com/a/b/tree/${sha}/skills/test`).directory,'skills/test');
 for(const p of ['../x','a/../x','/absolute','a\\b','.git/config','a\0b'])assert.throws(()=>safePath(p));
 for(const s of ['https://evil.test/a/b/tree/'+sha+'/skills/test','https://github.com/a/b/tree/main/skills/test'])assert.throws(()=>parseSource(s));
});
test('upgrade evidence is structural and preserves technology fit instead of ranking by popularity',()=>{
 const current={score:scoreSkill(body())};
 const good={repo:'a/b',directory:'skills/vue-testing',body:body('vue-testing','Use when Vue testing. Workflow. Validate. Recover. Example. Output. Constraints.'),missingLinks:[]};good.score=scoreSkill(good.body);
 const wrong={...good,body:good.body.replaceAll('Vue','React').replaceAll('vue','react')};
 assert.equal(chooseUpgrade('vue-testing',current,[wrong,good],config),good);
 assert.equal(chooseUpgrade('vue-testing',{score:good.score},[good],config),null);
 assert.equal(chooseUpgrade('vue-testing',current,[{...good,missingLinks:['missing.md']}],config),null);
 assert.ok(!roleMatch('vue-testing',wrong.body,config));
});
test('license recognition rejects unknown licenses and incomplete metadata',()=>{
 assert.equal(detectLicense(license.toString()),'MIT');assert.equal(detectLicense('all rights reserved'),null);
 assert.throws(()=>metadata('# no frontmatter'));
 assert.deepEqual(missingLinks(new Map([['SKILL.md',Buffer.from('[x](references/missing.md) [external](https://example.com)')]])),['SKILL.md: references/missing.md']);
});
test('download retains exact upstream bytes, adds governing license and rejects symlinks or excess size',async()=>{
 const r=remote();const candidate=await downloadSkill(r.github,r.repo,'skills/vue-testing',config);
 assert.deepEqual(candidate.files.get('SKILL.md'),r.files.get('skills/vue-testing/SKILL.md'));assert.deepEqual(candidate.files.get('LICENSE'),license);
 const tree=r.repo.tree.map(e=>({...e,mode:'120000'}));
 await assert.rejects(downloadSkill(r.github,{...r.repo,tree},'skills/vue-testing',config),/Symlinks/);
 await assert.rejects(downloadSkill(r.github,r.repo,'skills/vue-testing',{...config,limits:{...config.limits,fileBytes:2}}),/size budget/);
 r.files.set('LICENSE',Buffer.from('All rights reserved'));
 await assert.rejects(downloadSkill(r.github,r.repo,'skills/vue-testing',config),/license/);
});
test('update resolves latest source without changing files during planning',async t=>{
 const {root,skill}=await fixture(t),r=remote();
 const plan=await createPlan({root,mode:'update',github:r.github,config});
 assert.equal(plan.changes.length,1);assert.equal(plan.changes[0].revision,latest);assert.equal(plan.errors.length,0);
 assert.equal(JSON.parse(await readFile(join(root,'packages/runner/skills.profile.json'))).skills[0].revision,sha);
 await assert.rejects(createPlan({root,mode:'update',only:['unknown'],github:r.github,config}),/Unknown/);
 const unavailable=await createPlan({root,mode:'update',github:{repository:async()=>{throw new Error('HTTP 429');}},config});
 assert.equal(unavailable.changes.length,0);assert.equal(unavailable.errors[0].scope,skill.id);
});
test('new broken references prevent update; a removed directory cannot silently use another skill',async t=>{
 const {root}=await fixture(t),r=remote('[broken](missing.md)');
 let plan=await createPlan({root,mode:'update',github:r.github,config});assert.equal(plan.changes.length,0);assert.match(plan.errors[0].reason,/unresolved/);
 r.repo.tree=[];plan=await createPlan({root,mode:'update',github:r.github,config});assert.equal(plan.changes.length,0);assert.match(plan.errors[0].reason,/removed/);
});
test('upgrade discovers a distinct matching candidate and keeps stable slot IDs',async t=>{
 const {root}=await fixture(t),r=remote();r.repo.repo='new/skills';
 r.github.search=async()=>[{full_name:'new/skills'}];
 const plan=await createPlan({root,mode:'upgrade',github:r.github,config});
 assert.ok(plan.discovery.length);assert.equal(plan.changes.length,1);assert.equal(plan.changes[0].id,'vue-testing');assert.ok(plan.changes[0].source.startsWith('https://github.com/new/skills/'));
});
test('transaction updates source and lock together, and explicit restore preserves original files',async t=>{
 const {root}=await fixture(t),r=remote();const plan=await createPlan({root,mode:'update',github:r.github,config});
 const paths=['packages/runner/vendor','packages/runner/skills.profile.json','tooling/upstream-integrity.json'];const run=join(root,'output/run');
 await applyPlan({root,run,plan,paths,validate:async()=>{
   const p=JSON.parse(await readFile(join(root,paths[1])));assert.equal(p.skills[0].revision,latest);
 }});
 await restoreRun(root,run);assert.equal(JSON.parse(await readFile(join(root,paths[1]))).skills[0].revision,sha);
 assert.equal(JSON.parse(await readFile(join(run,'transaction.json'))).status,'restored');
});
test('validation failure restores generated and source files; later edits block manual restore',async t=>{
 const {root}=await fixture(t),r=remote();const plan=await createPlan({root,mode:'update',github:r.github,config});
 const paths=['packages/runner/vendor','packages/runner/skills.profile.json','tooling/upstream-integrity.json','generated.txt'];await put(join(root,'generated.txt'),'original');
 const run=join(root,'output/failure');
 await assert.rejects(applyPlan({root,run,plan,paths,validate:async()=>{await put(join(root,'generated.txt'),'changed');throw new Error('build failed');}}),/build failed/);
 assert.equal(await readFile(join(root,'generated.txt'),'utf8'),'original');assert.equal(JSON.parse(await readFile(join(root,paths[1]))).skills[0].revision,sha);
 const applied=join(root,'output/success');await applyPlan({root,run:applied,plan,paths,validate:async()=>{}});await put(join(root,'generated.txt'),'user edit');
 await assert.rejects(restoreRun(root,applied),/later edits/);assert.equal(await readFile(join(root,'generated.txt'),'utf8'),'user edit');
});
test('CLI rejects ambiguous options and restore traversal',()=>{
 assert.equal(parseArgs(['update','--dry-run']).dryRun,true);assert.deepEqual(parseArgs(['update','--only','a,b']).only,['a','b']);
 for(const args of [['upgrade','--bogus'],['update','--restore','../x'],['upgrade','--max-repos','NaN'],['update','--force-restore'],['update','--restore','x','--dry-run']])assert.throws(()=>parseArgs(args));
});
test('GitHub client authenticates only API requests and resolves default branch to immutable SHA',async()=>{
 const calls=[];
 const client=new GitHub({token:'test-secret',fetcher:async(url,options)=>{
   calls.push({url,headers:options.headers});
   const body=url.includes('raw.githubusercontent.com')?'content':url.includes('/commits/')?{sha:latest}:url.includes('/git/trees/')?{tree:[],truncated:false}:{default_branch:'trunk'};
   return new Response(typeof body==='string'?body:JSON.stringify(body));
 }});
 const repo=await client.repository('example/skills');assert.equal(repo.revision,latest);assert.ok(calls.some(c=>c.url.endsWith('/commits/trunk')));
 await client.raw(repo,'SKILL.md');assert.equal(calls.at(-1).headers.Authorization,undefined);assert.equal(calls[0].headers.Authorization,'Bearer test-secret');
});

test('GitHub repository renames follow bounded same-origin redirects and pin canonical source',async()=>{
 const calls=[];
 const client=new GitHub({fetcher:async(url)=>{
   calls.push(url);
   if(url.endsWith('/repos/old/skills'))return new Response(null,{status:301,headers:{location:'https://api.github.com/repositories/42'}});
   return new Response(JSON.stringify(url.includes('/commits/')?{sha:latest}:url.includes('/git/trees/')?{tree:[],truncated:false}:{full_name:'new/skills',default_branch:'main'}));
 }});
 const repo=await client.repository('old/skills');assert.equal(repo.repo,'new/skills');assert.ok(calls.some(u=>u.includes('/repos/new/skills/commits/')));
 const unsafe=new GitHub({token:'secret',fetcher:async()=>new Response(null,{status:302,headers:{location:'https://other.example/steal'}})});
 await assert.rejects(unsafe.repository('old/skills'),/cross-origin/);
 const loop=new GitHub({fetcher:async()=>new Response(null,{status:301,headers:{location:'/loop'}})});
 await assert.rejects(loop.repository('old/skills'),/excessive/);
});

test('replacement intent must match the entry metadata, not incidental body keywords',()=>{
 const candidate={repo:'other/skills',directory:'worker-visualizer',body:'---\nname: worker-visualizer\ndescription: |\n  A particle simulator that runs in a Web Worker.\n  Use for real-time compute.\nlicense: MIT\n---\nFrontend design visual workflow validate recover example output constraints.\n',missingLinks:[],score:{score:80}};
 assert.match(metadata(candidate.body).description,/real-time compute/);
 assert.equal(chooseUpgrade('frontend-design',{score:{score:0}},[candidate],{...config,roles:{'frontend-design':['frontend','design','visual']}}),null);
 const general={...candidate,body:body('vue-best-practices','Vue pinia store examples and router debugging'),score:{score:80}};
 assert.equal(chooseUpgrade('vue-pinia-best-practices',{score:{score:0}},[general],config),null);
});
test('an installed complementary method cannot replace a different specialization',async t=>{
 const {root,skill}=await fixture(t),r=remote();
 const profile={skills:[skill,{...skill,id:'vue-debug',source:`https://github.com/example/skills/tree/${sha}/skills/vue-debug`}]};
 await put(join(root,'packages/runner/skills.profile.json'),JSON.stringify(profile));
 r.repo.tree=r.repo.tree.map(e=>({...e,path:e.path.replace('vue-testing','vue-debug')}));
 r.github.raw=async()=>{throw new Error('Complementary installed method must not be downloaded as a replacement');};
 const plan=await createPlan({root,mode:'upgrade',only:[skill.id],github:r.github,config});
 assert.equal(plan.changes.length,0);assert.equal(plan.errors.length,0);
 assert.deepEqual(plan.outcomes.find(o=>o.status==='kept').candidates,[]);
});

test('metadata accepts folded plain YAML descriptions without reading the next field',()=>{
 assert.equal(metadata('---\nname: test\ndescription:\n  First line\n  second line\nlicense: MIT\n---\n').description,'First line second line');
});
test('reviewed rejected candidate revisions remain excluded from automatic replacement',async t=>{
 const {root}=await fixture(t),r=remote();r.repo.repo='new/skills';r.github.search=async()=>[{full_name:'new/skills'}];
 const source=`https://github.com/new/skills/tree/${latest}/skills/vue-testing`;
 const plan=await createPlan({root,mode:'upgrade',github:r.github,config:{...config,rejectedCandidates:[{id:'vue-testing',source,reason:'Coverage regression verified'}]}});
 assert.equal(plan.changes.length,0);assert.ok(plan.outcomes.some(o=>o.status==='candidate-rejected'&&o.reason==='Coverage regression verified'));
});
