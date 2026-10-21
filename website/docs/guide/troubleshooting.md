---
title: 故障排查与平台说明
description: Stagecraft Skills-first 零基础教程：故障排查与平台说明。
---

# 故障排查与平台说明

## 常见问题与下一步

| 现象 | 处理 |
| --- | --- |
| 找不到 node | 安装 Node.js 22.20.0 或更高版本，重新打开终端 |
| Git 不存在或安装无法获取来源 | 运行 `git --version` 检查 Git；确认能访问 npm 和 GitHub，安装后重开终端 |
| 找不到 Skill | 检查 --agent 与宿主一致；重载项目；让 agent 直接读取安装后的 SKILL.md |
| npm 下载 0.4.1 返回 404 | 本版已发布；核对包名，运行 `npm view @gaaraa/build@0.4.1 version --registry=https://registry.npmjs.org`。镜像可能尚未同步，可在 npx 命令加 `--registry=https://registry.npmjs.org`；刚发布仍有传播延迟时稍后重试 |
| 安装提示不同内容 | 原有技能可能被修改；先备份和对比，不强制覆盖 |
| 提示符后输入“是”报错 | 系统终端不是 agent 对话框。新版在 agent 会话直接回答 |
| workflow locked | 检查占用者与进程是否仍运行；不要自动删除活跃锁 |
| 验证工具不可用 | 补充环境或权限；agent 保留 blocked/partial，不能声称通过 |
| 产品目录运行 update-skills 提示 Missing script | 这是 Stagecraft 源码仓库维护命令；普通用户运行 `npx skills update` |
| 安装更新了但仍用旧规则 | 检查项目与全局是否各有一份旧技能；重新加载，让 agent 报告实际读取的路径 |
| 推送完成但地址打不开 | 检查部署流水线和本次运行版本；让 deploy 阶段继续验证，不把 Git 推送当上线完成 |
| 下一 Skill 没安装 | 安装该阶段并读取已有交接，不需重做已完成工作 |

## Windows、macOS 和 Linux

技能主体是通用 Markdown。安装器和助手使用 Node.js 路径 API；终端命令中的项目路径要换成你的系统路径。自动化和真实小任务验证的执行主机是 macOS，不能据此宣称所有操作系统、宿主和工具链都实机验证。

宿主权限和信任提示由宿主控制。Stagecraft 不绕过这些提示，也不提供模型账号、云服务器或数据库凭据。
