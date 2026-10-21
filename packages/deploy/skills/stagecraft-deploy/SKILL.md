---
name: stagecraft-deploy
description: Prepare and execute an authorized single-host Docker Compose deployment, verify health, and produce release and recovery records.
---

# 部署与发布验证

容器部署前先阅读随包固定版本的社区 [docker-expert](references/upstream/docker-expert/SKILL.md)，用于 Dockerfile、构建上下文、健康检查与 Compose 配置审查。按现有项目和当前 Compose CLI 调整示例；上游的云发布、镜像推送和破坏性清理示例不构成本次授权。来源与 MIT 许可见 `references/upstream/sources.json` 和对应目录许可证。

## 接入与独立性

不要求安装或先执行其他 Stagecraft 包。接受用户已有文档、仓库或产品；只补当前任务必需的信息。保留已有权威来源，区分事实、假设和待确认事项。遵守目标项目的说明和用户授权范围。

## 成果记录

用 [报告模板](assets/report.md) 记录结果，建议保存到 `.stagecraft/runs/<stage>-<unique-id>/report.md`；用户指定位置优先。重用上次记录需确认对象与版本仍一致，不覆盖其他运行成果。`completed` 表示本阶段约定交付完成，不表示产品无缺陷；无法执行关键验证时用 `partial` 或 `blocked`。明确失败使用 `failed`。保留实际命令或来源和结果，不把计划写成已执行证据。

## 工作流程

1. 识别项目构建方式、目标主机、环境、服务依赖与访问条件；接手已有项目，无须 build 或 test 包。
2. 第一版标准路线为 Docker Compose 单机部署，读取 references/compose.md。其他平台可交付适配建议，但不能声称已经过平台验证。
3. 检查配置、镜像、存储、网络、密钥来源和必要构建条件；敏感值不写入报告。记录当前版本和可恢复状态。
4. 在目标环境和发布操作已获用户授权后执行；仅要求准备方案时交付配置与运行手册。缺少权限时报告阻塞，不宣称完成部署。
5. 发布后执行容器健康和应用关键路径检查。启动命令成功不等于服务可用。
6. 健康检查失败时交付诊断；仅在恢复路径明确且已授权时执行回滚。代码回滚不等于数据恢复，不自动撤销不可逆迁移。

## 阶段交付

目标环境、配置、发布版本、健康证据、失败诊断和恢复方案。

## 技术栈方法选择

从项目清单或已确认选型识别技术栈，读取 [技术栈映射](references/upstream/technology-skills.json)，只加载匹配条目对应目录中的 SKILL.md 及其必读引用。不要把候选技术当成已选技术；保留现有框架版本和状态管理方案。无匹配项时明确报告覆盖缺口，不声称已经使用该技术栈的专门方法。来源、版本与许可证见 [来源记录](references/upstream/sources.json)。
