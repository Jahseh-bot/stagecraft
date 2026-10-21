---
name: stagecraft-deploy
description: Prepare, execute and verify deployment to the user-authorized local or remote target, including configuration, health checks, rollback planning and failure diagnosis. Use for deployment/release/go-live requests; work with the current agent capabilities rather than requiring Docker or a specific provider.
compatibility: Any coding agent with file access; terminal/browser/network tools as required by the task. Optional checkpoint helper needs Node.js 22+.
---

# 部署与发布验证

在当前 coding agent 中直接完成本阶段，不启动嵌套模型或要求用户操作 runner。先阅读本技能内的 [统一执行与交接协议](references/protocol.md)，它定义自主决策、有限修复、授权边界与跨阶段恢复。用户目标与项目约定优先；不要求安装其他阶段技能。

## 接手与恢复

识别用户的目标、当前项目、入口与终点。已有匹配工作流时读取交接记录、真实成果和验证证据，复用已确认决定；输入改变则重新检查相关结论。没有上游成果时补足本阶段必需输入即可开始，不为凑齐七阶段而要求重复采访。

## 执行闭环

1. 确认用户指定的目标、环境、版本/构建产物、权限和发布范围。读取测试证据与项目配置；没有前序报告时自行完成必要发布前检查。目标不明或发布权限缺失才提问，不能把本机目标擅自改成公网。
2. 使用现有托管平台、CI/CD、容器、静态托管或进程管理方案；按实际项目选型，不强制 Docker。查验平台当前官方配置。复用既有凭据机制，密钥不写入报告、源码或聊天。
3. 生成必要部署配置、健康检查、环境变量名称说明和回滚步骤。在授权环境先验证构建、配置和关键前置条件；数据迁移、付费资源或不可逆操作只在所需授权明确时执行。
4. 执行实际发布，记录目标、修订版本、时间和可观察部署结果。构建成功、推送成功或进程启动不是发布成功；等待平台报告结果，并检查实际目标地址与关键用户路径。
5. 发布失败先诊断日志，做范围内可逆修复后重试。存在旧实例时核对正在运行的版本，不能以旧服务健康冒充本次上线。检查失败且继续会扩大影响时按已授权回滚计划回滚，验证回滚结果并如实报告本次失败。
6. 在外部凭据、账单、DNS或平台故障阻塞时保存具体状态、已完成动作和恢复路径，不重复执行可能已成功的发布。成功时交付实际访问地址、版本证据、健康结果、回滚与后续更新方法。

## 本阶段交付与验收

交付：可重用部署配置、发布记录、实际地址与修订版本、健康/关键路径证据、回滚和更新说明。

完成条件：目标与授权一致；实际发布版本已确认；目标健康与关键路径已验证；没有仅凭构建/推送宣称上线；失败或回滚结果准确记录。

使用 [报告模板](assets/report.md) 保存目标、AC、成果、实际证据及剩余问题。用 [交接助手](scripts/handoff.mjs) 记录阶段；无 Node 时按协议使用 Markdown 交接，明确验证能力限制。不能以“已写报告”代替真实验收，也不能让用户自己填状态文件。

## 平滑交接

到已授权发布目标为止；交付维护、回滚和再次发布入口，不擅自创建持续后台任务。

用户授权继续且下一技能可用时，在同一 agent 中直接读取下一阶段 SKILL.md，沿用同一工作流、AC 标识与已确认决定。只请求本阶段新发现且不可自行解决的关键决定。阶段未完成时先修复或准确记录 blocker，不能把阻塞状态包装成完成后传下去。

## 按需加载的方法

检查 [技术栈映射](references/upstream/technology-skills.json) 与 [来源和许可](references/upstream/sources.json)，只读取与当前任务相关的上游方法目录。维持现有框架、版本和测试工具。上游的全面 grilling、人工确认、子代理或发布建议均受统一协议和用户实际授权约束，不构成额外强制步骤。没有专门方法匹配时使用通用工程能力并说明覆盖范围，不宣称已经过专门方法验证。
