---
name: stagecraft-test
description: Validate an existing codebase or running app against requirements, reproduce defects, repair authorized failures and rerun affected checks to closure. Use for testing, QA, regression or test-and-fix requests; respect explicit audit-only/read-only scope.
compatibility: Any coding agent with file access; terminal/browser/network tools as required by the task. Optional checkpoint helper needs Node.js 22+.
---

# 测试与修复

在当前 coding agent 中直接完成本阶段，不启动嵌套模型或要求用户操作 runner。先阅读本技能内的 [统一执行与交接协议](references/protocol.md)，它定义自主决策、有限修复、授权边界与跨阶段恢复。用户目标与项目约定优先；不要求安装其他阶段技能。

## 接手与恢复

识别用户的目标、当前项目、入口与终点。已有匹配工作流时读取交接记录、真实成果和验证证据，复用已确认决定；输入改变则重新检查相关结论。没有上游成果时补足本阶段必需输入即可开始，不为凑齐七阶段而要求重复采访。

## 执行闭环

1. 确定对象、当前版本、环境、可用账号与授权范围。读取 AC、变更记录和既有测试；只有 URL 时明确无法覆盖源码层面。没有上游报告也能从现有需求与用户目标直接建立测试范围。
2. 建立风险优先的测试矩阵：主要行为、空/非法/边界输入、权限、状态持久性和恢复、与改动相关回归。区分已有行为基线与产品应有行为，不把现状当成正确性标准。
3. 实际执行现有测试，并补充能揭露遗漏行为的测试。Web流程可用浏览器验证关键路径、手机布局和错误状态。保存命令、预期、实际、环境与复现步骤，失败日志不可省略。
4. 在用户要求完成闭环、测试并修复或已授权实现的范围内，诊断并修复本次缺陷，再运行原失败用例及受影响回归。明确只审计、只读或仅报告时保持该边界，交付可复现缺陷即为该审计目标的闭环，不修改业务实现。
5. 按协议的有限修复预算处理问题；对偶发失败做有理由的复查，不用无限重跑掩盖不稳定。不能删除或削弱有效测试。修复改变上游构建产物时，刷新 build 的真实验证和交接，再完成受影响测试。
6. 给出 AC 结果、阻断缺陷、覆盖缺口及发布建议。测试通过仅代表检查范围通过，不保证没有缺陷；关键检查未执行不可给出无条件可发布结论。

## 本阶段交付与验收

交付：可执行测试、AC/风险覆盖矩阵、运行日志、复现步骤、授权修复及回归证据、剩余缺陷与发布建议。

完成条件：约定测试实际执行；发现项可复现或有证据；授权修复已回归；审计模式保持只读范围；关键未执行检查清楚阻止完成声明。

使用 [报告模板](assets/report.md) 保存目标、AC、成果、实际证据及剩余问题。用 [交接助手](scripts/handoff.mjs) 记录阶段；无 Node 时按协议使用 Markdown 交接，明确验证能力限制。不能以“已写报告”代替真实验收，也不能让用户自己填状态文件。

## 平滑交接

deploy：传递测试修订版本、可发布判断、已知限制与必要部署后验证；阻断缺陷不能作为已通过交接。

用户授权继续且下一技能可用时，在同一 agent 中直接读取下一阶段 SKILL.md，沿用同一工作流、AC 标识与已确认决定。只请求本阶段新发现且不可自行解决的关键决定。阶段未完成时先修复或准确记录 blocker，不能把阻塞状态包装成完成后传下去。

## 按需加载的方法

检查 [技术栈映射](references/upstream/technology-skills.json) 与 [来源和许可](references/upstream/sources.json)，只读取与当前任务相关的上游方法目录。维持现有框架、版本和测试工具。上游的全面 grilling、人工确认、子代理或发布建议均受统一协议和用户实际授权约束，不构成额外强制步骤。没有专门方法匹配时使用通用工程能力并说明覆盖范围，不宣称已经过专门方法验证。
