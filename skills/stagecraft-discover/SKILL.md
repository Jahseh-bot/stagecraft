---
name: stagecraft-discover
description: Evaluate an idea, user problem, market hypothesis or MVP investment decision; research evidence, challenge assumptions and close with a validated decision brief. Use for idea discovery or deciding what to build, including direct entry without a PRD.
compatibility: Any coding agent with file access; terminal/browser/network tools as required by the task. Optional checkpoint helper needs Node.js 22+.
---

# 创意判断

在当前 coding agent 中直接完成本阶段，不启动嵌套模型或要求用户操作 runner。先阅读本技能内的 [统一执行与交接协议](references/protocol.md)，它定义自主决策、有限修复、授权边界与跨阶段恢复。用户目标与项目约定优先；不要求安装其他阶段技能。

## 接手与恢复

识别用户的目标、当前项目、入口与终点。已有匹配工作流时读取交接记录、真实成果和验证证据，复用已确认决定；输入改变则重新检查相关结论。没有上游成果时补足本阶段必需输入即可开始，不为凑齐七阶段而要求重复采访。

## 执行闭环

1. 从用户目标、现有材料和项目记录识别目标人群、痛点、替代方案与决策期限。先检查可查证事实；仅对会改变研究方向的缺口提问，不把所有采访问题都交给用户。
2. 有联网能力时调查一手产品、公开定价、文档和用户研究，保存链接、访问日期、支持的具体主张与反证。没有联网能力时明确证据限制，不能把推测写成市场事实。
3. 拆分价值、实现、分发、付费等假设，按影响与不确定性排序。提出最小验证实验，写明对象、成本边界、操作、观察指标和继续/停止阈值的依据。实际对外联系或付费实验须有相应授权。
4. 根据已取得证据给出 go / validate-first / no-go 建议、置信限制及可推翻结论的条件。小范围证据不足时自主缩小主张，补充可取得资料，再审查结论是否仍成立。
5. 逐条检查关键主张能否追溯到证据，实验是否能区分相反假设、MVP 是否解决最核心问题。修正矛盾后提交发现报告；研究执行完整可完成本阶段，但不能声称尚未执行的市场实验已验证需求。

## 本阶段交付与验收

交付：目标用户与问题陈述、证据矩阵、假设优先级、MVP边界、验证实验和决策报告。

完成条件：关键主张有来源或清楚标为假设；至少分析一个替代方案和反证；实验有可执行步骤及判断标准；建议与证据强度一致。

使用 [报告模板](assets/report.md) 保存目标、AC、成果、实际证据及剩余问题。用 [交接助手](scripts/handoff.mjs) 记录阶段；无 Node 时按协议使用 Markdown 交接，明确验证能力限制。不能以“已写报告”代替真实验收，也不能让用户自己填状态文件。

## 平滑交接

spec：把决策报告中的已支持需求转成可验收规格；保留 validate-first 条件。

用户授权继续且下一技能可用时，在同一 agent 中直接读取下一阶段 SKILL.md，沿用同一工作流、AC 标识与已确认决定。只请求本阶段新发现且不可自行解决的关键决定。阶段未完成时先修复或准确记录 blocker，不能把阻塞状态包装成完成后传下去。

## 按需加载的方法

检查 [技术栈映射](references/upstream/technology-skills.json) 与 [来源和许可](references/upstream/sources.json)，只读取与当前任务相关的上游方法目录。维持现有框架、版本和测试工具。上游的全面 grilling、人工确认、子代理或发布建议均受统一协议和用户实际授权约束，不构成额外强制步骤。没有专门方法匹配时使用通用工程能力并说明覆盖范围，不宣称已经过专门方法验证。
