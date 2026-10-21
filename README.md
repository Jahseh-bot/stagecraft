# Stagecraft

在你正在使用的 coding agent 里完成产品开发。七个独立 Skill 分别负责创意判断、需求规格、界面设计、架构、开发、测试和部署；每个阶段都包含检查、执行、验证、修复和交接。

**0.4.0 为 Skills-first 重构版本，当前源码可用，npm 发布需以 registry 实际可下载为准。** 0.3.0 是已发布的旧 runner 版本；0.3.1 发布中断，仅 architect 已上传，不作为完整推荐版本。

- [零基础使用指南](docs/npm-usage.md)
- [Agent 兼容与安装路径](docs/agent-compatibility.md)
- [交接协议与架构](docs/architecture.md)
- [官网](https://jahseh-bot.github.io/stagecraft/)
- [旧 runner 恢复说明](docs/legacy-runner.md)

## 从一个阶段开始

当前源码使用方式（Node.js 22+ 仅用于安装与可选交接助手）：

```sh
git clone git@github.com:Jahseh-bot/stagecraft.git
cd stagecraft
npm run build
node packages/build/bin/cli.mjs init --agent codex --dir /absolute/path/to/my-project
```

在目标项目的 coding agent 会话中输入：

> 使用 stagecraft-build，把 PRD.md 实现成可运行的应用。自行完成常规技术选择、测试和修复，只在关键业务歧义或权限阻塞时询问我。

`--agent` 可换成 `claude`、`cursor`、`copilot`、`gemini`、`opencode` 或 `generic`。不支持原生 Skills 的 agent，可让它直接读取安装目录中的 `SKILL.md`。无需安装 Codex CLI；由当前 agent 执行任务。

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

同一项目的交接放在 `.stagecraft/workflows/<id>/`，记录目标、入口/终点、决定、AC、成果路径、真实验证证据与下一步。可选助手校验文件及哈希，发现上游变化会使相关下游结果失效，避免把旧测试当成本次结果。

常规可逆选择自主完成；业务关键歧义、权限、凭据、不可逆或超出授权的动作才询问用户。真实环境不足时准确记录阻塞，不承诺任何 agent 在没有执行能力时也能完成验证。

## 维护与验证

```sh
npm test
npm run release
npm run release:publish -- --dry-run
```

七阶段包自带协议、模板、脚本和固定版本上游方法及许可证；安装器不调用模型，不修改其他宿主配置。`runner` 及 build/test/deploy 的旧执行入口仅为已有用户保留，详见兼容文档。
