import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const [command,value]=process.argv.slice(2);
const dirs=(await readdir(join(root,'packages'),{withFileTypes:true})).filter(x=>x.isDirectory());
const manifests=await Promise.all(dirs.map(async d=>({path:join(root,'packages',d.name,'package.json'),data:JSON.parse(await readFile(join(root,'packages',d.name,'package.json')))})));
if(command==='scope') {
  if(!/^@[a-z0-9][a-z0-9-]*$/.test(value??'') || value==='@stagecraft-draft')throw Error('Supply your owned npm scope, e.g. @yourname');
  for(const m of manifests)m.data.name=`${value}/${m.data.name.split('/').at(-1)}`;
} else if(command==='version') {
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:[a-zA-Z][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*))?)?$/.test(value??''))throw Error('Supply an explicit SemVer such as 0.3.0 or 0.3.0-beta.1');
  for(const m of manifests)m.data.version=value;
} else throw Error('Usage: node tooling/version.mjs scope @owner | version 0.3.0');
for(const m of manifests)await writeFile(m.path,JSON.stringify(m.data,null,2)+'\n');
console.log(`${command}: ${value}. Run npm test and npm run release before publishing.`);
