---
title: 开始第一个任务
description: Stagecraft Skills-first 零基础教程：开始第一个任务。
---

# 开始第一个任务

## 安装需要的技能

先在电脑上创建一个空文件夹作为目标项目，例如桌面的 `my-app`。复制它的完整路径，将以下命令中的路径替换掉。路径有空格时保留双引号。

在 stagecraft 源码目录执行：

```sh
node packages/build/bin/cli.mjs init --agent codex --dir "/你的项目完整路径/my-app"
node packages/test/bin/cli.mjs init --agent codex --dir "/你的项目完整路径/my-app"
```

使用 Claude Code 将 `codex` 换成 `claude`，Cursor 换成 `cursor`，其他选项见“阶段包与技能安装”。看到“已安装”表示技能文件已放到目标项目。

## 在 agent 中开始工作

在 coding agent 中打开 `my-app`，重新加载技能或重开这个项目会话，然后输入：

```text
使用 stagecraft-build 和 stagecraft-test，按照 PRD.md 做出可运行的温度换算网页并测试。
常规可逆技术选择自行决定，执行测试并修复，不要让我手写 JSON。
把阶段交接记录保存在项目中，完成后告诉我怎样启动和打开网页。
```

如果宿主没有发现技能，明确让它读取安装输出中的 `stagecraft-build/SKILL.md`，并按文件指示工作。不要在系统终端里输入这段自然语言，它是发给 coding agent 的消息。
