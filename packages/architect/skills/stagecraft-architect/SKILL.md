---
name: stagecraft-architect
description: Define technical boundaries, interfaces, data models, and implementation trade-offs for a feature or existing repository.
---

# 技术方案

## 接入与独立性

不要求安装或先执行其他 Stagecraft 包。接受用户已有文档、仓库或产品；只补当前任务必需的信息。保留已有权威来源，区分事实、假设和待确认事项。遵守目标项目的说明和用户授权范围。

## 成果记录

用 [报告模板](assets/report.md) 记录结果，建议保存到 `.stagecraft/runs/<stage>-<unique-id>/report.md`；用户指定位置优先。重用上次记录需确认对象与版本仍一致，不覆盖其他运行成果。`completed` 表示本阶段约定交付完成，不表示产品无缺陷；无法执行关键验证时用 `partial` 或 `blocked`。明确失败使用 `failed`。保留实际命令或来源和结果，不把计划写成已执行证据。

## 工作流程

1. 阅读当前项目约定和相关代码，识别真实系统边界；必要时使用项目已有的代码索引。
2. 将需求映射到组件、接口、数据流和数据约束；先考虑现有架构能否满足，避免无依据重构。
3. 对影响显著的选项说明成本、演进和失败模式。仅为难逆转且有真实取舍的决定记录 ADR。
4. 覆盖认证授权、数据迁移、异常恢复、可观测性和部署约束中与本任务相关的部分。
5. 风险需要实验才能判断时，在任务授权范围内做最小技术验证并记录结果；未执行的实验不能当作结论。

## 阶段交付

组件与接口、数据模型、关键取舍、实施顺序及验证证据。

## 技术栈方法选择

从项目清单或已确认选型识别技术栈，读取 [技术栈映射](references/upstream/technology-skills.json)，只加载匹配条目对应目录中的 SKILL.md 及其必读引用。不要把候选技术当成已选技术；保留现有框架版本和状态管理方案。无匹配项时明确报告覆盖缺口，不声称已经使用该技术栈的专门方法。来源、版本与许可证见 [来源记录](references/upstream/sources.json)。
