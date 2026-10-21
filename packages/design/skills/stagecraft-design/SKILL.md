---
name: stagecraft-design
description: Design or refine a UI, user flow, interaction system or responsive prototype from requirements; inspect and validate the result, repair usability defects and hand off implementable specifications. Use for UI/UX work in the current coding agent.
compatibility: Any coding agent with file access; terminal/browser/network tools as required by the task. Optional checkpoint helper needs Node.js 22+.
---

# 体验与界面设计

在当前 coding agent 中直接完成本阶段，不启动嵌套模型或要求用户操作 runner。先阅读本技能内的 [统一执行与交接协议](references/protocol.md)，它定义自主决策、有限修复、授权边界与跨阶段恢复。用户目标与项目约定优先；不要求安装其他阶段技能。

## 接手与恢复

识别用户的目标、当前项目、入口与终点。已有匹配工作流时读取交接记录、真实成果和验证证据，复用已确认决定；输入改变则重新检查相关结论。没有上游成果时补足本阶段必需输入即可开始，不为凑齐七阶段而要求重复采访。

## 执行闭环

1. 检查现有界面、设计系统、组件库与用户约束，将需求 AC 映射到页面、状态和操作。非UI任务记录不适用依据并完成简短设计判定，不强行设计界面。
2. 确定信息层级、核心操作顺序、导航、输入反馈以及空/加载/失败/成功状态。沿用已有视觉语言；新项目自主选择与用户场景匹配的方向，不要求用户先选择配色。
3. 创建与请求相称的设计成果：可运行原型、组件示例、布局/交互规格或已授权设计工具文件。不得把生成的静态图当成已实现可交互页面。解释复杂交互的键盘、焦点、屏幕阅读器行为。
4. 检查桌面和手机布局、文本溢出、可点击面积、对比度和键盘路径。有可运行原型和浏览器工具时实际渲染并截图检查；无渲染能力时记录检查范围及未验证项。
5. 根据真实检查修复视觉/交互问题并重查关键状态。将设计决定、资源位置、组件状态与 AC 对应起来。若目标只要设计，到可实施设计交付止步，不擅自开发整套业务。

## 本阶段交付与验收

交付：页面/状态清单、信息结构、组件与响应式规则、可用原型或设计文件、检查记录与资源路径。

完成条件：主要流程和异常状态均有设计；手机/桌面与键盘路径可解释；成果可定位且能指导实现；实际渲染与仅静态审查明确区分。

使用 [报告模板](assets/report.md) 保存目标、AC、成果、实际证据及剩余问题。用 [交接助手](scripts/handoff.mjs) 记录阶段；无 Node 时按协议使用 Markdown 交接，明确验证能力限制。不能以“已写报告”代替真实验收，也不能让用户自己填状态文件。

## 平滑交接

architect / build：交付组件、布局、状态、资源及 AC 对照，避免重新选择视觉方向。

用户授权继续且下一技能可用时，在同一 agent 中直接读取下一阶段 SKILL.md，沿用同一工作流、AC 标识与已确认决定。只请求本阶段新发现且不可自行解决的关键决定。阶段未完成时先修复或准确记录 blocker，不能把阻塞状态包装成完成后传下去。

## 按需加载的方法

检查 [技术栈映射](references/upstream/technology-skills.json) 与 [来源和许可](references/upstream/sources.json)，只读取与当前任务相关的上游方法目录。维持现有框架、版本和测试工具。上游的全面 grilling、人工确认、子代理或发布建议均受统一协议和用户实际授权约束，不构成额外强制步骤。没有专门方法匹配时使用通用工程能力并说明覆盖范围，不宣称已经过专门方法验证。
