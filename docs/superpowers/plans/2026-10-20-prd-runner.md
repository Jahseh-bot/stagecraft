# PRD Delivery Runner Implementation Plan

**Goal:** PRD 输入经关键问题与技术方案确认后，自动实现、执行冻结的验收、有限修复，支持人工介入和断点恢复。

**Architecture:** 自包含 runner 包；Codex 非交互 CLI 为首个真实后端；JSON 文件原子持久化；确定性进程执行器验证结果。状态机从 clarify 到 plan、implement、verify、repair、completed；等待输入是独立运行状态，不丢失当前阶段。既有七阶段包不被修改成运行器依赖。

**Tech Stack:** Node.js 原生 ESM、fs、child_process、HTTP fetch、node:test，无新增 npm 运行依赖。

## 实施步骤

- [x] `packages/runner/src/store.mjs`：保存输入快照、运行记录、事件历史；原子写入与单进程锁，失效锁恢复。
- [x] `packages/runner/src/contracts.mjs`：严格验证 Agent 输出、问题与 argv 验收契约；用户确认计划后固定命令、健康检查和测试文件。
- [x] `packages/runner/src/process.mjs`：无 shell argv 执行、日志、超时、AbortSignal 和进程组清理。
- [x] `packages/runner/src/codex.mjs`：结构化输出、读写隔离模式、有限单次调用；保存原始输出，非零退出不能视为成功。
- [x] `packages/runner/src/engine.mjs`：阶段推进、问题等待、答案记录、修复上限、执行中断和恢复；不自动重放生产部署。
- [x] `packages/runner/bin/cli.mjs`：start/status/answer/resume；非交互 JSON 文件答案，机器可读状态与明确退出码。
- [x] `tests/runner.test.mjs`：真实本地命令 + 可控 Agent 替身，验证失败修复、问题等待、预算、恢复、冻结验收与锁；替身不当作模型效果实测。
- [x] `examples/notes/`：小型 PRD 与演练材料；另做真实 Codex 后端运行，记录产物和未完成边界。
- [x] 文档与独立打包验证，所有已通过旧包测试保持通过。

## 验收

初次执行必须提出 PRD 中的关键歧义，答案落盘；生成技术方案及 argv 检查计划，确认后自动执行。测试失败自动触发修复，修复不允许改写冻结测试；预算耗尽产生可回答的介入请求。SIGINT 停止子进程并保存阶段，resume 从阶段边界继续。完成必须同时有成功验收与真实本地启动/HTTP 烟测证据，不能使用 Agent 自报成功。

本版明确不包含生产部署、任意 DAG 编排、付费工具自动开通。控制目录不是恶意 Agent 的安全隔离边界；进程被 SIGKILL 后无法保证自动清理外部副作用，需在恢复时检查遗留工作。
