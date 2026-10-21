import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile, cp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(await readFile(join(root, 'packages/runner/package.json'))).version;
const destination = resolve(process.argv[2] ?? join(root, 'output/releases', version));
execFileSync(process.execPath, [join(root, 'tooling/build.mjs')], { cwd: root, stdio: 'inherit' });
await mkdir(destination, { recursive: true });
await rm(join(destination, 'skills'), { recursive: true, force: true });
await cp(join(root, 'skills'), join(destination, 'skills'), { recursive: true });
const artifacts = [];
for (const name of (await readdir(join(root, 'packages'), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()) {
  const cwd = join(root, 'packages', name);
  const metadata = JSON.parse(await readFile(join(cwd, 'package.json')));
  if (metadata.version !== version) throw new Error(`Version mismatch: ${metadata.name}`);
  if (metadata.dependencies || metadata.optionalDependencies) throw new Error(`Expected self-contained package: ${metadata.name}`);
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', destination], { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
  const paths = pack.files.map(file => file.path);
  if (paths.some(path => /(^|\/)(node_modules|output|\.stagecraft|\.env)(\/|$)/.test(path))) throw new Error(`Unexpected payload: ${pack.name}`);
  artifacts.push({ name: pack.name, version, filename: pack.filename, integrity: pack.integrity,
    sha256: createHash('sha256').update(await readFile(join(destination, pack.filename))).digest('hex'),
    size: pack.size, unpackedSize: pack.unpackedSize, files: paths });
}
await writeFile(join(destination, 'manifest.json'), JSON.stringify({ version, createdAt: new Date().toISOString(), registryPublished: false, artifacts }, null, 2) + '\n');
console.log(`Prepared ${artifacts.length} installable packages at ${destination}. Nothing was published.`);
