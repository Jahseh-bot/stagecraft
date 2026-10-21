---
title: 准备环境
description: 零基础安装 Node.js、Git 和 coding agent，并创建自己的产品项目。
---

# 准备环境

本教程使用 GitHub 上的最新 Skills。准备 Node.js、Git，以及一个能操作项目文件和运行命令的 coding agent 即可。

## 第一步 打开终端

macOS 按 Command + 空格，搜索“终端”；Windows 打开 PowerShell；Linux 打开终端。下面标为 sh 的内容都在这里执行，一行复制一次，按回车运行。不要复制提示符 `$`、`%` 或 `➜`。

稍后标为 text 的提示词要发给 agent 的聊天输入框。**终端执行命令，agent 对话框讨论产品和回答问题。**

## 第二步 安装并检查 Node.js

从 [Node.js 官网](https://nodejs.org/) 安装满足 **22.20.0 或更高版本**的版本，安装完成后重新打开终端：

```sh
node --version
```

例如 `v22.20.0` 满足要求，`v22.0.0` 不满足本教程所用通用 skills CLI 的要求。再分别检查随 Node.js 安装的工具：

```sh
npm --version
npx --version
```

三条命令都应显示版本。若提示找不到命令，重开终端；仍失败再检查安装路径。版本要求依据 [skills CLI 官方说明](https://github.com/vercel-labs/skills)。

## 第三步 安装并检查 Git

从 [Git 官网](https://git-scm.com/downloads) 安装适合系统的版本，重开终端后运行：

```sh
git --version
```

看到 `git version ...` 即可。Git 用来获取技能来源。安装公开 Stagecraft Skills 不需要登录 GitHub，也不需要手动克隆整个 Stagecraft 仓库；以后把自己的产品推送到 GitHub 时，才需要相应账号和仓库权限。

## 第四步 准备 coding agent

打开已有的 Codex、Claude Code、Cursor、Copilot、Gemini CLI 或 OpenCode，完成该工具自身的登录。它需要能读取与编辑目标项目，并按任务运行测试和构建。

无需为 Stagecraft 另装 Codex CLI。只有聊天、不能操作文件的工具无法独立完成编码和验证。宿主没有自动发现 Skills 时，可以明确让它读取安装目录的 `SKILL.md`。

## 第五步 创建你的产品文件夹

在桌面或你习惯的位置创建 `my-app` 文件夹。它用于存放你的产品，和 Stagecraft 源码仓库是两个概念。用 coding agent 的“打开文件夹/项目”功能打开它，再在终端进入同一个文件夹：

```sh
cd "/替换为你的项目完整路径/my-app"
```

路径需要改成你电脑上的实际位置，不要原样复制占位符。Windows 可以使用 `cd "C:\Users\你的用户名\Desktop\my-app"`。路径含空格时保留双引号。

完成后继续[安装技能](./packages)或[开始第一个任务](./first-run)。首次安装需要能访问 npm 和 GitHub。
