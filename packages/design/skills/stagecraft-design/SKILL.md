---
name: stagecraft-design
description: Design user flows, interface states, and interaction specifications from requirements or existing screens.
---

# 交互设计

处理 Web 界面视觉与实现时，先阅读并应用随包固定版本的 [Anthropic frontend-design](references/upstream/frontend-design/SKILL.md)。用它确定视觉方向、排版、布局与交互细节，保留已有设计系统。用户研究和业务流程仍按本技能补齐，视觉质量不等于可用性验证。来源与许可见 `references/upstream/sources.json` 和对应目录许可证。

## 接入与独立性

不要求安装或先执行其他 Stagecraft 包。接受用户已有文档、仓库或产品；只补当前任务必需的信息。保留已有权威来源，区分事实、假设和待确认事项。遵守目标项目的说明和用户授权范围。

## 成果记录

用 [报告模板](assets/report.md) 记录结果，建议保存到 `.stagecraft/runs/<stage>-<unique-id>/report.md`；用户指定位置优先。重用上次记录需确认对象与版本仍一致，不覆盖其他运行成果。`completed` 表示本阶段约定交付完成，不表示产品无缺陷；无法执行关键验证时用 `partial` 或 `blocked`。明确失败使用 `failed`。保留实际命令或来源和结果，不把计划写成已执行证据。

## 工作流程

1. 从用户任务和现有界面识别流程边界，复用已有设计语言。没有需求文档时补齐当前流程需要的信息。
2. 说明信息结构、关键操作、导航以及成功、空白、加载、错误和权限不足状态。
3. 设计键盘操作、焦点、标签和窄屏行为；结合真实内容与边界数据检查布局。
4. 根据用户要求和可用工具产出流程图、交互说明或原型。没有原型工具时明确实际交付格式。
5. 按关键任务走查，记录摩擦、异常恢复和需要用户验证的假设；静态图不能证明可用性测试通过。

## 阶段交付

任务流程、界面状态、交互规则、走查结果和实现交接说明。

## 技术栈方法选择

从项目清单或已确认选型识别技术栈，读取 [技术栈映射](references/upstream/technology-skills.json)，只加载匹配条目对应目录中的 SKILL.md 及其必读引用。不要把候选技术当成已选技术；保留现有框架版本和状态管理方案。无匹配项时明确报告覆盖缺口，不声称已经使用该技术栈的专门方法。来源、版本与许可证见 [来源记录](references/upstream/sources.json)。
