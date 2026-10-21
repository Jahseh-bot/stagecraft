---
title: 什么是 Stagecraft
description: Stagecraft Skills-first 零基础教程：什么是 Stagecraft。
---

# 什么是 Stagecraft

Stagecraft 是一组直接在 coding agent 中使用的阶段技能。你可以把它理解为给 AI 编程助手装上七套完整工作方法：创意、需求、设计、架构、开发、测试、部署。

每个技能都会检查输入、完成本职工作、实际验证、在授权范围内修复，再留下可继续使用的交接记录。你不需要操作 runner，也不需要手写答案 JSON。

## 先了解你将完成什么

第一次可以做一个温度换算网页。安装 build 和 test 技能后，在你正在使用的 agent 中描述需求，要求它实现并测试。常规技术细节由 agent 处理；只有关键业务歧义、权限或环境阻塞才会问你。

0.4.0 是已发布到 npm 的 Skills-first 版本，下面使用 npm 自带的 npx 直接安装技能，无需下载 Stagecraft 源码。0.3.0 为旧版 runner；0.3.1 曾部分发布，仅 architect 已上传，不要将它作为完整新版安装。

安装技能不会自动调用模型，也不会替你购买或配置模型账号。执行时使用当前 coding agent 的账号、额度、工具和权限。
