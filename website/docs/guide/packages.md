---
title: 阶段包与技能安装
description: Stagecraft Skills-first 零基础教程：阶段包与技能安装。
---

# 阶段包与技能安装

## 七个包各司其职

| 包目录 | Skill | 用途 |
| --- | --- | --- |
| discover | stagecraft-discover | 创意、证据和验证实验 |
| spec | stagecraft-spec | 需求与可验证规格 |
| design | stagecraft-design | 体验、界面和交互 |
| architect | stagecraft-architect | 架构与技术可行性 |
| build | stagecraft-build | 实现、自测和修复 |
| test | stagecraft-test | 测试、审计或授权修复 |
| deploy | stagecraft-deploy | 发布、验证和回滚 |

源码安装统一使用 `node packages/包目录/bin/cli.mjs init --agent 宿主 --dir "目标项目路径"`。只装你需要的阶段即可；多阶段连续交付需安装目标范围里的技能。

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
