---
name: stagecraft-test
description: Test an existing repository or running application, produce executable tests where feasible, and report evidence-backed defects.
---

# 产品测试

优先复用随包方法：[Matt Pocock TDD](references/upstream/tdd/SKILL.md) 用于行为与测试边界；有浏览器覆盖需求时使用 [Anthropic webapp-testing](references/upstream/webapp-testing/SKILL.md)；用户要求修复时使用 [diagnosing-bugs](references/upstream/diagnosing-bugs/SKILL.md)。复用项目现有测试框架，不因示例而强制引入 Python 或 Playwright。来源与许可见 `references/upstream/sources.json` 和各目录许可证。

## 接入与独立性

不要求安装或先执行其他 Stagecraft 包。接受用户已有文档、仓库或产品；只补当前任务必需的信息。保留已有权威来源，区分事实、假设和待确认事项。遵守目标项目的说明和用户授权范围。

## 成果记录

用 [报告模板](assets/report.md) 记录结果，建议保存到 `.stagecraft/runs/<stage>-<unique-id>/report.md`；用户指定位置优先。重用上次记录需确认对象与版本仍一致，不覆盖其他运行成果。`completed` 表示本阶段约定交付完成，不表示产品无缺陷；无法执行关键验证时用 `partial` 或 `blocked`。明确失败使用 `failed`。保留实际命令或来源和结果，不把计划写成已执行证据。

## 工作流程

1. 确定测试对象、版本或提交、地址、访问条件和可用测试环境。只有 URL 时说明不能覆盖的源码层面检查。
2. 从外部需求和用户目标建立预期结果。缺少需求时分开记录行为基线与待确认业务正确性，不能把现状当作唯一标准。
3. 依据影响和风险选择关键路径、负向输入、权限和状态测试，优先复用现有工具。需要新增测试依赖时按项目约定处理。
4. 生成并实际运行适当测试，记录环境、命令、预期与实际、复现步骤；对疑似不稳定失败做有限复查并说明原因。
5. 默认交付测试和缺陷，不自动改业务代码；用户明确要求修复时才扩展到修复与回归。不得删除有效断言来掩盖缺陷。
6. 区分测试通过、覆盖缺口和未执行检查，不用测试数量代替质量结论。

## 阶段交付

测试范围与用例、实际运行结果、缺陷复现证据、覆盖缺口。

## 技术栈方法选择

从项目清单或已确认选型识别技术栈，读取 [技术栈映射](references/upstream/technology-skills.json)，只加载匹配条目对应目录中的 SKILL.md 及其必读引用。不要把候选技术当成已选技术；保留现有框架版本和状态管理方案。无匹配项时明确报告覆盖缺口，不声称已经使用该技术栈的专门方法。来源、版本与许可证见 [来源记录](references/upstream/sources.json)。
