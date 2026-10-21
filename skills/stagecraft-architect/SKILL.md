---
name: stagecraft-architect
description: Choose and validate implementation architecture, module boundaries, data contracts and verification strategy for a scoped feature or application. Use for technical planning and feasibility, preserving existing stacks and producing executable handoffs.
compatibility: Any coding agent with file access; terminal/browser/network tools as required by the task. Optional checkpoint helper needs Node.js 22+.
---

# 技术架构

在当前 coding agent 中直接完成本阶段，不启动嵌套模型或要求用户操作 runner。先阅读本技能内的 [统一执行与交接协议](references/protocol.md)，它定义自主决策、有限修复、授权边界与跨阶段恢复。用户目标与项目约定优先；不要求安装其他阶段技能。

## 接手与恢复

识别用户的目标、当前项目、入口与终点。已有匹配工作流时读取交接记录、真实成果和验证证据，复用已确认决定；输入改变则重新检查相关结论。没有上游成果时补足本阶段必需输入即可开始，不为凑齐七阶段而要求重复采访。

## 执行闭环

1. 读取项目说明、依赖锁文件、现有代码与 AC。定位相关模块及调用路径，优先使用可用的代码索引；核实技术约束而不是从模板推断。
2. 选择最少且足以满足需求的改动，明确模块职责、接口、数据结构、状态与失败恢复。保留现有框架及状态管理；只有有依据的必要变化才提出迁移。
3. 将 AC 映射到实现任务和真实测试命令，定义独立测试边界、数据隔离、启动方式和健康检查。明确执行目录、工具前提和可观察结果，不写空泛的“补充测试”。
4. 对高风险假设做最小可逆验证：检查依赖版本、运行现有构建、验证接口/连接或隔离的技术探针。核实结果后调整设计；无网络/服务权限时把未验证假设显式标出。
5. 审查耦合、数据变更/回滚、安全边界、部署条件与维护成本。按依赖拆成小步，每步包含实现文件与验收。常规可逆技术决定自主完成；只把实质业务/成本/数据风险提交用户。

## 本阶段交付与验收

交付：架构决定及理由、模块和接口契约、数据变更与回滚策略、AC到任务/测试映射、依赖验证证据和启动/部署约束。

完成条件：每个 AC 有实现与验证落点；命令/文件可执行定位；关键技术假设有证据或明确阻塞；无未经请求的框架迁移。

使用 [报告模板](assets/report.md) 保存目标、AC、成果、实际证据及剩余问题。用 [交接助手](scripts/handoff.mjs) 记录阶段；无 Node 时按协议使用 Markdown 交接，明确验证能力限制。不能以“已写报告”代替真实验收，也不能让用户自己填状态文件。

## 平滑交接

build：交接具体任务顺序、文件/接口、验收命令和已经验证的技术选择。

用户授权继续且下一技能可用时，在同一 agent 中直接读取下一阶段 SKILL.md，沿用同一工作流、AC 标识与已确认决定。只请求本阶段新发现且不可自行解决的关键决定。阶段未完成时先修复或准确记录 blocker，不能把阻塞状态包装成完成后传下去。

## 按需加载的方法

检查 [技术栈映射](references/upstream/technology-skills.json) 与 [来源和许可](references/upstream/sources.json)，只读取与当前任务相关的上游方法目录。维持现有框架、版本和测试工具。上游的全面 grilling、人工确认、子代理或发布建议均受统一协议和用户实际授权约束，不构成额外强制步骤。没有专门方法匹配时使用通用工程能力并说明覆盖范围，不宣称已经过专门方法验证。
