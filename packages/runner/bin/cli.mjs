#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRun, readState } from '../src/store.mjs';
import { answerRun, drive } from '../src/engine.mjs';
import { createTerminal } from '../src/terminal.mjs';
import { createCodexAdapter } from '../src/codex.mjs';
import { defaultProfile } from '../src/skills.mjs';
import { detectTechnologies, selectSkillIds } from '../src/stack-skills.mjs';

const help = `stagecraft start --prd <file> --dir <project> [--state-root <dir>] [--max-repairs 2] [--agent-timeout-ms 600000] [--skills <profile.json>]
stagecraft test --dir <existing-project> [--mode audit|repair] [--goal <text>]
stagecraft deploy --dir <existing-project> [--target <local-compose-target.json>] [--goal <text>]
stagecraft status --run <run-directory>
stagecraft answer --run <run-directory> --file <answers.json>
stagecraft resume --run <run-directory>
stagecraft skills --dir <project> [--stack vue,flutter] [--phase implement] [--skills <profile.json>]

Interactive terminals prompt for answers and continue automatically.
Use --json for automation; --interactive forces prompts (requires a terminal).
answer saves decisions and automatically continues. SIGINT pauses. Status is JSON.
start accepts --until deploy to continue automatically from verified build into deployment.
start/test/deploy accept --stack vue,flutter,... to explicitly select technology skills.
Without --target, deploy discovers the stack and proposes missing configuration.
Execution uses the local authenticated Codex CLI. No npm publishing or production deployment.
Exit codes: 0 passed/status, 2 waiting for input, 3 audit found failures, 130 paused, 1 invalid command/error.`;

async function main() {
  const metadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const args = process.argv.slice(2);
  const command = args.shift();
  if (command === '--version' && !args.length) {
    console.log(JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version);
    return;
  }
  if (!command || ['--help', 'help'].includes(command)) { console.log(help); return; }
  const allowed = {
    start: ['--until', '--prd', '--dir', '--state-root', '--max-repairs', '--agent-timeout-ms', '--skills', '--stack'],
    test: ['--dir', '--mode', '--goal', '--state-root', '--max-repairs', '--agent-timeout-ms', '--skills', '--stack'],
    deploy: ['--dir', '--target', '--goal', '--state-root', '--agent-timeout-ms', '--skills', '--stack'],
    skills: ['--dir', '--stack', '--phase', '--skills'],
    status: ['--run'], resume: ['--run'], answer: ['--run', '--file'],
  }[command];
  if (allowed && ['start', 'test', 'deploy', 'resume', 'answer'].includes(command)) allowed.push('--json', '--interactive');
  if (!allowed) throw new Error(`Unknown command: ${command}`);
  const options = {};
  while (args.length) {
    const key = args.shift();
    if (!allowed.includes(key) || key in options) throw new Error(`Unknown or duplicate option: ${key}`);
    if (['--json', '--interactive'].includes(key)) { options[key] = true; continue; }
    const value = args.shift();
    if (!value || value.startsWith('--')) throw new Error(`Missing value: ${key}`);
    options[key] = value;
  }
  if (options['--json'] && options['--interactive']) throw new Error('--json and --interactive cannot be combined');
  const hasTerminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  if (options['--interactive'] && !hasTerminal) throw new Error('--interactive requires a terminal');
  const interactive = hasTerminal && !options['--json'];
  let runDir;
  if (command === 'skills') {
    if (!options['--dir']) throw new Error('--dir is required');
    const profile = JSON.parse(await readFile(resolve(options['--skills'] ?? defaultProfile), 'utf8'));
    const phase = options['--phase'] ?? 'implement';
    if (!profile.phases[phase]) throw new Error(`Unknown phase: ${phase}`);
    const detection = await detectTechnologies(resolve(options['--dir']), options['--stack']?.split(',').map(t => t.trim().toLowerCase()) ?? []);
    const selection = selectSkillIds(profile, phase, detection);
    console.log(JSON.stringify({ ...selection, sources: profile.skills.filter(s => selection.ids.includes(s.id)) }, null, 2));
    return;
  }
  if (['start', 'test', 'deploy'].includes(command)) {
    if ((command === 'start' && !options['--prd']) || !options['--dir']) throw new Error('--prd and --dir are required');
    runDir = await createRun({
      until: options['--until'] ?? 'runnable',
      technologies: options['--stack'] ? options['--stack'].split(',').map(t => t.trim().toLowerCase()) : [],
      entry: command === 'start' ? 'prd' : command, mode: options['--mode'] ?? 'audit', goal: options['--goal'],
      target: command === 'deploy' && options['--target'] ? JSON.parse(await readFile(resolve(options['--target']), 'utf8')) : undefined,
      project: options['--dir'], prd: options['--prd'], stateRoot: options['--state-root'],
      maxRepairs: Number(options['--max-repairs'] ?? 2),
      agentTimeoutMs: Number(options['--agent-timeout-ms'] ?? 600_000),
      skillsProfile: options['--skills'],
    });
    console.error(`Run directory: ${runDir}`);
  } else {
    if (!options['--run']) throw new Error('--run is required');
    runDir = resolve(options['--run']);
  }
  if (command === 'status') {
    console.log(JSON.stringify(await readState(runDir), null, 2));
    return;
  }
  if (command === 'answer') {
    if (!options['--file']) throw new Error('--file is required');
    await answerRun(runDir, JSON.parse(await readFile(resolve(options['--file']), 'utf8')));
  }
  const controller = new AbortController();
  const interrupt = () => controller.abort(new Error('User interrupted'));
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  try {
    const terminal = interactive ? createTerminal({ signal: controller.signal, resumeCommand: `npx --yes ${metadata.name}@${metadata.version} resume` }) : null;
    const agent = createCodexAdapter();
    let state, paused = false;
    do {
      state = await drive(runDir, {
        agent, signal: controller.signal,
        onEvent: event => terminal ? terminal.event(event) : console.error(`${event.type}: ${event.phase} (${event.status})`),
      });
      if (!terminal || state.status !== 'waiting_input') break;
      const answers = await terminal.prompt(state);
      if (!answers || controller.signal.aborted) { paused = true; break; }
      await answerRun(runDir, answers);
    } while (true);
    if (terminal) terminal.finish(state, runDir, paused);
    else console.log(JSON.stringify({ runDir, status: state.status, outcome: state.outcome ?? null, phase: state.phase,
      pending: state.pending, plan: state.plan, setup: state.setup ?? null, target: state.target ?? null, deployment: state.deployment ?? null }, null, 2));
    process.exitCode = paused || state.status === 'paused' ? 130 : state.status === 'waiting_input' ? 2 : state.outcome === 'failed' ? 3 : 0;
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
