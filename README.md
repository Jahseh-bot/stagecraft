# Stagecraft

0.3.0 已发布到公共 npm registry，正式 scope 为 @gaaraa。48项回归通过，8个包的仓库外 npx 下载与功能验收全部通过。

- **[零基础使用指南：从安装到打开第一个网页](docs/npm-usage.md)**
- [维护者发布流程](docs/npm-publishing.md)
- [版本记录](CHANGELOG.md)

## 第一次使用

没有开发经验，请先按上方零基础指南操作；无需下载源码或配置 GitHub。下面的 `npm run stagecraft` 命令供已下载本仓库的开发者使用，普通用户使用指南中的 `npx` 命令。

输入 PRD，确认关键问题和技术方案后，自动实现、测试修复并验证本地可运行版本；选择 `--until deploy` 后继续生成配置并完成本机 Compose 部署。支持中途人工介入、持久化检查点和恢复。

## 当前实现

新增 `@gaaraa/runner`，包含状态机、Codex CLI 适配器、真实命令验收、HTTP 启动烟测、修复预算、人工答案接入和运行日志。build/test/deploy 包也内置独立执行运行器；其余四个阶段包提供技能安装。

支持 PRD 起步，以及已有项目直接进入测试或本机 Compose 部署。没有通用 DAG 调度、远端生产发布或 Web 操作界面。

## 跑一个 PRD

需要 Node.js 22+，已安装且已登录的 Codex CLI。当前验证环境为 macOS / Node.js 24。

```sh
npm run stagecraft -- start --prd /absolute/path/to/PRD.md --dir /absolute/path/to/project
```

系统会在关键问题或方案确认时停下来，输出运行目录、问题 id 和建议。用答案文件回答，系统自动继续：

```sh
npm run stagecraft -- answer --run /path/to/run --file /path/to/answers.json
```

方案确认示例：`{"approve_plan":"yes"}`；需修改可用 `{"approve_plan":"revise:具体要求"}`。先检查 state.plan 中的技术栈、架构和将执行的命令，再确认。

```sh
npm run stagecraft -- status --run /path/to/run
npm run stagecraft -- resume --run /path/to/run
```

Ctrl+C 会保存 paused 并停止子进程。恢复从未完成的阶段继续，已确认决定不会重问。完成时生成 delivery.md，记录启动命令和验收证据。详细行为见 [运行器使用说明](packages/runner/README.md)。

## 已有项目直接接入

```sh
# 检查已有项目；缺测试时先确认测试计划，再补测试
npm run stagecraft -- test --dir /path/to/project --mode audit
# 测试失败后自动修复业务代码，保留冻结的验收测试
npm run stagecraft -- test --dir /path/to/project --mode repair
# 自动识别并生成缺少的部署配置
npm run stagecraft -- deploy --dir /path/to/project
# 也可指定固定目标
npm run stagecraft -- deploy --dir /path/to/project --target /path/to/target.json
```

两种入口都不需要 PRD，不执行产品澄清或重建架构。先只读检查，再确认可执行计划，沿用 `answer/status/resume`。部署目标格式与完整步骤见 [直接入口指南](docs/direct-entries.md)。真实部署示例保留运行在 http://127.0.0.1:43189/ 。

## 复用成熟 Skills

