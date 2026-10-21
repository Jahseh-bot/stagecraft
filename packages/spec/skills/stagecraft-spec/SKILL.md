---
name: stagecraft-spec
description: Turn an idea, external PRD, or existing product change into scoped requirements and acceptance criteria.
---

# 需求规格

## 接入与独立性

不要求安装或先执行其他 Stagecraft 包。接受用户已有文档、仓库或产品；只补当前任务必需的信息。保留已有权威来源，区分事实、假设和待确认事项。遵守目标项目的说明和用户授权范围。

## 成果记录

用 [报告模板](assets/report.md) 记录结果，建议保存到 `.stagecraft/runs/<stage>-<unique-id>/report.md`；用户指定位置优先。重用上次记录需确认对象与版本仍一致，不覆盖其他运行成果。`completed` 表示本阶段约定交付完成，不表示产品无缺陷；无法执行关键验证时用 `partial` 或 `blocked`。明确失败使用 `failed`。保留实际命令或来源和结果，不把计划写成已执行证据。

## 工作流程

1. 接收已有材料；区分已确认要求、实际行为和推断，不强制重写完整 PRD。
2. 确定用户任务、目标、范围和不做事项。仅追问会改变实现或验收的歧义。
3. 写出正常路径、失败路径、权限和状态变化；非功能要求使用可测指标，未知指标标注待确定。
4. 为需求设置稳定标识并写可执行的验收场景，确保预期结果来自需求而非当前代码。
5. 审查矛盾、遗漏和不可验证要求；输出足够进入实现的规格或具体阻塞点。

## 阶段交付

范围、需求标识、验收场景、假设与待决策项。

## 技术栈方法选择

从项目清单或已确认选型识别技术栈，读取 [技术栈映射](references/upstream/technology-skills.json)，只加载匹配条目对应目录中的 SKILL.md 及其必读引用。不要把候选技术当成已选技术；保留现有框架版本和状态管理方案。无匹配项时明确报告覆盖缺口，不声称已经使用该技术栈的专门方法。来源、版本与许可证见 [来源记录](references/upstream/sources.json)。
