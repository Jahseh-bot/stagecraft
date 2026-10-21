import { readFile, mkdtemp, writeFile, mkdir, realpath } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
const current=JSON.parse(await readFile(new URL('../packages/runner/package.json',import.meta.url)));
const directory=resolve(process.argv[2]??`output/releases/${current.version}`);
const manifest=JSON.parse(await readFile(join(directory,'manifest.json')));
const consumer=await realpath(await mkdtemp(join(tmpdir(),'stagecraft-public-')));
const results=[];
for(const item of manifest.artifacts){
 let r;
 for(let attempt=0;attempt<12;attempt++){
  r=await fetch(`https://registry.npmjs.org/${encodeURIComponent(item.name)}/${item.version}`);
  if(r.status!==404||attempt===11)break;
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 if(!r.ok)throw Error(`Not available: ${item.name} (${r.status})`);
 const metadata=await r.json();
 if(metadata.dist?.integrity!==item.integrity)throw Error(`Integrity mismatch: ${item.name}`);
 const stage=item.name.split('/').at(-1),bin=stage==='runner'?'stagecraft':`stagecraft-${stage}`;
 const invoke=async (...args)=>{
  for(let attempt=0;;attempt++){
   try{return execFileSync('npx',['--yes','--registry=https://registry.npmjs.org',`--cache=${join(consumer,'cache')}`,`${item.name}@${item.version}`,...args],{cwd:consumer,encoding:'utf8',timeout:120000,stdio:['ignore','pipe','pipe']});}
   catch(error){
    if(attempt>=29||!String(error.stderr).includes('E404'))throw error;
    if(attempt%6===0)console.log(`Waiting for public registry propagation: ${item.name}`);
    await new Promise(resolve=>setTimeout(resolve,10000));
   }
  }
 };
 const output=await invoke('--help');
 if(!output.includes(stage==='runner'?'stagecraft start':(['build','test','deploy'].includes(stage)?'run ':'init ')))throw Error(`Unexpected CLI: ${item.name}`);
 const runtime=['runner','build','test','deploy'].includes(stage);
 const project=join(consumer,stage);await mkdir(project);
 if(runtime){
  if((await invoke('--version')).trim()!==item.version)throw Error(`Wrong CLI version: ${item.name}`);
  const selection=JSON.parse(await invoke('skills','--dir',project,'--stack','vue,postgres','--phase','repair'));
  if(!selection.ids.includes('vue-debug-guides')||!selection.ids.includes('supabase-postgres-best-practices'))throw Error(`Missing bundled skills: ${item.name}`);
 }else{
  await invoke('init','--agent','codex','--dir',project);
  const skill=await readFile(join(project,'.agents/skills',`stagecraft-${stage}`,'SKILL.md'),'utf8');
  if(!skill.trim())throw Error(`Empty installed skill: ${item.name}`);
 }
 results.push({name:item.name,integrity:true,npx:true,functional:runtime?'version and Vue/Postgres skill routing':'installed Codex skill'});
 console.log(`Verified ${item.name}@${item.version}`);
}
await writeFile(join(directory,'registry-verification.json'),JSON.stringify({consumer,results},null,2)+'\n');
console.log(`All public packages executed in ${consumer}`);
