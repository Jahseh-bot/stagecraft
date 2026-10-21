import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
const args=process.argv.slice(2), dry=args.includes('--dry-run');
if(args.some(x=>x.startsWith('--')&&x!=='--dry-run'))throw Error('Unknown option');
const current=JSON.parse(await readFile(new URL('../packages/runner/package.json',import.meta.url)));
const directory=resolve(args.find(x=>!x.startsWith('--'))??`output/releases/${current.version}`);
const manifest=JSON.parse(await readFile(join(directory,'manifest.json')));
const registry='https://registry.npmjs.org';
const tag=manifest.version.includes('-')?'next':'latest';
if(manifest.artifacts.length!==8 || new Set(manifest.artifacts.map(x=>x.name)).size!==8)throw Error('Expected all eight release artifacts');
// Validate every tarball before any publication; never upload changed bytes on retry.
for(const item of manifest.artifacts){
  if(basename(item.filename)!==item.filename)throw Error('Invalid artifact filename');
  const bytes=await readFile(join(directory,item.filename));
  if(createHash('sha256').update(bytes).digest('hex')!==item.sha256 || `sha512-${createHash('sha512').update(bytes).digest('base64')}`!==item.integrity)throw Error(`Changed artifact: ${item.name}`);
  const packed=JSON.parse(execFileSync('tar',['-xOf',join(directory,item.filename),'package/package.json'],{encoding:'utf8'}));
  if(packed.name!==item.name||packed.version!==manifest.version||packed.private||packed.publishConfig?.access!=='public')throw Error(`Invalid public metadata: ${item.name}`);
  if(!dry&&item.name.startsWith('@stagecraft-draft/'))throw Error('Configure your owned scope before publishing');
}
if(!dry)execFileSync('npm',['whoami',`--registry=${registry}`],{stdio:'inherit'});
const existing=new Set();
if(!dry)for(const item of manifest.artifacts){
  const response=await fetch(`${registry}/${encodeURIComponent(item.name)}/${manifest.version}`);
  if(response.status===404)continue;
  if(!response.ok)throw Error(`Registry read failed: ${response.status}`);
  const published=await response.json();
  if(published.dist?.integrity!==item.integrity)throw Error(`Version already exists with different bytes: ${item.name}@${manifest.version}. Choose a new version.`);
  existing.add(item.name);
}
const results=[];
for(const item of manifest.artifacts){
  if(!existing.has(item.name)){
    const result=spawnSync('npm',['publish',join(directory,item.filename),'--access=public','--loglevel=warn',`--registry=${registry}`,`--tag=${tag}`,...(dry?['--dry-run']:[])],{stdio:'inherit'});
    if(result.status!==0){
      results.push({name:item.name,version:manifest.version,status:'failed',exitCode:result.status});
      await writeFile(join(directory,dry?'publish-dry-run.json':'publish-results.json'),JSON.stringify(results,null,2)+'\n');
      throw Error(`Publish stopped at ${item.name}; complete npm authentication/2FA in your terminal, then retry the same artifacts. Identical published versions will be skipped.`);
    }
  }
  results.push({name:item.name,version:manifest.version,status:dry?'dry-run':existing.has(item.name)?'already-published-identical':'published'});
  await writeFile(join(directory,dry?'publish-dry-run.json':'publish-results.json'),JSON.stringify(results,null,2)+'\n');
}
console.log(dry?'Dry-run complete. No package was published.':'Publication complete. Run npm run verify:registry -- '+directory);
