---
title: 阶段包与技能安装
description: Stagecraft Skills-first 零基础教程：阶段包与技能安装。
---

# 阶段包与技能安装

## 七个包各司其职

| npm 包 | Skill | 用途 |
| --- | --- | --- |
| @gaaraa/discover | stagecraft-discover | 创意、证据和验证实验 |
| @gaaraa/spec | stagecraft-spec | 需求与可验证规格 |
| @gaaraa/design | stagecraft-design | 体验、界面和交互 |
| @gaaraa/architect | stagecraft-architect | 架构与技术可行性 |
| @gaaraa/build | stagecraft-build | 实现、自测和修复 |
| @gaaraa/test | stagecraft-test | 测试、审计或授权修复 |
| @gaaraa/deploy | stagecraft-deploy | 发布、验证和回滚 |

只装你需要的阶段即可；多阶段连续交付需安装目标范围里的技能。以下每一行是独立安装命令，把路径替换为你的项目完整路径，把 `codex` 替换为下表对应的 agent：

```sh
npx --yes @gaaraa/discover@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/spec@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/design@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/architect@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/build@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/test@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/deploy@0.4.0 init --agent codex --dir "/目标项目路径"
```

这些命令通过 npm 下载包，并把技能文件复制到项目的宿主技能目录。仅执行 `npm install @gaaraa/build` 会把包放入 node_modules，不等于完成技能安装；新手建议直接使用上面的 npx 命令。`@gaaraa/runner@0.4.0` 供旧任务恢复使用，直接使用 Skills 不需要安装 runner。

## 使用通用 skills CLI 安装整套技能

也可以通过 [skills CLI](https://github.com/vercel-labs/skills) 直接从 GitHub 安装。此方式需要 Node.js 22.20 或以上版本及 Git。先在终端进入你的目标项目：

```sh
cd "/目标项目路径"
npx skills add Jahseh-bot/stagecraft
```

按界面提示选择技能和 coding agent。只安装开发、测试两个技能到 Codex，可执行：

```sh
npx skills add Jahseh-bot/stagecraft --skill stagecraft-build stagecraft-test --agent codex
```

安装全部七个技能到 Codex：

```sh
npx skills add Jahseh-bot/stagecraft --skill '*' --agent codex
```

正确顺序是 `npx skills add`。通用 CLI 的 agent 名称由它自己定义，例如 Claude Code 使用 `--agent claude-code`，与上方 Stagecraft 安装器的 `--agent claude` 不同。两种安装方式选一种即可；通用 CLI 使用 GitHub 当前版本，固定 npm 0.4.0 则使用上方各阶段命令。

仓库根目录和 release 产物最外层的 `skills/` 都包含七个完整技能，以及各自的引用资料、报告模板、脚本和许可证。源码仍维护在 `packages/<阶段>/skills/`，通过 `npm run build` 自动同步根目录，避免手工维护两份。

## 宿主目录

| --agent | 项目内目录 |
| --- | --- |
| codex / generic | .agents/skills |
| claude | .claude/skills |
| cursor | .cursor/skills |
| copilot | .github/skills |
| gemini | .gemini/skills |
| opencode | .opencode/skills |

其他宿主可用 `--skills-dir "自定义技能目录"`，它与 `--agent` 二选一。通用兜底是让 agent 直接读取 SKILL.md。目录适配经过自动化安装测试，不表示所有宿主和模型都已实机跑过完整任务。

## 预览与冲突

命令末尾加 `--dry-run` 只预览，不写文件。重复安装相同内容安全；发现已有不同内容会拒绝覆盖，先备份自定义修改再决定替换。安装器不会修改你的 AGENTS.md、CLAUDE.md 或全局 agent 配置。