默认接入 [Matt Pocock Skills](https://github.com/mattpocock/skills)：

| 执行阶段 | 方法 |
| --- | --- |
| 关键问题澄清 | grilling |
| 技术方案与验收设计 | codebase-design、tdd、Anthropic frontend-design（UI 任务） |
| 实现 | tdd、codebase-design、frontend-design（UI 任务） |
| 直接测试与补测试 | tdd、Anthropic webapp-testing（Web 任务） |
| 部署审查 | 社区 docker-expert |
| 修复 | diagnosing-bugs、tdd |

原始技能以固定提交分发并保留各自 MIT / Apache-2.0 许可。设计、测试、部署独立安装包也包含对应上游资源。每个 run 快照所需资源、记录哈希，恢复时不会漂移。`--skills /path/to/profile.json` 可替换来源与阶段映射，见 [来源和适配说明](docs/skill-sources.md)。

## 包结构

- `packages/runner`：PRD 到本地可运行版本的执行闭环。
- `packages/discover`、`spec`、`design`、`architect`、`build`、`test`、`deploy`：原有独立技能安装包。
- `tooling`：阶段安装器构建与显式故障演练脚本。
- `tests`：包隔离安装、状态机、进程生命周期与资源锁定验证。
- `examples/converter/PRD.md`：温度换算应用演练输入。

阶段安装器用法仍然有效：

```sh
npm run build
node packages/test/bin/cli.mjs init --agent codex --dir /absolute/path/to/project
```

CLI 中 `init` 只安装技能；`stagecraft start/test/deploy` 和 `stagecraft-build/test/deploy run` 会自动推进各自交付。

## 验证和打包

```sh
npm test
npm pack --workspace @gaaraa/runner
```

scope 为 @gaaraa；公共包 metadata 已配置，根 workspace 保持 private。独立 tarball 包含运行器与上游方法资源，不依赖其他阶段包或仓库外路径。

## 文档

- [产品规划](docs/product-plan.md)
- [当前架构](docs/architecture.md)
- [实施路线](docs/roadmap.md)
- [Skill 来源](docs/skill-sources.md)
- [验证记录](docs/verification.md)
- [运行器使用说明](packages/runner/README.md)
- [领域术语](CONTEXT.md)

- [真实 PRD 链路演练](docs/live-drill.md)
- [Vue 后端数据库全链路演练](docs/fullstack-live-drill.md)

## 技术栈方法匹配与部署生成

已接入前端、Node/Python/Go/Java 后端、四类数据库和常用测试框架，共 38 个技能资源、26 个技术标签的阶段映射；识别项目清单或已确认选型，按当前阶段加载对应方法，记录每次匹配依据。`--stack vue` 可显式指定；`skills --dir /project --phase test_plan` 可预览。完整映射、调研量级和未覆盖范围见 [技术栈 Skills](docs/technology-skills.md)。

部署不再要求预先准备 Dockerfile/Compose/target JSON；先提出关键问题和文件草稿，确认后生成，再审查并执行部署。见 [自动部署指南与真实验证](docs/auto-deployment.md)。

## 从 PRD 连续交付到部署

```sh
npm run stagecraft -- start --prd examples/task-board/PRD.md \
  --dir /path/to/new-project --stack vue,fastify,postgres,vitest --until deploy
```

`--until deploy` 在构建、测试和本地启动验收成功后，在同一个 run 进入部署配置发现。确认关键问题、配置草稿及部署计划后，运行器执行本机 Compose 发布。省略时保持交付可运行版本的原行为。buildDelivery 保留原始构建计划和验收索引，部署不会重新走 PRD。

技术方法覆盖 Node/Express/Fastify、Python/FastAPI、Go、Java/Spring Boot、PostgreSQL、MySQL、Redis、MongoDB，以及 Vitest、Jest、pytest、Playwright、Cypress；按项目清单和阶段选择，已有版本优先。完整来源与覆盖限制见仓库 docs/technology-skills.md。

## 开发者本地打包

`npm run release` 生成八个可独立安装的 tarball 和校验清单。安装用户无需源码仓库：

```sh
npm install /path/to/gaaraa-runner-0.3.0.tgz
npx --no-install stagecraft start --prd /path/to/PRD.md --dir /path/to/app --until deploy
```

完整命令、宿主条件和独立阶段包用法见 [npm 分发指南](docs/npm-distribution.md)。0.3.0 已发布到公共 npm；一般用户按零基础指南使用 npx 即可，本节用于本地打包验证。
