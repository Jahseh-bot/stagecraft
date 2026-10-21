---
title: 部署与发布验证
description: Stagecraft Skills-first 零基础教程：部署与发布验证。
---

# 部署与发布验证

已有 PRD、希望一次完成开发到部署？直接使用[从 PRD 自动衔接的完整提示词](https://jahseh-bot.github.io/stagecraft/guide/first-run.html#prd-to-deploy)，其中包含技能准备、部署目标示例和中断恢复方法。

## 向 agent 说明目标

安装 deploy 技能后，明确目标、权限和你希望公开的内容。例如：

```text
使用 stagecraft-deploy，把这个静态网站部署到我已授权的 GitHub Pages 仓库。
配置后续更新自动发布，等待流水线完成，验证公网地址和关键页面，再给我链接。
```

也可以指定已有服务器、本机服务或其他平台。Skill 按当前 agent 的工具和目标配置执行，不强制 Docker，也不会自动购买资源。

## 完整发布闭环

部署前检查实际版本、测试结果、构建和配置；部署后核对实际运行的修订版本、地址、健康与关键路径。推送成功或旧实例仍健康都不代表本次上线成功。

失败时诊断并在授权范围内修复，必要时按已授权计划回滚并验证。凭据、账单、DNS等必须由你处理的阻塞，会留下具体状态和恢复步骤。不能访问生产环境时不会伪造已发布结论。

旧 runner 的 deploy 命令仍只支持本机 Docker Compose；本页描述的是在当前 agent 中执行的新版 deploy Skill。
