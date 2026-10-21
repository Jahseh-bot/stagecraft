# Stage Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 当前用户授权由本会话直接实施；本次不委派子代理。

**Goal:** 交付七个可分别打包、安装 Skills 的 npm 包，以及明确能力边界的规划文档。

**Architecture:** npm workspaces 统一维护，每个发布包自包含。共用安装器源码构建时复制；工作流运行于已有 AI 编程工具，不包含模型调用服务。

**Tech Stack:** Node.js 22+、原生 ESM、npm workspaces、Node test runner、Markdown Skills。

---

## Task 1：安装协议

文件：`tooling/installer.mjs`、`tooling/build.mjs`、各包 `bin/cli.mjs` 与 `package.json`。

- [x] 实现 `init --agent codex|claude --dir <project> [--dry-run]`。显式选择宿主；默认目录为当前项目。Codex 使用 `.agents/skills`，Claude 使用 `.claude/skills`。
- [x] 仅创建该阶段命名的技能目录；源目录整体复制；拒绝符号链接路径、未知参数和覆盖不同内容。相同内容重复安装成功且不改写。
- [x] 检查与写入分离，dry-run 不创建目录。用临时兄弟目录复制，再重命名；发生错误清理临时目录。
- [x] 构建程序复制共用安装器进每个包；发布清单包含 bin 与 skills，发布包没有仓库外路径依赖。

安装器算法：解析参数 → 读本包 package.json 获取阶段名 → 计算目标路径 → 检查路径 → 比较文件内容 → dry-run 或同内容直接返回 → 临时目录复制 → 重命名 → 输出安装路径。

## Task 2：独立工作流

文件：`packages/<stage>/skills/stagecraft-<stage>/SKILL.md`、`assets/report.md`；deploy 增加 `references/compose.md`。

- [x] 为 discover、spec、design、architect、build、test、deploy 分别编写触发描述、必要输入、执行路径、完成证据及不能验证时的行为。
- [x] 每个技能仅引用自身资源，不要求任何上游技能。外部输入保持可用，缺失输入只补当前阶段所需信息。
- [x] 每个包放置阶段报告模板，区分事实、假设、证据和未完成项。
- [x] 部署采用 Compose 单机路线，要求明确目标环境和授权；命令退出成功不等同于健康验证通过，不自动执行破坏性数据回滚。

## Task 3：独立 tarball 验证

文件：`tests/packages.test.mjs`。

- [x] 分别执行 npm pack，安装到互相隔离的临时目录，通过其真实 bin 执行安装，确保不存在 workspace 链接依赖。
- [x] 验证两个宿主、dry-run、重复安装、冲突保留、符号链接拒绝、未知参数拒绝。
- [x] 运行 `npm test`；预期所有隔离安装测试通过。另用 skill-creator 的 quick_validate 检查技能结构。

## Task 4：文档与发布边界

文件：README、CONTEXT、docs 下的产品规划、架构、路线与讨论记录。

- [x] 更新已确认方案，区分实现、默认推荐与仍待外部验证的事项。
- [x] 提供本地打包和安装示例。保留 private 标志直到品牌、scope、许可证和发布授权确认。
- [x] 明确本轮不证明 Agent 行为效果、不部署生产系统、不发布 npm。
