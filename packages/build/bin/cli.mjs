#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const stage = manifest.name.split('/').at(-1);
const entry = { build: 'start', test: 'test', deploy: 'deploy' }[stage];
const command = process.argv[2];
if (command === '--version') {
  console.log(manifest.version);
} else if (!command || ['help', '--help'].includes(command)) {
  console.log(`${manifest.name} ${manifest.version}
run ${stage === 'build' ? '--prd <file> ' : ''}--dir <project> [runner options]
answer --run <run-directory> --file <answers.json>
status|resume --run <run-directory>
skills --dir <project> [--phase <phase>]
init --agent codex|claude [--dir <project>] [--dry-run]

run uses the runtime included in this package; no sibling package is required.
Use runner-help for all runtime flags. init only installs skills.`);
} else if (command === 'init') {
  await import('./installer.mjs');
} else if (['run', entry, 'answer', 'status', 'resume', 'skills', 'runner-help'].includes(command)) {
  if (command === 'run') process.argv[2] = entry;
  if (command === 'runner-help') process.argv[2] = '--help';
  await import('../runtime/bin/cli.mjs');
} else {
  console.error(`Unknown command: ${command}. Use --help.`);
  process.exitCode = 1;
}
