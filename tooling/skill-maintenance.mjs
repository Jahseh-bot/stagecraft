import { readFile, writeFile, readdir, mkdir, rm, cp, access, lstat, chmod, open } from 'node:fs/promises';
import { join, resolve, relative, dirname, posix } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { treeHash } from './audit-skills.mjs';
const exec = promisify(execFile);
const ROOT = fileURLToPath(new URL('../',import.meta.url));
const digest = b => createHash('sha256').update(b).digest('hex');
const json = p => readFile(p,'utf8').then(JSON.parse);
const save = async (p,v) => { await mkdir(dirname(p),{recursive:true}); await writeFile(p,JSON.stringify(v,null,2)+'\n'); };
const exists = p => access(p).then(()=>true,()=>false);
const assert = (ok,message) => { if (!ok) throw new Error(message); };
export function safePath(path) {
  assert(typeof path==='string' && path.length && !path.startsWith('/') && !path.includes('\\') && !/[\x00-\x1f]/.test(path) && !path.split('/').some(p=>!p||p==='.'||p==='..'||p==='.git'),`Unsafe path: ${path}`);
  return path;
}
export function parseSource(source) {
  const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/tree\/([a-f0-9]{40})\/(.+)$/.exec(source);
  assert(match,'Expected a pinned public GitHub source URL');
  return { repo:match[1], revision:match[2], directory:safePath(match[3]) };
}
export function metadata(body) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body)?.[1];
  assert(front,'Missing SKILL.md frontmatter');
  const field = key => front.match(new RegExp(`^${key}:\\s*(.+)$`,'m'))?.[1]?.replace(/^['"]|['"]$/g,'').trim();
  const name=field('name'), description=field('description');
  assert(name && /^[\w-]+$/.test(name) && description,'Missing or invalid skill name/description');
  return {name,description,license:field('license')};
}
export function scoreSkill(body) {
  const checks = {
    activation:/when to|use (?:this|when)|适用|触发/i,
    workflow:/workflow|步骤|流程|step\s*\d|phase\s*\d/i,
    verification:/verif|validat|assert|验收|验证/i,
    recovery:/rollback|recover|diagnos|失败|恢复|回滚/i,
    examples:/example|示例|```/i,
    handoff:/output|deliverable|handoff|产物|交付/i,
    constraints:/constraint|must not|limitations|约束|限制|边界/i,
    references:/\]\([^)]*(?:references|\.md)/i
  };
  const evidence=Object.fromEntries(Object.entries(checks).map(([k,re])=>[k,re.test(body)]));
  return {score:Object.values(evidence).filter(Boolean).length*10,evidence};
}
export function roleMatch(id, body, config) {
  const words=config.roles[id] ?? id.split('-').filter(w=>!['best','practices','patterns','pro','templates','skills'].includes(w));
  const normalized=body.toLowerCase();
  // Technology/domain names cannot disappear when swapping methods.
  const domains=['vue','react','flutter','dart','python','javascript','nodejs','fastapi','postgres','supabase','redis','mongodb','mysql','golang','java','docker','vitest'];
  if (domains.some(d=>id.split('-').includes(d)&&!normalized.includes(d))) return false;
  return words.length>0 && words.filter(w=>normalized.includes(w.toLowerCase())).length/words.length>=0.66;
}
export function detectLicense(body) {
  if (/Apache License[\s\S]*Version 2\.0/i.test(body)) return 'Apache-2.0';
  if (/Permission is hereby granted, free of charge/i.test(body)) return 'MIT';
  if (/Redistribution and use in source and binary forms/i.test(body)) return /Neither the name|names of its contributors/i.test(body)?'BSD-3-Clause':'BSD-2-Clause';
  if (/Permission to use, copy, modify, and\/or distribute this software/i.test(body)) return 'ISC';
  return null;
}
export function missingLinks(files) {
  const missing=[];
  for (const [name,bytes] of files) {
    if (!name.endsWith('.md')) continue;
    for (const [,raw] of bytes.toString('utf8').matchAll(/\]\(([^)]+)\)/g)) {
      if (/^[a-z][a-z\d+.-]*:/i.test(raw)||raw.startsWith('#')||/[ <>]/.test(raw)) continue;
      const target=posix.normalize(posix.join(posix.dirname(name),raw.split('#')[0]));
      if (!files.has(target) && ![...files.keys()].some(p=>p.startsWith(target.replace(/\/$/,'')+'/'))) missing.push(`${name}: ${raw}`);
    }
  }
  return [...new Set(missing)].sort();
}
async function readTree(directory,prefix='') {
  const map=new Map();
  for (const entry of await readdir(join(directory,prefix),{withFileTypes:true})) {
    const path=posix.join(prefix,entry.name); safePath(path);
    assert(!entry.isSymbolicLink(),`Symlink not allowed: ${path}`);
    if(entry.isDirectory()) for(const [p,b] of await readTree(directory,path)) map.set(p,b);
    else if(entry.isFile()) map.set(path,await readFile(join(directory,path)));
  }
  return map;
}
async function pool(items,fn,concurrency=4) {
  const result=new Array(items.length); let next=0;
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{while(next<items.length){const i=next++;result[i]=await fn(items[i],i);}}));
  return result;
}
export class GitHub {
  constructor({fetcher=fetch,token=process.env.GITHUB_TOKEN}={}) {this.fetcher=fetcher;this.token=token;this.cache=new Map();this.downloadedBytes=0;}
  async request(url,api=true) {
    if(this.cache.has(url)) return this.cache.get(url);
    const promise=(async()=>{
      const headers=api?{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(this.token?{Authorization:`Bearer ${this.token}`}:{})}:{};
      let target=url,response;
      for(let redirects=0;redirects<=3;redirects++) {
        response=await this.fetcher(target,{headers,signal:AbortSignal.timeout(30000),redirect:'manual'});
        if(![301,302,303,307,308].includes(response.status))break;
        const location=response.headers.get('location');await response.body?.cancel();
        assert(location&&redirects<3,'Invalid or excessive GitHub redirects');
        const next=new URL(location,target);
        assert(next.origin===new URL(url).origin&&!next.username&&!next.password,'Refusing cross-origin GitHub redirect');
        target=next.href;
      }
      if(!response.ok) throw new Error(`GitHub HTTP ${response.status} at ${new URL(url).pathname}; check network, source availability or GITHUB_TOKEN rate limit`);
      const chunks=[];let size=0;const reader=response.body.getReader();
      try { while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;this.downloadedBytes+=value.length;assert(size<=32*1024*1024&&this.downloadedBytes<=256*1024*1024,'Remote download budget exceeded');chunks.push(value);} } finally {await reader.cancel();}
      const bytes=Buffer.concat(chunks);
      return api?JSON.parse(bytes.toString('utf8')):bytes;
    })(); this.cache.set(url,promise);return promise;
  }
  async repository(repo) {
    assert(/^[\w.-]+\/[\w.-]+$/.test(repo),'Invalid GitHub repository');
    const info=await this.request(`https://api.github.com/repos/${repo}`);
    assert(!info.archived&&!info.disabled&&!info.private,`Repository unavailable or archived: ${repo}`);
    repo=info.full_name??repo;
    assert(/^[\w.-]+\/[\w.-]+$/.test(repo),'Invalid canonical GitHub repository');
    const commit=await this.request(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(info.default_branch)}`);
    assert(/^[a-f0-9]{40}$/.test(commit.sha),'Invalid commit');
    const tree=await this.request(`https://api.github.com/repos/${repo}/git/trees/${commit.sha}?recursive=1`);
    assert(!tree.truncated,'Repository tree truncated; refusing incomplete download');
    return {repo,revision:commit.sha,tree:tree.tree,info};
  }
  raw(repository,path) {safePath(path);return this.request(`https://raw.githubusercontent.com/${repository.repo}/${repository.revision}/${path.split('/').map(encodeURIComponent).join('/')}`,false);}
  async search(query,count) {return (await this.request(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${count}`)).items;}
}
export async function downloadSkill(github,repo,directory,config) {
  safePath(directory);
  const entries=repo.tree.filter(e=>e.path.startsWith(directory+'/')&&e.type!=='tree');
  assert(entries.length>0&&entries.length<=config.limits.files,'Invalid or oversized skill directory');
  assert(entries.every(e=>e.type==='blob'&&['100644','100755'].includes(e.mode)), 'Symlinks or submodules in candidate are not supported');
  assert(entries.every(e=>e.size<=config.limits.fileBytes)&&entries.reduce((n,e)=>n+e.size,0)<=config.limits.totalBytes,'Candidate exceeds size budget');
  const files=new Map(await pool(entries,async e=>{
    const path=safePath(e.path.slice(directory.length+1));
    const bytes=await github.raw(repo,e.path);assert(bytes.length<=config.limits.fileBytes,'Downloaded file exceeds limit');return[path,bytes];
  }));
  assert(files.has('SKILL.md'),'Candidate has no SKILL.md');
  const body=files.get('SKILL.md').toString('utf8'); const meta=metadata(body);
  // A nearer license takes precedence over a repository-wide license.
  let at=directory, licenseBytes,licensePath;
  while(true) {
    const names=repo.tree.filter(e=>e.type==='blob'&&posix.dirname(e.path)===(at||'.')&&/^(LICENSE|LICENCE)(\.(md|txt))?$/i.test(posix.basename(e.path)));
    if(names.length){licensePath=names[0].path;licenseBytes=await github.raw(repo,licensePath);break;}
    if(!at)break;at=posix.dirname(at);if(at==='.')at='';
  }
  assert(licenseBytes,'No verifiable license text found');
  const license=detectLicense(licenseBytes.toString('utf8'));
  assert(config.allowedLicenses.includes(license),'Unsupported or unrecognized license');
  if(meta.license && !/^(see|complete terms|license|licence)/i.test(meta.license)) assert(meta.license===license,'Skill metadata and license text disagree');
  // Preserve the original bytes; add a copy of the governing license only if absent locally.
  if(![...files.keys()].some(p=>/^(LICENSE|LICENCE)(\.(md|txt))?$/i.test(p))) files.set('LICENSE',licenseBytes);
  return {files,body,meta,license,licensePath,directory,repo:repo.repo,revision:repo.revision,score:scoreSkill(body),missingLinks:missingLinks(files),executable:entries.filter(e=>e.mode==='100755').map(e=>e.path.slice(directory.length+1))};
}
export function chooseUpgrade(id,current,candidates,config) {
  return candidates.filter(c=>roleMatch(id,c.body,config)&&c.missingLinks.length===0&&c.score.score>=current.score.score+config.minimumScoreGain)
    .sort((a,b)=>b.score.score-a.score.score||`${a.repo}/${a.directory}`.localeCompare(`${b.repo}/${b.directory}`))[0]??null;
}
export async function createPlan({root=ROOT,mode,only=[],github=new GitHub(),config,onProgress=()=>{}}) {
  config??=await json(join(root,'tooling/skill-maintenance.config.json'));
  const profile=await json(join(root,'packages/runner/skills.profile.json'));
  assert(only.every(id=>profile.skills.some(s=>s.id===id)),'Unknown --only skill ID');
  const selected=profile.skills.filter(s=>!only.length||only.includes(s.id));
  const repos=new Map(),errors=[],discovery=[];
  const repository=async name=>{if(!repos.has(name))repos.set(name,github.repository(name));return repos.get(name);};
  let discovered=[];
  if(mode==='upgrade') {
    for(const query of config.searchQueries) {
      try{const items=await github.search(query,config.searchResultsPerQuery);discovery.push({query,repositories:items.map(i=>i.full_name)});discovered.push(...items.map(i=>i.full_name));}
      catch(e){errors.push({scope:'discovery',reason:e.message});}
    }
    // Reserve half the bounded scan for newly discovered repositories, not only incumbents.
    const known=[...new Set(selected.map(s=>parseSource(s.source).repo))];
    discovered=[...new Set(discovered)].filter(r=>!known.includes(r));
    discovered=[...discovered.slice(0,Math.ceil(config.maxRepositories/2)),...known].slice(0,config.maxRepositories);
    for(const name of discovered)try{await repository(name);}catch(e){errors.push({scope:name,reason:e.message});}
  }
  const changes=[],outcomes=[];
  for(const skill of selected) {
    onProgress(`Checking ${skill.id}`);
    try {
      const source=parseSource(skill.source),currentFiles=await readTree(join(root,'packages/runner',skill.path));
      const currentBody=currentFiles.get('SKILL.md').toString('utf8');
      const current={score:scoreSkill(currentBody),meta:metadata(currentBody),missingLinks:missingLinks(currentFiles)};
      let candidate;
      if(mode==='update') {
        const repo=await repository(source.repo);
        let directory=source.directory;
        if(!repo.tree.some(e=>e.path===directory+'/SKILL.md')) {
          const moved=repo.tree.filter(e=>e.path.endsWith('/'+posix.basename(directory)+'/SKILL.md'));
          assert(moved.length===1,'Source directory removed or moved ambiguously');directory=posix.dirname(moved[0].path);
        }
        candidate=await downloadSkill(github,repo,directory,config);
        assert(candidate.meta.name===current.meta.name,'Upstream skill identity changed');
        const newMissing=candidate.missingLinks.filter(l=>!current.missingLinks.includes(l));
        assert(!newMissing.length,`New unresolved references: ${newMissing.slice(0,4).join(', ')}`);
      } else {
        const candidates=[],opportunities=[];
        for(const name of discovered) {
          let repo;try{repo=await repository(name);}catch{continue;}
          const terms=[...new Set([...skill.id.split('-'),...(config.roles[skill.id]??[])])].filter(w=>w.length>2&&!['best','practices','skills','pro'].includes(w));
          const pathScore=e=>terms.filter(w=>e.path.toLowerCase().replaceAll('-',' ').includes(w.toLowerCase())).length;
          const possible=repo.tree.filter(e=>e.path.endsWith('/SKILL.md')&&pathScore(e)>0).sort((a,b)=>pathScore(b)-pathScore(a)||a.path.localeCompare(b.path));
          for(const entry of possible) {
            const directory=posix.dirname(entry.path);
            if(name===source.repo&&directory===source.directory)continue;
            opportunities.push({repo,directory,rank:pathScore(entry)});
          }
        }
        opportunities.sort((a,b)=>b.rank-a.rank||`${a.repo.repo}/${a.directory}`.localeCompare(`${b.repo.repo}/${b.directory}`));
        for(const {repo,directory} of opportunities.slice(0,config.maxCandidatesPerSkill)) {
          try{candidates.push(await downloadSkill(github,repo,directory,config));}
          catch(e){outcomes.push({id:skill.id,status:'candidate-rejected',source:`${repo.repo}/${directory}`,reason:e.message});}
        }
        candidate=chooseUpgrade(skill.id,current,candidates,config);
        outcomes.push({id:skill.id,status:candidate?'replacement-selected':'kept',currentScore:current.score,candidates:candidates.map(c=>({source:`${c.repo}/${c.directory}`,score:c.score,missingLinks:c.missingLinks}))});
        if(!candidate)continue;
      }
      const sameFiles=currentFiles.size===candidate.files.size&&[...currentFiles].every(([p,b])=>candidate.files.has(p)&&b.equals(candidate.files.get(p)));
      if(sameFiles&&candidate.revision===skill.revision&&candidate.repo===source.repo&&candidate.directory===source.directory){outcomes.push({id:skill.id,status:'up-to-date'});continue;}
      changes.push({id:skill.id,path:skill.path,previous:{source:skill.source,revision:skill.revision,license:skill.license},
        source:`https://github.com/${candidate.repo}/tree/${candidate.revision}/${candidate.directory}`,revision:candidate.revision,license:candidate.license,
        reason:candidate.revision===skill.revision&&candidate.repo===source.repo?'same-revision content/license synchronization':'new upstream revision or replacement',
        scoreBefore:current.score,scoreAfter:candidate.score,retainedWarnings:candidate.missingLinks,files:candidate.files,executable:candidate.executable});
      outcomes.push({id:skill.id,status:'planned',revision:candidate.revision});
    }catch(e){errors.push({scope:skill.id,reason:e.message});outcomes.push({id:skill.id,status:'blocked',reason:e.message});}
  }
  return {mode,createdAt:new Date().toISOString(),selected:selected.map(s=>s.id),discovery,outcomes,errors,changes};
}
export async function managedPaths(root) {
  const paths=['packages/runner/vendor','packages/runner/skills.profile.json','tooling/upstream-integrity.json','skills'];
  for(const entry of await readdir(join(root,'packages'),{withFileTypes:true})) {
    if(!entry.isDirectory())continue;
    paths.push(`packages/${entry.name}/README.md`);
    if(entry.name==='runner')continue;
    paths.push(`packages/${entry.name}/bin`,`packages/${entry.name}/skills`);
    if(['build','test','deploy'].includes(entry.name))paths.push(`packages/${entry.name}/runtime`);
  }
  return paths;
}
async function fingerprint(root,paths) {
  const hashes={};
  for(const path of paths) {
    const absolute=join(root,safePath(path));
    if(!await exists(absolute)){hashes[path]=null;continue;}
    const stat=await lstat(absolute);assert(!stat.isSymbolicLink(),`Managed path is a symlink: ${path}`);
    hashes[path]=stat.isDirectory()?(await treeHash(absolute)).sha256:digest(await readFile(absolute));
  }
  return hashes;
}
async function restoreBackup(root,run,manifest) {
  for(const [path,hash] of Object.entries(manifest.before)) {
    safePath(path);await rm(join(root,path),{recursive:true,force:true});
    if(hash!==null){await mkdir(dirname(join(root,path)),{recursive:true});await cp(join(run,'backup',path),join(root,path),{recursive:true});}
  }
}
export async function applyPlan({root=ROOT,run,plan,validate,paths}) {
  paths??=await managedPaths(root);
  const manifest={schema:'stagecraft-maintenance/v1',root,status:'backing-up',before:await fingerprint(root,paths)};
  await save(join(run,'transaction.json'),manifest);
  for(const [path,hash] of Object.entries(manifest.before))if(hash!==null){await mkdir(dirname(join(run,'backup',path)),{recursive:true});await cp(join(root,path),join(run,'backup',path),{recursive:true});}
  manifest.status='applying';await save(join(run,'transaction.json'),manifest);
  try {
    const profile=await json(join(root,'packages/runner/skills.profile.json'));
    const baseline=await json(join(root,'tooling/upstream-integrity.json'));
    for(const change of plan.changes) {
      const entry=profile.skills.find(s=>s.id===change.id);assert(entry&&entry.path===change.path,'Profile changed during planning');
      assert(entry.source===change.previous.source&&entry.revision===change.previous.revision,'Source changed during planning');
      safePath(change.path);assert(change.path.startsWith('vendor/'),'Target must be in vendor');
      const target=join(root,'packages/runner',change.path);
      await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
      for(const [path,bytes] of change.files) {
        safePath(path);await mkdir(dirname(join(target,path)),{recursive:true});await writeFile(join(target,path),bytes);
        if(change.executable.includes(path))await chmod(join(target,path),0o755);
      }
      Object.assign(entry,{source:change.source,revision:change.revision,license:change.license});
      const locked=baseline.skills.find(s=>s.id===change.id);assert(locked,'Missing integrity entry');
      Object.assign(locked,await treeHash(target));
    }
    await save(join(root,'packages/runner/skills.profile.json'),profile);
    await save(join(root,'tooling/upstream-integrity.json'),baseline);
    await validate();
    manifest.after=await fingerprint(root,paths);manifest.status='applied';await save(join(run,'transaction.json'),manifest);
    return manifest;
  } catch(error) {
    await restoreBackup(root,run,manifest);manifest.status='rolled-back';manifest.error=error.message;
    await save(join(run,'transaction.json'),manifest);throw error;
  }
}
export async function restoreRun(root,run,{force=false}={}) {
  const manifest=await json(join(run,'transaction.json'));
  assert(manifest.schema==='stagecraft-maintenance/v1'&&manifest.root===root,'Backup belongs to another repository');
  assert(['applied','applying'].includes(manifest.status),'This run has no applied changes to restore');
  if(!force) {
    assert(manifest.after,'Interrupted transaction: inspect backup and use --force-restore to recover');
    assert(JSON.stringify(await fingerprint(root,Object.keys(manifest.before)))===JSON.stringify(manifest.after),'Managed files changed after upgrade; refusing to overwrite later edits');
  }
  // Validate backup integrity before any deletion.
  assert(JSON.stringify(await fingerprint(join(run,'backup'),Object.keys(manifest.before)))===JSON.stringify(manifest.before),'Backup integrity check failed');
  await restoreBackup(root,run,manifest);manifest.status='restored';await save(join(run,'transaction.json'),manifest);return manifest;
}
function publicPlan(plan) {return {...plan,changes:plan.changes.map(({files,executable,...c})=>({...c,fileCount:files.size,files:[...files].map(([path,b])=>({path,sha256:digest(b),bytes:b.length})),executable}))};}
export function parseArgs(args) {
  const options={mode:args.shift(),only:[],dryRun:false};
  assert(['update','upgrade'].includes(options.mode),'Expected update or upgrade');
  while(args.length) {
    const flag=args.shift();
    if(flag==='--dry-run')options.dryRun=true;
    else if(flag==='--help')options.help=true;
    else if(flag==='--force-restore')options.force=true;
    else if(['--only','--max-repos','--restore'].includes(flag)){
      const value=args.shift();assert(value&&!value.startsWith('--'),`Missing value for ${flag}`);
      if(flag==='--only')options.only=value.split(',');
      if(flag==='--max-repos'){options.maxRepos=Number(value);assert(Number.isInteger(options.maxRepos)&&options.maxRepos>=1&&options.maxRepos<=100,'max-repos must be 1..100');}
      if(flag==='--restore'){assert(/^[\w-]+$/.test(value),'Invalid backup run ID');options.restore=value;}
    } else throw new Error(`Unknown option: ${flag}`);
  }
  assert(!options.force||options.restore,'--force-restore requires --restore');
  assert(!(options.restore&&(options.dryRun||options.only.length||options.maxRepos)),'Restore cannot be combined with planning options');
  return options;
}
async function cli() {
  const options=parseArgs(process.argv.slice(2));
  if(options.help){console.log('update|upgrade [--dry-run] [--only id,id] [--max-repos N]\nupdate|upgrade --restore RUN_ID [--force-restore]\nDefault applies eligible changes, runs npm test and audit, and rolls back on failure. GITHUB_TOKEN is optional for public GitHub rate limits.');return;}
  const lock=join(ROOT,'.stagecraft-skills-maintenance.lock');let handle;
  try{handle=await open(lock,'wx');}catch{throw new Error('Skill maintenance is locked. Inspect its PID and pending transaction before recovering; do not run two updaters concurrently.');}
  try {
    await handle.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
    if(options.restore){await restoreRun(ROOT,join(ROOT,'output/skill-maintenance',options.restore),{force:options.force});console.log(`Restored ${options.restore}`);return;}
    const status=await exec('git',['status','--porcelain','--untracked-files=normal'],{cwd:ROOT});
    assert(options.dryRun||!status.stdout.trim(),'Commit or stash current changes before applying maintenance; --dry-run works without replacing files.');
    const config=await json(join(ROOT,'tooling/skill-maintenance.config.json'));if(options.maxRepos)config.maxRepositories=options.maxRepos;
    const runId=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
    const run=join(ROOT,'output/skill-maintenance',runId);await mkdir(run,{recursive:true});console.log(`Maintenance run: ${runId}`);
    const plan=await createPlan({mode:options.mode,only:options.only,config,onProgress:console.log});
    const report=publicPlan(plan);report.runId=runId;report.status=options.dryRun?'preview':'planned';
    await save(join(run,'report.json'),report);
    if(!options.dryRun&&plan.changes.length) {
      // A long online scan must not overwrite edits made after the initial check.
      assert(!(await exec('git',['status','--porcelain','--untracked-files=normal'],{cwd:ROOT})).stdout.trim(),'Working tree changed during discovery; report retained without applying');
      try {
        await applyPlan({run,plan,validate:async()=>{
          const npm=process.platform==='win32'?'npm.cmd':'npm';
          for(const args of [['test'],['run','audit:skills']]) {
            try{const result=await exec(npm,args,{cwd:ROOT,maxBuffer:20*1024*1024,timeout:600000});await writeFile(join(run,args.includes('test')?'tests.log':'audit.log'),result.stdout+result.stderr);}
            catch(e){await writeFile(join(run,'validation-failure.log'),(e.stdout??'')+(e.stderr??'')+'\n'+e.message);throw new Error('Validation failed; see validation-failure.log');}
          }
        }});report.status=plan.errors.length?'partially-applied':'applied';
      }catch(e){report.status='failed';report.failure=e.message;await save(join(run,'report.json'),report);throw e;}
    } else if(!options.dryRun)report.status=plan.errors.length?'blocked':'unchanged';
    await save(join(run,'report.json'),report);
    const lines=['# Skill maintenance report',`Mode: ${plan.mode}; status: ${report.status}`,`Selected: ${plan.selected.length}; changes: ${plan.changes.length}; errors: ${plan.errors.length}`,
      'Upgrade scores measure documented structure, not proven superiority. Discovery is bounded to configured GitHub searches.',
      ...plan.changes.map(c=>`- ${c.id}: ${c.previous.source} → ${c.source} (${c.scoreBefore.score} → ${c.scoreAfter.score}); ${c.reason}`),
      ...plan.errors.map(e=>`- BLOCKED ${e.scope}: ${e.reason}`),`Restore: npm run update-skills -- --restore ${runId}`];
    await writeFile(join(run,'report.md'),lines.join('\n\n')+'\n');
    console.log(`${report.status}: ${plan.changes.length} changes, ${plan.errors.length} unresolved. Report: ${join(run,'report.md')}`);
    if(plan.errors.length)process.exitCode=2;
  } finally {await handle.close();await rm(lock,{force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))cli().catch(e=>{console.error(e.message);process.exitCode=1;});
