---
title: 故障排查与平台说明
description: Stagecraft Skills-first 零基础教程：故障排查与平台说明。
---

# 故障排查与平台说明

> 版本说明：下方 npm 0.4.1 命令仅在该版本发布后可用。当前新版 Skills 请通过 `npx skills add Jahseh-bot/stagecraft` 安装；已有安装运行 `npx skills update` 后重新加载。npm 已发布版本仍为 0.4.0，不含本页新版交互规则。


## 常见问题与下一步

| 现象 | 处理 |
| --- | --- |
| 找不到 node | 安装 Node.js 22+，重新打开终端 |
| 找不到 Skill | 检查 --agent 与宿主一致；重载项目；让 agent 直接读取安装后的 SKILL.md |
| npm 下载 0.4.1 返回 404 | 检查包名及版本；若使用镜像源，命令改为 `npx --yes --registry=https://registry.npmjs.org @gaaraa/build@0.4.1 init --agent codex --dir "目标项目路径"` 后重试 |
| 安装提示不同内容 | 原有技能可能被修改；先备份和对比，不强制覆盖 |
| 提示符后输入“是”报错 | 系统终端不是 agent 对话框。新版在 agent 会话直接回答 |
| workflow locked | 检查占用者与进程是否仍运行；不要自动删除活跃锁 |
| 验证工具不可用 | 补充环境或权限；agent 保留 blocked/partial，不能声称通过 |
| 下一 Skill 没安装 | 安装该阶段并读取已有交接，不需重做已完成工作 |

## Windows、macOS 和 Linux

技能主体是通用 Markdown。安装器和助手使用 Node.js 路径 API；终端命令中的项目路径要换成你的系统路径。自动化和真实小任务验证的执行主机是 macOS，不能据此宣称所有操作系统、宿主和工具链都实机验证。

宿主权限和信任提示由宿主控制。Stagecraft 不绕过这些提示，也不提供模型账号、云服务器或数据库凭据。
