# Coding agent 兼容范围

Stagecraft 使用通用 Agent Skills 格式（SKILL.md 与相对引用的资源），执行者是当前 agent。以下是官方目录适配，不表示全部宿主都已实机跑过完整业务链路。

| --agent | 项目技能目录 | 官方资料 |
| --- | --- | --- |
| codex | .agents/skills | [Codex](https://learn.chatgpt.com/docs/build-skills) |
| claude | .claude/skills | [Claude Code](https://code.claude.com/docs/en/skills) |
| cursor | .cursor/skills | [Cursor](https://cursor.com/docs/skills) |
| copilot | .github/skills | [GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills) |
| gemini | .gemini/skills | [Gemini CLI](https://geminicli.com/docs/cli/skills/) |
| opencode | .opencode/skills | [OpenCode](https://opencode.ai/docs/skills/) |
| generic | .agents/skills | [通用格式](https://agentskills.io/specification)；手动读取兜底 |

也可传 `--skills-dir relative/or/absolute/path`，安装器会在该目录下放置 `stagecraft-阶段名/`。此选项与 `--agent` 二选一。安装器只写目标技能目录，不改 AGENTS.md、CLAUDE.md 或全局配置；不同内容冲突会拒绝覆盖，请先备份/迁移自定义修改。

没有原生技能发现功能的 agent：请它读取 `目标技能目录/stagecraft-build/SKILL.md`，按照其中要求执行。Skill 不依赖某一种专用工具名称或 slash 命令。

## 能力与限制

### 原生选择与评审

七阶段遵循[宿主原生用户交互协议](../tooling/skill-shared/user-interaction.md)。澄清、选型、产物/用例评审优先使用宿主实际提供的卡片工具：Codex的request_user_input/异步变体、Claude Code的AskUserQuestion、Gemini/Copilot CLI的ask_user、OpenCode的question；Cursor与其他宿主按当前工具清单发现。名称只是线索，必须以当前schema、模式和用途约束为准，不是跨宿主统一API。

推荐放第一，自定义输入保留；原生已提供自由输入时不重复创建“其他”。没有对应工具、模式不允许或调用失败时明确说明后降级聊天，不要求用户回终端填答案。异步请求已创建、默认选中、自动继续、取消或超时都不算确认。

产物先保存并展示具体版本，再发起该版本评审卡片并结束交付轮；不能在同一交付轮自动进入下一阶段。用户主动在聊天中给出的明确选择/评审同样有效。安装技能不会替宿主新增UI工具；当前覆盖为能力路由与协议适配，未宣称所有宿主已完成实机验证。官方来源及具体适配规则见上面的协议。

- 文档阶段至少需要读写文件；编码/测试需要命令执行能力；网页验收需要浏览器或等价验证能力；发布需要授权的目标服务和凭据。
- 安装器及交接助手使用 Node.js 22+，技能主体本身是 Markdown。没有 Node 时可复制整个技能目录，并按协议维护 Markdown 交接；不得声称执行过助手校验。
- 各宿主可能需要重新加载技能、信任项目或批准工具。Stagecraft 不绕过宿主的权限机制。
- 自动化验证覆盖七种安装目标、独立 tarball、资源引用、重复安装、冲突/链接保护和交接语义。真实 agent 小型任务评估见维护者评估报告；不宣称跨所有模型的一致成功率。

## 用户示例

> 读取 .agents/skills/stagecraft-test/SKILL.md，测试并修复本次改动；保留现有测试，运行回归，把交接记录写入项目。

> 使用 stagecraft-test 只审计这个项目，不修改业务代码；记录实际失败与复现步骤。
