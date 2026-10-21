import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { join, relative, resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'output'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}
export async function treeHash(directory) {
  const digest = createHash('sha256');
  const paths = await files(directory);
  for (const path of paths) digest.update(relative(directory,path) + '\0' + hash(await readFile(path)) + '\n');
  return { sha256:digest.digest('hex'), files:paths.length };
}
export async function auditSkills() {
  const profile = JSON.parse(await readFile(join(root,'packages/runner/skills.profile.json')));
  const baseline = JSON.parse(await readFile(join(root,'tooling/upstream-integrity.json')));
  const upstream = [];
  const errors = [];
  for (const pinned of baseline.skills) {
    const skill = profile.skills.find(s => s.id === pinned.id);
    if (!skill) { errors.push(`Removed third-party skill: ${pinned.id}`); continue; }
    if (skill.path !== pinned.path) errors.push(`Moved third-party source: ${pinned.id}`);
    try {
      const actual = await treeHash(join(root,'packages/runner',pinned.path));
      const unchanged = actual.sha256 === pinned.sha256 && actual.files === pinned.files;
      if (!unchanged) errors.push(`Changed third-party content: ${pinned.id}`);
      upstream.push({id:pinned.id,...actual,unchanged,source:skill.source,revision:skill.revision,license:skill.license});
    } catch (error) { errors.push(`${pinned.id}: ${error.message}`); }
  }
  // New methods are allowed, but require deliberate provenance and integrity registration.
  for (const skill of profile.skills) {
    if (!baseline.skills.some(s => s.id === skill.id)) errors.push(`New method needs integrity registration: ${skill.id}`);
    if (!skill.source || !skill.revision || !skill.license) errors.push(`Missing provenance: ${skill.id}`);
  }
  const paths = [...await files(join(root,'packages')), ...await files(join(root,'skills'))].filter(p=>p.endsWith('/SKILL.md'));
  const entries = [];
  for (const path of paths) {
    const body = await readFile(path,'utf8');
    const thirdParty = path.includes('/vendor/') || path.includes('/references/upstream/');
    const missingLinks = [];
    for (const [, raw] of body.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) continue;
      const link = raw.split('#')[0];
      if (!link || link.includes(' ') || link.includes('<')) continue;
      try { await access(resolve(dirname(path),link)); }
      catch { missingLinks.push(raw); }
    }
    const metadata = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const name = metadata?.[1].match(/^name:\s*(.+)$/m)?.[1];
    const description = metadata?.[1].match(/^description:\s*(.+)$/m)?.[1];
    if (!thirdParty && (!name || !description || missingLinks.length)) errors.push(`First-party metadata or links invalid: ${relative(root,path)}`);
    entries.push({path:relative(root,path),ownership:thirdParty?'third-party':'first-party',name,lines:body.split('\n').length,missingLinks});
  }
  return { schema:'stagecraft-skill-audit/v1', scannedAt:new Date().toISOString(),
    scope:'Source, bundled runtime and public catalog areas; excludes output and dependencies. Structural and integrity audit, not a semantic or behavioral certification.',
    counts:{entrypoints:entries.length,thirdPartySources:profile.skills.length,firstPartyCopies:entries.filter(e=>e.ownership==='first-party').length},
    upstream,entries,errors };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await auditSkills();
  const output = join(root,'output/audits/skills.json');
  await mkdir(dirname(output),{recursive:true}); await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({ ...report.counts, errors:report.errors,report:output },null,2));
  if (report.errors.length) process.exitCode=1;
}
