const releaseMetadata = JSON.parse(await readFile(new URL('../packages/runner/package.json', import.meta.url)));
const releaseScope = releaseMetadata.name.split('/')[0];
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, access, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
for (const [stage, entry] of Object.entries({build:'prd',test:'test',deploy:'deploy'})) {
  test(`${stage} tarball alone installs and executes its embedded runtime outside workspace`, async t => {
    const root=await mkdtemp(join(tmpdir(),'stagecraft-dist-'));t.after(()=>rm(root,{recursive:true,force:true}));
    const cwd=fileURLToPath(new URL(`../packages/${stage}/`,import.meta.url));
    const [pack]=JSON.parse(execFileSync('npm',['pack','--json','--pack-destination',root],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}));
    const consumer=join(root,'consumer');await mkdir(consumer);await writeFile(join(consumer,'package.json'),'{"private":true}');
    execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',join(root,pack.filename)],{cwd:consumer,encoding:'utf8'});
    await assert.rejects(access(join(consumer,'node_modules', releaseScope, 'runner')));
    const installed=join(consumer,'node_modules', releaseScope,stage), bin=join(installed,'bin/cli.mjs');
    assert.equal(execFileSync(process.execPath,[bin,'--version'],{encoding:'utf8'}).trim(),releaseMetadata.version);
    const project=join(root,'app');await mkdir(project);
    const selection=JSON.parse(execFileSync(process.execPath,[bin,'skills','--dir',project,'--stack','vue,postgres','--phase','repair'],{encoding:'utf8'}));
    assert.ok(selection.ids.includes('vue-debug-guides'));assert.ok(selection.ids.includes('supabase-postgres-best-practices'));
    const fake=join(root,'unavailable-codex.mjs');await writeFile(fake,`#!${process.execPath}\nprocess.exit(1);\n`);await chmod(fake,0o755);
    const prd=join(root,'PRD.md');await writeFile(prd,'A parcel quote app');
    const args=[bin,'run','--dir',project,'--state-root',join(root,'runs')];if(stage==='build')args.push('--prd',prd);
    const result=spawnSync(process.execPath,args,{cwd:consumer,env:{...process.env,STAGECRAFT_CODEX_BIN:fake},encoding:'utf8'});
    assert.equal(result.status,2,result.stderr);const reply=JSON.parse(result.stdout);const state=JSON.parse(await readFile(join(reply.runDir,'state.json')));
    assert.equal(state.entry,entry);assert.equal(state.pending.kind,'execution_error');
    const lock=JSON.parse(await readFile(join(reply.runDir,'skills.lock.json')));assert.equal(lock.skills.length,38);
    const {skillContext}=await import(pathToFileURL(join(installed,'runtime/src/skills.mjs')).href);
    assert.match(await skillContext(reply.runDir,'repair'),/Diagnosing Bugs/);
    assert.equal((await readdir(join(root,'runs'))).length,1);
  });
}
