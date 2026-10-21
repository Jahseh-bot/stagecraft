---
title: 准备环境
description: Stagecraft 0.3.0 零基础教程：准备环境，包含操作步骤、预期结果与注意事项。
---

# 准备环境

本节沿用原指南的步骤编号。提到“文末”的排错与系统说明时，请前往[故障排查与平台说明](/guide/troubleshooting)。

## 第一步 打开终端

1. 按键盘上的 `Command + 空格` 打开系统搜索。
2. 输入“终端”或 `Terminal`，按回车。
3. 你会看到带有光标的窗口，左侧可能有用户名、文件夹名和 `%` 或 `$`。

后面的命令都粘贴到这个窗口里执行。**不要复制代码框外的说明、行首提示符或 Markdown 的三个反引号。** 单行命令粘贴后按回车；多行代码块要完整复制。看到原来的命令提示符重新出现，通常表示这条命令已结束，接着看是否有报错。

## 第二步 安装并检查 Node.js

先输入下面一行并回车：

```sh
node --version
```

如果输出 `v22.x.x`、`v24.x.x` 或更高版本，说明版本满足要求；这里的 `x` 代表不同的小版本数字，不需要完全相同。然后直接检查 npm 和 npx。

如果显示 `command not found: node`，或者版本小于 22：

1. 打开 [Node.js 官方下载页](https://nodejs.org/en/download)。
2. 选择 **LTS** 版本，确认主版本不低于 22；选择 macOS 安装包（`.pkg`）。
3. 双击下载的安装包，按向导完成安装。
4. 关闭终端，再重新打开，重新执行 `node --version`。

接着分别执行下面两行：

```sh
npm --version
npx --version
```

两条命令都应显示版本数字。如果某一条找不到，先重新打开终端；仍失败时检查 Node.js 是否安装完成。不要跳过这一步继续运行 Stagecraft。

## 第三步 安装并登录 Codex

先检查是否已有命令：

```sh
codex --version
```

如果显示版本号，跳过安装，直接进行登录检查。如果显示找不到命令，可使用官方 macOS 安装命令：

```sh
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

安装完成后按安装器提示操作，重新打开终端，再运行 `codex --version`。安装入口和登录方式见 [Codex CLI 官方指南](https://developers.openai.com/codex/cli/)。

接下来准备一个专门的练习文件夹，避免把项目散落在其他目录：

```sh
mkdir -p "$HOME/stagecraft-practice"
cd "$HOME/stagecraft-practice"
```

然后启动 Codex：

```sh
codex
```

首次运行时，按提示选择 **Sign in with ChatGPT**，在浏览器中完成登录，然后回到终端。如果已登录，不一定再次出现登录界面。若出现目录信任提示，确认显示的是你刚创建的 `stagecraft-practice` 文件夹。

在 Codex 输入框里输入下面这句话并回车：

```text
请只回复“连接成功”，不要创建或修改任何文件。
```

收到正常回复，说明模型连接可用。如果提示登录失败、没有访问权限或额度不足，先解决对应账号问题，再继续。完成后按 `Ctrl + C` 退出；若出现再次按键退出的提示，再按一次，直到回到普通终端提示符。

## 第四步 检查 Stagecraft 能否下载运行

在普通终端中执行：

```sh
npx --yes @gaaraa/runner@0.3.0 --version
```

第一次会从 npm 下载软件，速度取决于网络。成功时会输出：

```text
0.3.0
```

`--yes` 表示同意 npx 下载这个包；它不会替你批准后面的开发或部署方案。`@0.3.0` 表示固定使用这一个版本，方便后续恢复任务。

如果下载报错，先看文末的排错表，不要反复新建开发任务。
