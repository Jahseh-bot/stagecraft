import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createTerminal } from '../packages/runner/src/terminal.mjs';

async function prompt(state, replies, options = {}) {
  const input = new PassThrough(), output = new PassThrough();
  let text = '', index = 0;
  output.on('data', chunk => {
    text += chunk;
    if (String(chunk).includes('你的回答 › ')) setImmediate(() => {
      const reply = replies[index++];
      if (reply === null) input.end();
      else if (reply !== undefined) input.write(reply + '\n');
    });
  });
  const terminal = createTerminal({ input, output, ...options });
  const answers = await terminal.prompt(state);
  input.destroy(); output.destroy();
  return { answers, text, count: index };
}
const question = { id: 'flow', question: '采用即时换算？', recommendation: '即时换算，默认摄氏转华氏。' };
const state = { phase: 'clarify', pending: { kind: 'agent', detail: '需要确认', questions: [question, { ...question, id: 'mobile' }] } };
test('终端逐题收集答案，回车/是展开为建议，保留自定义回答', async () => {
  const result = await prompt(state, ['是', '需要真实手机访问']);
  assert.deepEqual(result.answers, { flow: question.recommendation, mobile: '需要真实手机访问' });
  assert.match(result.text, /2\/2/);
  assert.deepEqual((await prompt(state, ['', 'yes'])).answers, { flow: question.recommendation, mobile: question.recommendation });
});
test('方案内容先呈现，空回车和否不会批准，可提交修改意见', async () => {
  const approval = { phase: 'plan', plan: { checks: [{ argv: ['npm', 'test'] }] }, pending: { kind: 'plan_approval', questions: [{ id: 'approve_plan' }] } };
  const result = await prompt(approval, ['', '否', '改用原生 JavaScript']);
  assert.equal(result.answers.approve_plan, 'revise:改用原生 JavaScript');
  assert.match(result.text, /npm/);
  assert.equal(result.count, 3);
  assert.equal((await prompt(approval, ['是'])).answers.approve_plan, 'yes');
});
test('配置确认显示拟创建文件；未批准的任务不能选择手动修复', async () => {
  const setup = { phase: 'deploy_discover', setup: { files: [{ path: 'Dockerfile', content: 'FROM node:22' }] }, pending: { kind: 'setup_approval', questions: [{ id: 'approve_setup' }] } };
  const result = await prompt(setup, ['yes']);
  assert.match(result.text, /FROM node:22/);
  assert.equal(result.answers.approve_setup, 'yes');
  const failed = { phase: 'clarify', pending: { kind: 'execution_error', questions: [{ id: 'resume_action' }] } };
  assert.equal((await prompt(failed, ['是', '2', '1'])).answers.resume_action, 'retry');
  assert.equal((await prompt(failed, ['3'])).answers.resume_action, 'stop');
});
test('暂停、EOF 或中止均不提交部分答案', async () => {
  assert.equal((await prompt(state, ['是', '/pause'])).answers, null);
  assert.equal((await prompt(state, [null])).answers, null);
  const controller = new AbortController(); controller.abort();
  assert.equal((await prompt(state, [], { signal: controller.signal })).answers, null);
});
