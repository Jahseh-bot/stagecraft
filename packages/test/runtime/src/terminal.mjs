import { createInterface } from 'node:readline';

const phases = { clarify: '澄清需求', plan: '制定方案', implement: '编写应用', verify: '测试验收', repair: '修复问题', test_plan: '制定测试方案', test_prepare: '准备测试', deploy_discover: '准备部署配置', deploy_prepare: '生成部署文件', deploy_plan: '制定部署方案', deploy: '部署应用', deploy_verify: '检查部署', completed: '完成' };
export const phaseLabel = phase => phases[phase] ?? phase;
// Model output is text, never terminal control sequences.
const safe = value => String(value ?? '').replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '');

export function createTerminal({ input = process.stdin, output = process.stdout, signal, resumeCommand = 'stagecraft resume' } = {}) {
  const line = value => output.write(`${safe(value)}\n`);
  async function ask(label) {
    if (signal?.aborted) return null;
    const rl = createInterface({ input, output, terminal: Boolean(input.isTTY && output.isTTY) });
    return new Promise(resolve => {
      let finished = false;
      const finish = value => {
        if (finished) return;
        finished = true;
        signal?.removeEventListener('abort', abort);
        rl.close();
        resolve(value);
      };
      const abort = () => finish(null);
      rl.once('close', () => finish(null));
      rl.once('SIGINT', abort);
      signal?.addEventListener('abort', abort, { once: true });
      rl.question(label, value => finish(value.trim()));
    });
  }
  async function prompt(state) {
    line(`\n── ${phaseLabel(state.phase)} · 等待你的回答 ──`);
    line(state.pending.detail);
    const approval = ['plan_approval', 'setup_approval'].includes(state.pending.kind);
    if (approval) {
      line(state.pending.kind === 'plan_approval' ? '\n请审阅将执行的方案（含命令与测试）：' : '\n请审阅将创建的配置和文件内容：');
      line(JSON.stringify(state.pending.kind === 'plan_approval' ? state.plan : state.setup, null, 2));
      if (state.target) line(JSON.stringify({ target: state.target, deployment: state.deployment }, null, 2));
      line('输入「是」批准，或直接描述修改意见。空回车不会批准。');
    } else if (state.pending.kind !== 'agent') {
      line('输入 1 重试 / 2 已手动修复 / 3 取消任务。重试前请先处理上面的错误。');
      if (state.pending.kind === 'repair_budget') line('注意：重试将增加一次自动修复额度。');
    } else {
      line('逐题输入回答；输入「是」或直接回车接受该题建议，也可以输入自己的要求。');
    }
    line('输入 /pause 或按 Ctrl+C 暂停，之后可用 resume 继续。');
    const answers = {};
    for (const [index, q] of state.pending.questions.entries()) {
      if (state.pending.kind === 'agent') {
        line(`\n${index + 1}/${state.pending.questions.length} ${q.question}`);
        if (q.recommendation) line(`建议：${q.recommendation}`);
      }
      while (true) {
        const value = await ask('你的回答 › ');
        if (value === null || value === '/pause') return null;
        if (approval) {
          if (/^(是|同意|确认|yes|y)$/i.test(value)) answers[q.id] = 'yes';
          else if (value && !/^(否|不|no|n)$/i.test(value)) {
            const revision = value.replace(/^revise:/i, '').trim();
            if (revision) answers[q.id] = `revise:${revision}`;
          }
          if (!answers[q.id]) { line('请明确输入「是」批准，或写出具体修改意见；暂不决定可输入 /pause。'); continue; }
        } else if (state.pending.kind !== 'agent') {
          const action = ({ '1': 'retry', '重试': 'retry', '2': 'manual_fix', '已修复': 'manual_fix', '3': 'stop', '取消': 'stop' })[value] ?? value;
          if (!['retry', 'manual_fix', 'stop'].includes(action)) { line('请输入 1、2、3 或 /pause。'); continue; }
          if (action === 'manual_fix' && !state.approvedPlan) { line('还没有批准的实现方案，请处理环境问题后选择 1 重试。'); continue; }
          answers[q.id] = action;
        } else {
          answers[q.id] = (!value || /^(是|yes|y)$/i.test(value)) && q.recommendation ? q.recommendation : value;
          if (!answers[q.id]) { line('这道题没有建议，请输入你的回答。'); continue; }
        }
        break;
      }
    }
    return answers;
  }
  return { prompt, line, event(event) {
    if (event.type === 'agent_started') line(`\n◌ ${phaseLabel(event.phase)}，正在处理，请稍候…（Ctrl+C 可暂停）`);
    if (event.type === 'verification_failed') line('测试发现问题，正在进入修复。');
  }, finish(state, runDir, paused = false) {
    if (paused || state.status === 'paused') line('\n已暂停，任务记录已保留。');
    else if (state.status === 'cancelled') line('\n任务已取消，记录仍保留。');
    else if (state.status === 'completed') {
      line(state.outcome === 'passed' ? '\n✓ 任务完成，验收通过。' : '\n测试完成，发现未通过项。');
      line(`交付说明：${runDir}/delivery.md`);
    }
    line(`任务目录：${runDir}`);
    if (paused || state.status === 'paused' || state.status === 'waiting_input') {
      line(`继续命令：${resumeCommand} --run ${JSON.stringify(runDir)}`);
    }
  } };
}
