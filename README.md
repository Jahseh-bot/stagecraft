# Stagecraft

Stagecraft 为产品开发各阶段筛选并组合成熟方法，让用户不再纠结底层 Skills 的选择。七个阶段入口负责创意、需求、产品与视觉设计、架构、开发、测试和部署；关键产品方向由用户选择，方法编排、执行、验证与交接由当前 coding agent 完成。

**0.5.0 Skills-first 正在发布到 npm，八个包版本一致；也可从本仓库安装。** 0.3.0 是已发布的旧 runner 版本；0.3.1 发布中断，仅 architect 已上传，不作为完整推荐版本。

- [零基础使用指南](docs/npm-usage.md)
- [Agent 兼容与安装路径](docs/agent-compatibility.md)
- [交接协议与架构](docs/architecture.md)
- [官网](https://jahseh-bot.github.io/stagecraft/)
- [旧 runner 恢复说明](docs/legacy-runner.md)

## 从一个阶段开始

直接通过 npm 安装（需要 Node.js 22+，无需克隆源码或登录 npm）：

```sh
npx --yes @gaaraa/build@0.5.0 init --agent codex --dir /absolute/path/to/my-project
```

在目标项目的 coding agent 会话中输入：

> 使用 Stagecraft，先用 stagecraft-spec 评审 PRD.md，再逐阶段推进设计、架构、开发、测试和部署。每个阶段先给方案，第一项为推荐并说明理由，允许自由补充。每次展示本阶段成果后必须结束本轮，等我后续回复通过具体版本后才讨论下一阶段；有修改就留在本阶段修订、重新展示并等待。

`--agent` 可换成 `claude`、`cursor`、`copilot`、`gemini`、`opencode` 或 `generic`。不支持原生 Skills 的 agent，可让它直接读取安装目录中的 `SKILL.md`。无需安装 Codex CLI；由当前 agent 执行任务。

## 通过通用 skills CLI 安装

在目标项目目录执行（需要 Node.js 22.20+ 和 Git）：

```sh
npx skills add Jahseh-bot/stagecraft
```

按提示选择技能与 agent；安装全部七个到 Codex 可加 `--skill '*' --agent codex`。根目录 `skills/` 和 release 输出中的 `skills/` 都是完整可安装目录，由 `npm run build` 从阶段包自动同步。详见 [skills CLI 官方说明](https://github.com/vercel-labs/skills)。

## 七个阶段

| Skill | 独立闭环 |
| --- | --- |
| stagecraft-discover | 调查证据、挑战假设、验证实验设计、形成决策 |
| stagecraft-spec | 补足关键规则、消除矛盾、形成可验证 AC 规格 |
| stagecraft-design | 流程与界面设计、状态/响应式检查、修正并交付 |
| stagecraft-architect | 约束与模块设计、关键技术验证、实现与验收映射 |
| stagecraft-build | 实现、真实自测、诊断修复、可运行交付 |
| stagecraft-test | 风险测试、缺陷复现、授权修复与回归；支持只审计 |
| stagecraft-deploy | 授权目标配置、实际发布、健康/版本验证与回滚 |

可从任意阶段切入，不强制准备上游 Stagecraft 报告。若用户明确要求“从 PRD 做到测试通过”，agent 会在已安装技能间继续，沿用同一交接记录。仅要求设计时不会擅自实现或部署。

## 交接与人工介入

同一项目的交接放在 `.stagecraft/workflows/<id>/`，记录目标、入口/终点、决定、AC、成果路径、真实验证证据与下一步。可选助手校验文件及哈希，发现产物变化会使相关结果失效，避免把旧测试当成本次结果。

产品范围、功能模块、核心流程、视觉风格、技术选型和部署方式先讨论方案，选项 1 为最推荐并说明理由，列出其他选项，最后允许自由输入补充，等待用户选择；已确认边界内的实现细节、测试和修复自动完成。真实环境不足时准确记录阻塞，不承诺任何 agent 在没有执行能力时也能完成验证。

## 维护与验证

```sh
npm test
npm run release
npm run release:publish -- --dry-run
```

七阶段包自带协议、模板、脚本和固定版本上游方法及许可证；安装器不调用模型，不修改其他宿主配置。`runner` 及 build/test/deploy 的旧执行入口仅为已有用户保留，详见兼容文档。

## 方法如何真正生效

每个阶段先读取随包的 `references/methods.md`，按触发条件应用 grilling、grill-with-docs/domain-modeling、frontend-design、codebase-design、tdd、webapp-testing、diagnosing-bugs 等方法及适配技术栈的专项实践。报告必须记录具体产物与证据，不能只列方法名称。用户选择产品方案，不必选择底层 Skill。

[方法编排与来源说明](https://jahseh-bot.github.io/stagecraft/guide/methods.html)

> 版本说明：npm 0.5.0 发布进行中，固定版本命令需待注册表发布完成后使用。也可以运行 `npx skills add Jahseh-bot/stagecraft` 安装 GitHub 当前版本；通用 CLI 的已有安装用 `npx skills update` 更新后重新加载。

每个阶段将成果存入项目并展示给用户评审，确认具体版本后再交接；修改保留快照、意见和下游影响。详见 [产物评审与追溯](https://jahseh-bot.github.io/stagecraft/guide/artifact-reviews.html)。

各阶段附详细工作指引与覆盖矩阵，按项目规模和风险裁剪。三方方法保持只读；运行 `npm run build && npm run audit:skills` 检查入口、引用、来源和原始内容完整性。

仓库维护者可运行 `npm run update-skills` 同步现有三方方法的上游最新提交，或 `npm run upgrade-skills` 搜索并替换合格候选。支持 `--dry-run`、`--only` 和按记录恢复；正式应用要求干净工作区，失败回退，命令不自动提交或发布。见 [维护教程](https://jahseh-bot.github.io/stagecraft/guide/skill-maintenance.html)。

## 全链路变更联动（0.5.0）

任何阶段变更都建立CR并沿需求、设计、架构、代码、测试、文档和发布资料的关联双向分析；agent逐项同步真实产物、验证和评审后关闭CR。新增trace/change/change-close助手支持图与变更记录、反向失效及关闭校验，启用后采用v3工作流以阻止旧助手忽略新增约束。普通v1/v2可继续读取。npm 0.5.0包含该改进，已安装技能需要按升级教程更新。详见[共享联动协议](tooling/skill-shared/change-control.md)。
