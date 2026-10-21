---
title: 故障排查与平台说明
description: Stagecraft 0.3.0 零基础教程：故障排查与平台说明，包含操作步骤、预期结果与注意事项。
---

# 故障排查与平台说明

## 常见问题与下一步

| 看到的现象 | 下一步操作 |
| --- | --- |
| `command not found: node` 或 `npx` | 完成 Node.js 安装，重新打开终端，再检查版本 |
| `codex` 找不到或 `spawn codex ENOENT` | 确认同一个终端中 `codex --version` 能成功；按安装器提示处理命令路径 |
| Codex 登录失败或额度不足 | 单独运行 `codex` 检查登录和账号；解决后回答当前的恢复问题 |
| npm 显示 `E404` | 核对包名是 `@gaaraa/runner@0.3.0`；执行 `npm config get registry` 检查下载源。如使用镜像，可在 npx 命令中加 `--registry=https://registry.npmjs.org` 重试 |
| 下载超时或网络错误 | 确认电脑能访问 npm 和 Codex 服务，再重试对应步骤 |
| `ENOENT`，提示找不到 `PRD.md` | 执行 `pwd` 查看当前目录，回到练习文件夹，再执行 `cat PRD.md` |
| `PRD is empty` | 需求文件为空，重新写入需求并保存 |
| `waiting_input`，终端出现红色退出标记 | 查看问题并创建答案文件，这是等待回答的正常状态 |
| `Provide exactly these nonempty string answers` | 按当前问题 id 重写答案；每个都要回答，不要多加字段或留空 |
| JSON 解析失败 | 使用英文双引号，删除最后一项后的逗号，确认文件是纯文本 |
| `Run is not waiting for input` | 先运行 `status`；不要向已完成或未等待回答的任务重复提交答案 |
| `RUN_DIR` 为空或路径不对 | 当前窗口重新设置路径；不要使用文档中的示例用户名或任务编号 |
| 网页无法连接 | 默认验收后服务已关闭，按交付说明启动应用，并检查实际端口 |
| 端口已占用 | 停止自己先前启动的同一应用，或让部署方案改用空闲端口 |
| Docker 无法连接 | 打开 Docker Desktop，等启动完成，用 `docker info` 检查 |
| `No reviewed skills mapping` | 当前技术栈没有对应方法映射；不要随便改已有项目技术栈，先请维护者协助 |
| 修复次数用完或任务持续失败 | 保留日志和运行目录，提供错误内容及最后执行的命令请人协助 |

寻求帮助时，可以提供：系统版本、`node --version`、Stagecraft 版本、执行的命令、当前 `status` 和错误末尾的文字。日志可能包含需求与项目内容，分享前检查；不要发送密码、Token 或密钥。

## Windows 和 Linux 用户

上面的完整实践流程已在 macOS 环境验证。Windows 与 Linux 上的安装、路径和进程行为需单独验证，不能把这份 Mac 跟做记录当作跨平台验收结果。

Windows 用户可先查看 [Codex 官方说明](https://developers.openai.com/codex/cli/) 中的 Windows 安装入口；如果使用 WSL，请将 Node.js、Codex 和项目文件都放在同一个 WSL 环境中操作。本文的 `cat <<...`、`$HOME` 和 `RUN_DIR=...` 示例面向类 Unix 终端，不能直接当作 PowerShell 命令。需要部署时参考 [Docker Desktop Windows 安装说明](https://docs.docker.com/desktop/setup/install/windows-install/)。

Linux 用户先按 [Node.js 官方下载页](https://nodejs.org/en/download) 和 Codex 官方指南完成环境准备，再在终端中确认三个工具可用。部署还需要可用的 Docker Engine 和 Compose。
