---
title: 准备环境
description: Stagecraft Skills-first 零基础教程：准备环境。
---

# 准备环境

## 第一步 打开终端

macOS 按 Command + 空格，搜索“终端”并打开；Windows 使用 PowerShell；Linux 打开终端。命令应整行复制，不要把提示符 `$`、`%` 或 `➜` 一起复制。

## 第二步 安装并检查 Node.js

从 [Node.js 官方网站](https://nodejs.org/) 安装 22 或以上版本。安装结束后重新打开终端，执行：

```sh
node --version
```

看到 `v22` 或更高的大版本即可。Node.js 用于安装器和可选交接助手；Skill 主体是 Markdown，不要求使用某个特定模型。

## 第三步 准备 coding agent

打开你已有的 Codex、Claude Code、Cursor、Copilot、Gemini CLI 或 OpenCode，并完成它自身的登录。给 agent 打开目标项目文件夹，让它能按任务需要读写文件、运行命令。

无需为了使用 Stagecraft 单独安装 Codex CLI。其他 agent 没有原生 Skills 功能时，可让它直接读取 SKILL.md；只有纯聊天能力、不能操作文件和验证结果的工具不能完成编码闭环。

## 第四步 获取当前源码

先检查 Git：

```sh
git --version
```

然后执行：

```sh
git clone https://github.com/Jahseh-bot/stagecraft.git
cd stagecraft
npm run build
```

`git clone` 下载源码，`cd` 进入源码目录，`npm run build` 生成各阶段的独立安装器和完整资源。后续安装命令在这个 stagecraft 目录执行。
