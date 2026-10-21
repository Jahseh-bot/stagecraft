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

- 文档阶段至少需要读写文件；编码/测试需要命令执行能力；网页验收需要浏览器或等价验证能力；发布需要授权的目标服务和凭据。
- 安装器及交接助手使用 Node.js 22+，技能主体本身是 Markdown。没有 Node 时可复制整个技能目录，并按协议维护 Markdown 交接；不得声称执行过助手校验。
- 各宿主可能需要重新加载技能、信任项目或批准工具。Stagecraft 不绕过宿主的权限机制。
- 自动化验证覆盖七种安装目标、独立 tarball、资源引用、重复安装、冲突/链接保护和交接语义。真实 agent 小型任务评估见维护者评估报告；不宣称跨所有模型的一致成功率。

## 用户示例

> 读取 .agents/skills/stagecraft-test/SKILL.md，测试并修复本次改动；保留现有测试，运行回归，把交接记录写入项目。

> 使用 stagecraft-test 只审计这个项目，不修改业务代码；记录实际失败与复现步骤。
