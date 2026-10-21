# Skills-first 架构

执行入口是当前 coding agent 中的阶段 Skill。模型、登录、工具和权限由宿主提供，Stagecraft 不再要求另起 Codex 进程来运行新流程。

## 结构

- `packages/<stage>/skills/stagecraft-<stage>/SKILL.md`：本阶段职责、具体工作流、验收与交接。
- `references/protocol.md`：统一自主执行、授权、修复、状态与交接语义。
- `scripts/handoff.mjs`：可选确定性交接助手，只有文件校验与检查点操作，不运行模型或部署命令。
- `assets/report.md`：成果和证据模板。
- `references/upstream/`：按需加载的固定版本方法、技术栈映射和原始许可。
- `tooling/installer.mjs`：各宿主路径适配，构建时复制进每个独立包。
- `tooling/skill-shared/`：协议/助手的单一维护来源，构建时复制进七个技能。

## 状态与失效

新流程写 `.stagecraft/workflows/<id>/workflow.json`，schema 为 `stagecraft-handoff/v1`。旧 `.stagecraft/runs` 完整保留，不能把两种记录混写。

每次流程明确 objective/goal、entry 和 until。阶段序列来自该范围，不存在的上游不作为直接进入的前置条件。状态为 pending、in_progress、completed、blocked 或 stale；Markdown 报告还可细分 failed/partial。完成记录包含真实成果路径、校验方法、证据文件、SHA-256 及下一步。

助手在读取和变更前重新检查已完成阶段的文件。发现变化或缺失就将本阶段与下游标记 stale。测试阶段修复了构建产物时，必须先重新验证/记录 build，再完成受影响测试。检查点用独占锁及原子替换写入；并发写入拒绝执行，不自动删除未知锁。

助手验证的是结构、存在性和内容一致性，不是对模型声明真实性的证明。实际执行日志和可独立检查的结果仍是验收依据。无 Node 的宿主按统一协议维护等价 Markdown 记录并如实说明缺少哈希验证。

## 阶段衔接

当前 Skill 达到验收条件后，若用户授权目标包含后续阶段，则读取已安装的下一个 Skill，复用同一目录、AC 标识和决定；自动准备下一阶段方案，讨论本阶段计划与各决策环节；已有选择说明依据后复用。下一 Skill 缺失则交付完整交接和具体安装/读取入口，不伪造后续完成。

## 兼容层

`packages/runner` 及 build/test/deploy 的 `run` 命令保留旧状态机与 Codex 适配器，仅供已有任务恢复。旧 runner 的部署范围依旧是本机 Compose；新版 deploy Skill 使用当前 agent 的实际工具，可对明确授权的本机或远端目标工作。二者不混同。

## 关键决策门槛

产品范围、模块、核心流程、视觉方向、核心技术架构和部署方案未明确时先给可比较方案与推荐理由，等待用户确认；直接进入 build 也执行同一规则。用户明确选择或按范围委托后自动继续。阶段报告保存决策 ID、选项、理由、选择来源与范围；待确认使用现有 blocked 状态。helper 仅验证文件证据，不验证人类授权；不得把 agent 的推断视为用户决定。
