import { mkdir, readFile, lstat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readState, saveState, withLock } from './store.mjs';
import { validateResponse, validatePlan } from './contracts.mjs';
import { runCommand, smokeCheck } from './process.mjs';
import { prepareDeployment, applyDeployment, observeDeployment } from './deployment.mjs';
import { validateSetup, checkNewFiles, writeSetup, verifyGeneratedFiles } from './deployment-setup.mjs';

async function hashes(state, allowMissing = false) {
  const result = {};
  for (const file of state.approvedPlan.testFiles) {
    try {
      let path = state.project;
      for (const part of file.split('/')) {
        path = join(path, part);
        if ((await lstat(path)).isSymbolicLink()) throw new Error(`Frozen test cannot be a symbolic link: ${file}`);
      }
      result[file] = createHash('sha256').update(await readFile(path)).digest('hex');
    } catch (error) { if (!allowMissing || error.code !== 'ENOENT') throw error; }
  }
  return result;
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function wait(state, kind, questions, detail) {
  state.status = 'waiting_input';
  state.pending = { kind, questions, detail };
}
const actionQuestion = recommendation => [{
  id: 'resume_action',
  question: 'Resolve the issue, then choose retry; use manual_fix after fixing the implementation yourself. Use stop to cancel.',
  recommendation,
}];

export async function answerRun(runDir, answers) {
  return withLock(runDir, async () => {
    const state = await readState(runDir);
    if (state.status !== 'waiting_input' || !state.pending) throw new Error('Run is not waiting for input');
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Answers must be a JSON object');
    const expected = state.pending.questions.map(q => q.id);
    if (Object.keys(answers).length !== expected.length
      || !expected.every(id => typeof answers[id] === 'string' && answers[id].trim())) {
      throw new Error(`Provide exactly these nonempty string answers: ${expected.join(', ')}`);
    }
    const pending = state.pending;
    if (pending.kind === 'setup_approval') {
      if (answers.approve_setup === 'yes') {
        state.approvedSetup = structuredClone(validateSetup(state.setup, state.target));
        state.target = state.approvedSetup.target;
        state.phase = 'deploy_prepare';
      } else if (answers.approve_setup.startsWith('revise:') && answers.approve_setup.slice(7).trim()) {
        state.phase = 'deploy_discover';
      } else throw new Error('approve_setup must be yes or revise:<requested changes>');
    } else if (pending.kind === 'plan_approval') {
      if (answers.approve_plan === 'yes') {
        state.approvedPlan = structuredClone(validatePlan(state.plan, state.phase === 'deploy_plan' ? 'deploy' : state.entry ?? 'prd'));
        if (state.entry === 'test') {
          state.preexistingTests = await hashes(state, true);
          const missing = state.approvedPlan.testFiles.filter(file => !(file in state.preexistingTests));
          state.frozenTests = missing.length ? null : state.preexistingTests;
          state.phase = missing.length ? 'test_prepare' : 'verify';
        } else if (state.phase === 'deploy_plan') {
          state.phase = 'deploy';
        } else state.phase = 'implement';
      } else if (answers.approve_plan.startsWith('revise:') && answers.approve_plan.slice(7).trim()) {
        state.phase = state.phase === 'deploy_plan' ? 'deploy_plan' : state.entry && state.entry !== 'prd' ? `${state.entry}_plan` : 'plan';
      } else throw new Error('approve_plan must be yes or revise:<requested changes>');
    } else if (pending.kind !== 'agent') {
      if (!['retry', 'manual_fix', 'stop'].includes(answers.resume_action)) throw new Error('Choose retry, manual_fix, or stop');
      if (answers.resume_action === 'stop') state.status = 'cancelled';
      else if (answers.resume_action === 'manual_fix') {
        if (!state.approvedPlan) throw new Error('No approved implementation to verify');
        if (state.deployment?.intent) {
          state.deployment.reconciled = new Date().toISOString();
        }
        state.phase = (state.entry === 'deploy' || state.phase.startsWith('deploy')) ? (state.deployment?.intent ? 'deploy_verify' : 'deploy') : state.frozenTests ? 'verify' : state.entry === 'test' ? 'test_prepare' : 'implement';
      } else if (pending.kind === 'repair_budget') {
        state.repairLimit += 1; // Explicit, bounded extension; never reset past attempts.
        state.phase = 'repair';
      }
    }
    state.decisions.push({ at: new Date().toISOString(), phase: state.phase, request: pending, answers });
    state.pending = null;
    if (state.status !== 'cancelled') state.status = 'ready';
    await saveState(runDir, state, { type: 'answered', kind: pending.kind });
    return state;
  });
}

export async function drive(runDir, { agent, signal, onEvent = () => {} }) {
  runDir = resolve(runDir);
  return withLock(runDir, async () => {
    const state = await readState(runDir);
    if (['completed', 'cancelled', 'waiting_input'].includes(state.status)) return state;
    const save = async event => {
      await saveState(runDir, state, event);
      onEvent({ phase: state.phase, status: state.status, ...event });
    };
    if (state.status === 'running') {
      for (const attempt of state.attempts.filter(a => a.status === 'running')) attempt.status = 'interrupted';
      // A previous process may have died without cleaning up an Agent or local command.
      // Require reconciliation before replaying workspace mutations.
      wait(state, 'crash_recovery', actionQuestion('Inspect the last attempt log and stop any orphan child processes, then retry.'),
        'Previous owner exited without a checkpoint. Review workspace and local processes before replaying this phase.');
      await save({ type: 'crash_detected' });
      return state;
    }
    state.status = 'running';
    await save({ type: 'resumed' });
    try {
      while (state.status === 'running') {
        signal?.throwIfAborted();
        if (state.phase === 'deploy_prepare') {
          await writeSetup(state, save);
          state.phase = 'deploy_plan';
          await save({ type: 'deployment_files_generated' });
          continue;
        }
        if (['deploy', 'deploy_verify'].includes(state.phase)) {
          await verifyGeneratedFiles(state);
          if (!state.deployment.intent) {
            const results = [];
            for (let i = 0; i < state.approvedPlan.checks.length; i++) {
              const check = state.approvedPlan.checks[i];
              results.push(await runCommand(check.argv, { cwd: state.project, signal, timeoutMs: check.timeoutMs,
                log: join(runDir, 'attempts', `deploy-preflight-${i}.log`) }));
            }
            state.verification.push({ at: new Date().toISOString(), results, ok: results.every(r => r.ok) });
            if (!results.every(r => r.ok)) {
              wait(state, 'deployment_preflight', actionQuestion('Fix failed preflight checks, then retry.'), 'Deployment has not been applied.');
              await save({ type: 'deployment_preflight_failed' });
              continue;
            }
            await verifyGeneratedFiles(state);
            state.deployment.intent = new Date().toISOString();
            state.phase = 'deploy_verify';
            await save({ type: 'deployment_intent' });
            state.deployment.apply = await applyDeployment(state, runDir, signal);
            await save({ type: 'deployment_applied' });
          }
          const result = await observeDeployment(state, runDir, signal);
          state.verification.push({ at: new Date().toISOString(), results: [result], ok: result.ok });
          if (result.ok && (state.deployment.apply?.ok || state.deployment.reconciled)) {
            state.status = 'completed'; state.phase = 'completed'; state.outcome = 'passed';
            await writeFile(join(runDir, 'delivery.md'), `# Deployment\n\nService remains running: ${state.target.url}\n\nScoped cleanup argv: ${JSON.stringify(state.deployment.cleanupArgv)}\n\nEvidence: state.json and attempts/deploy-status.log\n`);
            await save({ type: 'completed' });
          } else {
            wait(state, 'deployment_health', actionQuestion('Inspect logs and the deployed revision. retry only rechecks health. manual_fix confirms you reconciled the intended release; create a new run to redeploy.'),
              `${result.observation}. Apply confirmed: ${Boolean(state.deployment.apply?.ok)}. Healthy old containers alone do not confirm this release.`);
            await save({ type: 'deployment_unhealthy' });
          }
          continue;
        }
        if (state.phase === 'verify') {
          const current = await hashes(state);
          if (!same(state.frozenTests, current)) {
            wait(state, 'test_integrity', actionQuestion('Restore the approved frozen test files, then retry.'),
              'Acceptance tests changed after the implementation checkpoint; verification cannot proceed.');
            await save({ type: 'test_integrity_failed' });
            break;
          }
          const index = state.verification.length + 1;
          const results = [];
          for (let i = 0; i < state.approvedPlan.checks.length; i++) {
            const check = state.approvedPlan.checks[i];
            const result = await runCommand(check.argv, {
              cwd: state.project, timeoutMs: check.timeoutMs, signal,
              log: join(runDir, 'attempts', `verify-${index}-${i}.log`),
            });
            results.push({ name: check.name, ...result });
          }
          if (results.every(r => r.ok) && state.approvedPlan.smoke) {
            results.push(await smokeCheck(state.approvedPlan.smoke, {
              cwd: state.project, signal, log: join(runDir, 'attempts', `smoke-${index}.log`),
            }));
          }
          // A test command must not quietly mutate its own acceptance baseline.
          if (!same(state.frozenTests, await hashes(state))) throw new Error('Verification modified frozen tests');
          const verification = { at: new Date().toISOString(), results, ok: results.every(r => r.ok) };
          state.verification.push(verification);
          if (verification.ok && state.entry === 'prd' && state.until === 'deploy') {
            state.buildDelivery = { at: new Date().toISOString(), plan: structuredClone(state.approvedPlan), verificationIndex: state.verification.length - 1 };
            state.phase = 'deploy_discover';
            await save({ type: 'build_verified_continuing_to_deploy' });
            continue;
          }
          if (verification.ok || (state.entry === 'test' && state.mode === 'audit' && !results.some(r => r.error || r.kind === 'environment'))) {
            state.outcome = verification.ok ? 'passed' : 'failed';
            state.status = 'completed';
            state.phase = 'completed';
            await writeFile(join(runDir, 'delivery.md'), `# Delivery\n\nOutcome: ${state.outcome}\n\nProject: ${state.project}\n\nStack: ${state.approvedPlan.stack}\n\nArchitecture: ${state.approvedPlan.architecture}\n\nStart locally (argv): ${JSON.stringify(state.approvedPlan.smoke?.argv ?? null)}\n\nSmoke URL: ${state.approvedPlan.smoke?.url ?? 'Not requested'}\n\nThe smoke server was stopped after verification. See state.json for actual commands, results and log paths.\n`);
            await save({ type: 'completed' });
          } else if (results.some(r => r.kind === 'environment' || r.error)) {
            wait(state, 'environment', actionQuestion('Resolve the environment problem, then retry.'),
              'A required executable or smoke port is unavailable.');
            await save({ type: 'environment_blocked' });
          } else if (state.repairsUsed >= state.repairLimit) {
            wait(state, 'repair_budget', actionQuestion('Inspect failures; retry grants exactly one more automatic repair.'),
              `Repair budget exhausted (${state.repairsUsed}/${state.repairLimit}).`);
            await save({ type: 'repair_budget_exhausted' });
          } else {
            state.phase = 'repair';
            await save({ type: 'verification_failed' });
          }
          continue;
        }
        const phase = state.phase;
        if (!['clarify', 'plan', 'test_plan', 'deploy_plan', 'deploy_discover', 'test_prepare', 'implement', 'repair'].includes(phase)) throw new Error(`Unknown phase: ${phase}`);
        if (phase === 'repair') {
          if (state.repairsUsed >= state.repairLimit) {
            wait(state, 'repair_budget', actionQuestion('retry grants one more repair attempt'), 'Repair budget exhausted.');
            await save({ type: 'repair_budget_exhausted' });
            break;
          }
          state.repairsUsed++;
        }
        const attempt = { number: state.attempts.length + 1, phase, status: 'running', startedAt: new Date().toISOString() };
        state.attempts.push(attempt);
        const attemptDir = join(runDir, 'attempts', `${attempt.number}-${phase}`);
        await mkdir(attemptDir, { recursive: true });
        await save({ type: 'agent_started', attempt: attempt.number });
        const response = validateResponse(await agent({ phase, state: structuredClone(state), attemptDir, signal }), phase);
        signal?.throwIfAborted();
        attempt.status = 'done';
        attempt.summary = response.summary;
        await writeFile(join(attemptDir, 'validated-response.json'), JSON.stringify(response, null, 2));
        if (response.status === 'needs_input') {
          // Asking a question is not a failed repair attempt.
          if (phase === 'repair') state.repairsUsed--;
          wait(state, 'agent', response.questions, response.summary);
        } else if (phase === 'clarify') {
          state.phase = 'plan';
        } else if (phase === 'deploy_discover') {
          state.setup = validateSetup(response.setup, state.target);
          await checkNewFiles(state.project, state.setup);
          await writeFile(join(runDir, 'deployment-setup.json'), JSON.stringify(state.setup, null, 2), { mode: 0o600 });
          wait(state, 'setup_approval', [{
            id: 'approve_setup',
            question: 'Review detected stack, evidence, target and proposed file contents in setup/deployment-setup.json. Answer yes or revise:<changes>.',
            recommendation: 'yes',
          }], response.summary);
        } else if (['plan', 'test_plan', 'deploy_plan'].includes(phase)) {
          state.plan = response.plan;
          if (phase === 'deploy_plan') {
            await verifyGeneratedFiles(state);
            state.deployment = await prepareDeployment(state, runDir, signal);
          }
          wait(state, 'plan_approval', [{
            id: 'approve_plan',
            question: 'Review state.plan commands and, for deployment, state.target and compose.approved.json. Answer yes to approve, or revise:<changes>.',
            recommendation: 'yes',
          }], response.summary);
        } else {
          if (phase === 'test_prepare') {
            const current = await hashes(state);
            for (const [file, hash] of Object.entries(state.preexistingTests)) {
              if (current[file] !== hash) throw new Error(`Existing acceptance test changed: ${file}`);
            }
            state.frozenTests = current;
          }
          if (phase === 'implement') state.frozenTests = await hashes(state);
          state.phase = 'verify';
        }
        await save({ type: response.status === 'needs_input' ? 'needs_input' : 'agent_finished', attempt: attempt.number });
      }
    } catch (error) {
      const last = state.attempts.at(-1);
      if (last?.status === 'running') last.status = signal?.aborted ? 'interrupted' : 'failed';
      if (signal?.aborted) {
        state.status = 'paused';
        await save({ type: 'paused', message: 'Interrupted; resume re-runs the unfinished phase against current files.' });
      } else {
        wait(state, 'execution_error', actionQuestion('Inspect the error and attempt log, resolve the cause, then retry.'), error.message);
        await save({ type: 'execution_error', message: error.message });
      }
    }
    return state;
  });
}
