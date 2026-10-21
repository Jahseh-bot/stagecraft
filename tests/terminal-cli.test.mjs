import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRun, readState } from '../packages/runner/src/store.mjs';
import { drive } from '../packages/runner/src/engine.mjs';

test('CLI 非终端保持 JSON；真实 PTY 回答两题后自动继续，再暂停并恢复', { timeout: 30000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'stagecraft-tui-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const prd = join(dir, 'PRD.md'); await writeFile(prd, 'Temperature converter');
  const run = await createRun({ project: join(dir, 'app'), prd });
  await drive(run, { agent: async () => ({ status: 'needs_input', summary: 'Choose behavior', plan: null,
    questions: [{ id: 'flow', question: '即时换算？', recommendation: '即时换算' }, { id: 'mobile', question: '仅本机？', recommendation: '仅本机' }] }) });
  const cli = resolve('packages/runner/bin/cli.mjs');
  const json = spawnSync(process.execPath, [cli, 'resume', '--run', run, '--json'], { encoding: 'utf8' });
  assert.equal(json.status, 2); assert.equal(JSON.parse(json.stdout).pending.kind, 'agent');
  assert.ok(!json.stdout.includes('你的回答'));
  const python = spawnSync('python3', ['-c', 'import pty'], { encoding: 'utf8' });
  if (python.status !== 0) { t.diagnostic('PTY test unavailable on this host; JSON verified'); return; }
  const fake = join(dir, 'codex');
  await writeFile(fake, `#!/usr/bin/env node\nimport {writeFileSync} from 'node:fs';\nconst args=process.argv.slice(2);\nwriteFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify({status:'needs_input',summary:'Follow-up reached',questions:[{id:'next',question:'继续吗？',recommendation:'继续'}],plan:null}));\n`);
  await chmod(fake, 0o755);
  const script = `import os,pty,select,sys,time,json\npid,fd=pty.fork()\nif pid==0:\n os.execve(sys.argv[1],[sys.argv[1],sys.argv[2],'resume','--run',sys.argv[3]],dict(os.environ,STAGECRAFT_CODEX_BIN=sys.argv[4]))\ndata=b''; sent=0; replies=['是','需要手机访问','/pause']; deadline=time.time()+20\nwhile time.time()<deadline:\n if select.select([fd],[],[],0.2)[0]:\n  try: chunk=os.read(fd,65536)\n  except OSError: break\n  if not chunk: break\n  data+=chunk\n  while data.count('你的回答 › '.encode())>sent and sent<len(replies):\n   os.write(fd,(replies[sent]+'\\n').encode()); sent+=1\nelse:\n os.kill(pid,9); raise Exception('PTY timeout')\n_,status=os.waitpid(pid,0)\nprint(json.dumps({'code':os.waitstatus_to_exitcode(status),'sent':sent,'text':data.decode(errors='replace')}))\n`;
  const result = spawnSync('python3', ['-c', script, process.execPath, cli, run, fake], { encoding: 'utf8', timeout: 25000 });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.code, 130, output.text); assert.equal(output.sent, 3);
  const state = await readState(run);
  assert.deepEqual(state.decisions[0].answers, { flow: '即时换算', mobile: '需要手机访问' });
  assert.equal(state.pending.questions[0].id, 'next');
  const resumed = spawnSync(process.execPath, [cli, 'resume', '--run', run, '--json'], { encoding: 'utf8' });
  assert.equal(JSON.parse(resumed.stdout).pending.questions[0].id, 'next');
});
