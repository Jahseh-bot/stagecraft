---
title: 阶段包与技能安装
description: 当前可用的 GitHub 安装方式、七阶段选择、宿主发现与 npm 版本区别。
---

# 阶段包与技能安装

## 推荐：安装当前 GitHub 版本

先完成[环境准备](./preparation)，在你自己的产品目录执行：

```sh
npx skills add Jahseh-bot/stagecraft
```

1. npm 若询问是否下载 skills 工具，确认后等待下载。
2. 安装界面列出 Skills 时，完整产品流程请选择下面的七个 `stagecraft-*` 入口。测试用例子技能已经包含在 test 中，不必另选。
3. 选择实际使用的 coding agent；若询问安装范围，新手选当前项目。
4. 按界面提示完成安装，记下输出的技能目录。
5. 回到 agent 打开同一个项目，重新加载 Skills 或新建项目会话。

安装完成只表示技能文件已就位，**还没有开始写产品**。下一步需要发送[任务提示词](./first-run#prd-to-deploy)。

## 七个入口的分工

| Skill | 工作与主要成果 |
| --- | --- |
| stagecraft-discover | 判断用户问题与产品机会，比较 MVP 和验证方向 |
| stagecraft-spec | 形成 PRD、业务规则、术语与验收标准 |
| stagecraft-design | 产品流程、页面状态、视觉方案与实际预览 |
| stagecraft-architect | 技术方案、数据与接口契约、实施顺序 |
| stagecraft-build | 实现、自测、修复与可运行交付 |
| stagecraft-test | 先设计与评审用例，再执行、记录缺陷和回归 |
| stagecraft-deploy | 发布前评审、实际部署、访问验证和回滚交接 |

完整流程推荐一次装齐七个入口，agent 根据已有成果选择从哪里开始，不会强制重复所有阶段。单点任务也可以只装需要的阶段。

## 已知道技能与 agent 时

只安装测试入口：

```sh
npx skills add Jahseh-bot/stagecraft --skill stagecraft-test
```

为 Codex 安装全部七个入口：

```sh
npx skills add Jahseh-bot/stagecraft --skill stagecraft-discover stagecraft-spec stagecraft-design stagecraft-architect stagecraft-build stagecraft-test stagecraft-deploy --agent codex
```

通用 CLI 中 Claude Code 使用 `--agent claude-code`，Cursor 使用 `--agent cursor`。不确定宿主标识就用第一条交互式命令选择。其他选项以 [skills CLI 官方说明](https://github.com/vercel-labs/skills)及安装输出为准。

## 确认 agent 能读取

在 agent 对话框发送：

```text
请检查当前项目可用的 Stagecraft Skills。
列出已找到的七个阶段入口及实际路径，读取各入口说明。
本次只检查安装，不开始开发；缺少哪个入口请明确告诉我。
```

Codex 的常见项目路径是 `.agents/skills/stagecraft-build/SKILL.md`。其他宿主以安装器输出为准，不要盲目复制 Codex 的目录。宿主支持的目录适配不等于所有模型和环境都经过完整实机验证。

## npm 安装：固定到 0.5.0

2026-10-22，全部八个 `@gaaraa/*@0.5.0` 已发布。想固定方法版本，可以使用七个阶段包的安装器。以下命令在你的产品项目目录执行，示例使用 Codex；替换为自己的宿主即可。

```sh
npx --yes @gaaraa/discover@0.5.0 init --agent codex --dir .
npx --yes @gaaraa/spec@0.5.0 init --agent codex --dir .
npx --yes @gaaraa/design@0.5.0 init --agent codex --dir .
npx --yes @gaaraa/architect@0.5.0 init --agent codex --dir .
npx --yes @gaaraa/build@0.5.0 init --agent codex --dir .
npx --yes @gaaraa/test@0.5.0 init --agent codex --dir .
npx --yes @gaaraa/deploy@0.5.0 init --agent codex --dir .
```

这里的 `.` 表示当前目录，先确认终端已经进入你的产品文件夹。七条命令分别安装对应阶段，不会自动开始产品开发。已有相同技能时无需重复安装；发生不同内容冲突，先备份原技能与自定义修改，再把旧目录移出宿主扫描位置后重新安装。

| npm 安装器的 --agent | 项目内技能目录 |
| --- | --- |
| codex / generic | .agents/skills |
| claude | .claude/skills |
| cursor | .cursor/skills |
| copilot | .github/skills |
| gemini | .gemini/skills |
| opencode | .opencode/skills |

注意：npm 阶段安装器用 `--agent claude`，通用 skills CLI 用 `--agent claude-code`，两种工具的参数不同。npm 安装器支持 `--dry-run` 预览，或用 `--skills-dir` 指定自定义目录（与 `--agent` 二选一）。GitHub 与 npm 安装方式选一种即可。

只运行 `npm install @gaaraa/build` 会下载包到 node_modules，不等于宿主已经发现技能。新项目无需安装兼容用的 `@gaaraa/runner`。安装后重新加载 agent，发送[完整提示词](./first-run#prd-to-deploy)。更新方法见[版本与迁移](./upgrading)。
