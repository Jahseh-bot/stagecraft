# 自动交付架构

## 目标和当前范围

从任意阶段进入、自动推进到约定交付目标是总体方向。当前已实现第一条纵向路径：PRD → 关键澄清 → 方案确认 → 实现 → 测试 → 有界修复 → 本地 HTTP 启动验证。

使用独立 runner 包，不要求安装其他阶段包。编码后端是 Codex exec；Skills 是可替换的方法资源，阶段切换和完成判断由运行器负责。

## 代码职责

| 文件 | 职责 |
| --- | --- |
| packages/runner/src/store.mjs | PRD 快照、原子状态写入、运行锁和旧锁处理 |
| packages/runner/src/contracts.mjs | Agent 结构化输出、问题、计划、argv 验收与本地烟测约束 |
| packages/runner/src/skills.mjs | 上游方法快照、来源记录、按阶段加载和哈希检查 |
| packages/runner/src/codex.mjs | 非交互 CLI 调用、结构化结果、只读规划/项目写入模式 |
| packages/runner/src/process.mjs | argv 子进程、超时、取消、日志和 HTTP 烟测 |
| packages/runner/src/engine.mjs | 阶段状态机、人工答案、冻结测试、修复额度和恢复 |
| packages/runner/src/deployment.mjs | 本地 Compose 目标校验、配置快照、发布和持续健康观测 |
| packages/runner/bin/cli.mjs | start/test/deploy/status/answer/resume |

## 状态流转

phase：clarify → plan → implement → verify；验证失败进入 repair → verify。完成后为 completed。

独立测试：test_plan → 确认 → test_prepare（仅缺测试时）→ verify → repair（仅 repair 模式）。独立部署：deploy_plan → 配置快照与确认 → deploy → deploy_verify。两者均跳过 clarify 和 PRD。

status：ready、running、waiting_input、paused、completed、cancelled。等待输入不丢失 phase。Agent 可在编码或修复中提出新的关键问题；确认后在该阶段继续。模型输出、工具退出码、测试和烟测证据分开保存。

规划必须有人确认技术栈、架构和验收命令。之后普通验证失败自动修复，默认两次；预算耗尽进入人工介入，显式 retry 只授予一次额外修复。

## 证据与边界

实现完成后记录计划中测试文件的 SHA-256，修复不能偷偷修改这些测试。真实 argv 命令全部成功，并且服务实际启动、HTTP 状态和内容匹配后才完成；服务在烟测后关闭。

冻结只保护列出的测试文件，不保证测试覆盖完整、不构成针对恶意 Agent 的隔离。项目命令需在方案确认时审阅，环境与权限仍由执行宿主决定。此版本只执行本机 Compose 部署，不支持远端生产发布。audit 的 completed 表示报告完成，outcome 才表示通过或失败。

## 持久化与恢复

run 包含 state.json、skills.lock.json、技能快照、attempts 日志、Agent 结构化回复与完成报告。PRD 内容快照化，后续编辑原始 PRD 不会默默改变既有 run。需求变更目前建议开启新 run，复用原项目。

正常 SIGINT/SIGTERM 会终止当前子进程，保存 paused；resume 重做尚未完成的阶段，并读取现有文件。不是逐 token 或任意命令级重放。SIGKILL 后可能残留进程，恢复先请求人工核对，避免静默重复副作用。锁与状态文件适用于同一主机本地文件系统，未提供跨机分布式一致性。

## 上游 Skills

使用固定版本的 Matt Pocock 方法：grilling、codebase-design、tdd、diagnosing-bugs。每次 run 保存资源和哈希；阶段调用只注入相应方法。第三方的交互输出适配为 pending.questions，外部写操作与派生子任务不会因为技能提到就自动获得授权。

可通过本地 profile 替换。当前运行器不自动从市场搜索或追踪 latest；新增供应方必须显式选择和验证。

## 后续

扩展任务图和阶段入口前，先用更复杂的真实项目验证当前纵向路径。七阶段安装包后续可以沿用相同执行和资源协议，但尚未全部改造成自动执行入口。

## 直接入口补充

详情见 direct-entries.md。测试入口批准时冻结已有测试，补测试后冻结新增测试；库项目可以省略 HTTP 烟测。部署在变更前保存 intent，正常停止或崩溃恢复后只做健康核对，不重复 up。明确失败或结果未知的 apply 不能仅凭旧容器健康宣布成功，需要人工核对版本。配置快照哈希防止批准后的模型漂移，但源码与镜像标签未作为不可变发布制品冻结。

上游方法新增 Anthropic frontend-design/webapp-testing 和社区 docker-expert；来源与版本见 skills.profile.json。

## 配置生成与技术方法路由

deploy_discover 是只读 Agent 阶段，输出部署目标、技术栈证据与完整文件内容。setup 确认后由 deployment-setup.mjs 独占创建缺失文件，保存写入意图并支持重入，随后复用 deploy_plan/deploy/deploy_verify。不覆盖现有配置。

stack-skills.mjs 从项目清单、显式选型、批准方案识别标签；skills.mjs 读取 run 快照中的 technologySkills 映射。codex.mjs 记录技能选择与证据并仅注入匹配方法。未知标签进入可见错误，需补 profile，不在运行中盲目安装市场技能。

## PRD 连续部署目标

createRun 保存 until=runnable|deploy，默认保持本地可运行验收。until=deploy 在 verify 成功后保存 buildDelivery（批准方案与 verificationIndex），继续 deploy_discover。随后生成、批准、部署复用现有状态机；阶段判断而非原始 entry 决定部署方案校验与恢复，避免 PRD 起源的部署重新进入 implement。部署完成前仍保留同一个 run ID、技能快照和决策历史。

技能目录含 38 个资源、26 个技术标签。后端、数据库、测试框架与前端可以组合；同一资源去重。清单检测范围为应用根目录，不递归猜测 monorepo 所有子应用。
