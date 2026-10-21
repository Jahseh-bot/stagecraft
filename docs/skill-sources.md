# 阶段方法与第三方 Skills

用户要求各阶段优先复用成熟 Skills，Stagecraft 负责可持续执行的编排与证据，而不是重写所有专业方法。

## 已接入

来源：https://github.com/mattpocock/skills

固定提交：`5beb35b040e3de97e54fa9e386d7e42d15c295c2`，MIT，原始许可保留在 `packages/runner/vendor/mattpocock/LICENSE`。技能保持上游原文；运行器外层说明结构化交互和阶段边界的适配。

| 执行阶段 | 上游技能 | 适配 |
| --- | --- | --- |
| clarify | grilling | 问题写入 pending，等待用户答案；已确认事实和决定继续复用 |
| plan | codebase-design、tdd | 输出技术方案、测试 seam 与 argv 验收契约，用户一次确认 |
| implement | tdd、codebase-design | 在确认的 seam 按行为实现和测试 |
| repair | diagnosing-bugs、tdd | 使用真实失败证据修复；不能更改冻结测试，必要时升级为人工问题 |

“成熟”不等于对每个任务都最优。本轮确认了来源与许可，并把接入方式落实为可替换 profile；没有声称做过各技能的市场占有率排名或普遍效果评测。

## 可重复与可替换

每个 run 保存完整资源、来源、提交和文件哈希；运行期间升级项目默认 profile 不影响已有 run。支持本地 profile 替换与私有技能，运行器不会自动联网拉取不确定版本。

## 新增设计、测试与部署方法（2026-10-20）

设计采用 Anthropic frontend-design（Apache-2.0），已进入 PRD 的 plan/implement 阶段，并随独立 design 包分发。测试采用 Anthropic webapp-testing（Apache-2.0）与 Matt Pocock TDD/诊断技能；仅在 Web 浏览器覆盖适用时使用前者的方法。部署采用 sickn33/antigravity-awesome-skills 的 docker-expert（MIT，社区来源，不冒充 Docker 官方技能）。

profile 的 test_plan/test_prepare/deploy_plan 已实际注入对应方法。设计、测试、部署的独立安装包将同一固定源复制为 references/upstream；最终 tarball 自包含，不依赖 runner 安装。

市场目录显示 frontend-design 和 Matt Pocock 相关技能有广泛使用；这不是本项目效果评测，也不能据此保证每个技能都适配任意技术栈。docker-expert 的旧版镜像、Compose 语法和外部发布示例由阶段适配层约束；实际命令采用当前 Docker Compose CLI。

来源：
- https://skills.sh/
- https://github.com/anthropics/skills
- https://github.com/sickn33/antigravity-awesome-skills
- https://docs.docker.com/reference/cli/docker/compose/up/

精确固定版本：
- frontend-design: `dbd4588f9e1033efb41dad4bef2f7947c8993d44`，Apache-2.0，https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design
- webapp-testing: `dbd4588f9e1033efb41dad4bef2f7947c8993d44`，Apache-2.0，https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing
- docker-expert: `c808e6e480696d243e0668ebbc3499bb8e7e10a4`，MIT，https://github.com/sickn33/antigravity-awesome-skills/tree/c808e6e480696d243e0668ebbc3499bb8e7e10a4/skills/docker-expert

设计技能已接入与打包验证；本轮没有额外改造示例 UI，也不声称完成设计效果对比实验。discover 等尚未选定的新方法仍在后续范围。
