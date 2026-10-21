// Explicit fault-injection drill, used only with the bundled converter example.
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { answerRun, drive } from '../packages/runner/src/engine.mjs';
import { createCodexAdapter } from '../packages/runner/src/codex.mjs';
import { readState } from '../packages/runner/src/store.mjs';
const run = resolve(process.argv[2]);
const initial = await readState(run);
if (initial.status === 'waiting_input') {
  await answerRun(run, initial.pending.kind === 'plan_approval' ? { approve_plan: 'yes' } : { resume_action: 'retry' });
}
const codex = createCodexAdapter({ ignoreUserConfig: true });
const controller = new AbortController();
const state = await drive(run, {
  signal: controller.signal,
  agent: async context => {
    const reply = await codex(context);
    if (context.phase === 'implement' && reply.status === 'done') {
      const path = join(context.state.project, 'src/converter.js');
      const original = await readFile(path, 'utf8');
      const changed = original.replace(/\+\s*32\b/, '+ 31');
      if (changed === original) throw new Error('Drill could not locate conversion offset; no fault injected');
      await writeFile(path, changed);
      await writeFile(join(run, 'fault-injection.json'), JSON.stringify({
        at: new Date().toISOString(), file: path,
        change: 'Deliberate drill mutation: +32 becomes +31 after real Agent implementation, before runner verification.',
        purpose: 'Prove actual tests fail, interrupt before repair, then resume with real Codex repair.',
      }, null, 2));
    }
    return reply;
  },
  onEvent: event => {
    console.error(`${event.type}: ${event.phase} (${event.status})`);
    if (event.type === 'verification_failed') controller.abort(new Error('Deliberate recovery drill'));
  },
});
console.log(JSON.stringify({status: state.status,phase:state.phase,pending:state.pending},null,2));
