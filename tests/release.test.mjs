import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const source=fileURLToPath(new URL('../',import.meta.url));
async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'stagecraft-release-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(join(root,'tooling'));for(const script of ['version','publish'])await copyFile(join(source,`tooling/${script}.mjs`),join(root,`tooling/${script}.mjs`));
 for(const stage of ['runner','test']){await mkdir(join(root,'packages',stage),{recursive:true});await writeFile(join(root,'packages',stage,'package.json'),JSON.stringify({name:`@stagecraft-draft/${stage}`,version:'0.2.0'}));}
 return root;
}
function run(root,script,...args){return spawnSync(process.execPath,[join(root,`tooling/${script}.mjs`),...args],{cwd:root,encoding:'utf8'});}
test('release scope and version update all manifests; invalid input leaves them intact',async t=>{
 const root=await fixture(t);
 assert.equal(run(root,'version','scope','@owner-example').status,0);
 assert.equal(run(root,'version','version','0.3.0-beta.1').status,0);
 for(const stage of ['runner','test'])assert.deepEqual(JSON.parse(await readFile(join(root,'packages',stage,'package.json'))),{name:`@owner-example/${stage}`,version:'0.3.0-beta.1'});
 const path=join(root,'packages/runner/package.json'),before=await readFile(path,'utf8');
 for(const args of [['scope','../bad'],['version','01.2.3'],['version','latest']])assert.notEqual(run(root,'version',...args).status,0);
 assert.equal(await readFile(path,'utf8'),before);
});
test('publisher rejects modified release before invoking npm or contacting registry',async t=>{
 const root=await fixture(t);const destination=join(root,'release');await mkdir(destination);
 await writeFile(join(destination,'changed.tgz'),'tampered');
 await writeFile(join(destination,'manifest.json'),JSON.stringify({version:'0.2.0',artifacts:Array.from({length:8},(_,i)=>({name:`@owner/package${i}`,filename:'changed.tgz',sha256:'wrong',integrity:'wrong'}))}));
 const result=run(root,'publish',destination,'--dry-run');
 assert.notEqual(result.status,0);assert.match(result.stderr,/Changed artifact/);
});
