const string = { type: 'string' };
const strings = { type: 'array', items: string };
const object = properties => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
});
const question = object({ id: string, question: string, recommendation: string });
const check = object({ name: string, argv: strings, timeoutMs: { type: 'integer' } });
const smoke = object({
  argv: strings, url: string, expectedStatus: { type: 'integer' },
  bodyIncludes: string, timeoutMs: { type: 'integer' },
});
export const responseSchema = object({
  status: { type: 'string', enum: ['done', 'needs_input'] },
  summary: string,
  questions: { type: 'array', items: question },
  plan: { anyOf: [
    object({ stack: string, architecture: string, tasks: strings,
      checks: { type: 'array', items: check }, testFiles: strings, smoke: { anyOf: [smoke, { type: 'null' }] } }),
    { type: 'null' },
  ] },
});

export const setupResponseSchema = object({
  status: { type: 'string', enum: ['done', 'needs_input'] }, summary: string,
  questions: { type: 'array', items: question }, plan: { type: 'null' },
  setup: { anyOf: [object({ stack: string, evidence: strings,
    target: object({ provider: { type: 'string', enum: ['compose'] }, context: string,
      projectName: string, file: string, url: string, expectedStatus: { type: 'integer' },
      bodyIncludes: string, timeoutMs: { type: 'integer' } }),
    files: { type: 'array', items: object({ path: string, content: string }) },
  }), { type: 'null' }] },
});

function ensure(condition, message) {
  if (!condition) throw new Error(`Invalid contract: ${message}`);
}
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function command(value) {
  ensure(Array.isArray(value) && value.length > 0 && value.every(text), 'argv must be a nonempty string array');
  ensure(value.every(item => !item.includes('\0')), 'argv contains NUL');
}
function timeout(value) {
  ensure(Number.isInteger(value) && value >= 100 && value <= 600_000, 'timeoutMs must be 100..600000');
}
export function validatePlan(plan, entry = 'prd') {
  ensure(plan && text(plan.stack) && text(plan.architecture), 'stack and architecture required');
  if (entry === 'deploy') ensure(plan.smoke === null, 'deployment uses target health, not startup smoke');
  ensure(Array.isArray(plan.tasks) && plan.tasks.length && plan.tasks.every(text), 'tasks required');
  ensure(Array.isArray(plan.checks) && plan.checks.length, 'at least one real acceptance check required');
  const names = new Set();
  for (const check of plan.checks) {
    ensure(text(check.name) && !names.has(check.name), 'unique check names required');
    names.add(check.name);
    command(check.argv);
    timeout(check.timeoutMs);
  }
  ensure(Array.isArray(plan.testFiles) && (entry === 'deploy' || plan.testFiles.length), 'at least one acceptance test file required');
  for (const file of plan.testFiles) {
    ensure(text(file) && !file.startsWith('/') && !file.includes('\\')
      && !file.split('/').some(p => ['..', '.', '', '.stagecraft'].includes(p))
      && !file.includes(':') && !file.includes('\0'), 'testFiles must be safe project-relative paths');
  }
  ensure(new Set(plan.testFiles).size === plan.testFiles.length, 'duplicate testFiles');
  if (entry !== 'prd' && plan.smoke === null) return plan;
  ensure(plan.smoke, 'local smoke check required');
  command(plan.smoke.argv);
  timeout(plan.smoke.timeoutMs);
  const url = new URL(plan.smoke.url);
  ensure(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    && !url.username && !url.password && !url.hash && url.port, 'smoke URL must be local HTTP with an explicit port');
  ensure(Number.isInteger(plan.smoke.expectedStatus) && plan.smoke.expectedStatus >= 200
    && plan.smoke.expectedStatus < 300, 'smoke status must be 2xx');
  ensure(text(plan.smoke.bodyIncludes), 'smoke must assert expected response content');
  return plan;
}
export function validateResponse(reply, phase) {
  ensure(reply && ['done', 'needs_input'].includes(reply.status) && text(reply.summary), 'invalid agent response');
  ensure(Array.isArray(reply.questions), 'questions must be an array');
  const ids = new Set();
  for (const q of reply.questions) {
    ensure(q && /^[a-z][a-z0-9_-]{0,63}$/.test(q.id) && !['constructor', 'prototype', 'approve_plan', 'approve_setup', 'resume_action'].includes(q.id)
      && !ids.has(q.id) && text(q.question) && text(q.recommendation), 'invalid or duplicate question');
    ids.add(q.id);
  }
  ensure(reply.status === 'needs_input' ? reply.questions.length > 0 : reply.questions.length === 0,
    'questions must correspond to needs_input');
  if (['plan', 'test_plan', 'deploy_plan'].includes(phase) && reply.status === 'done') validatePlan(reply.plan, phase === 'plan' ? 'prd' : phase.split('_')[0]);
  return reply;
}
