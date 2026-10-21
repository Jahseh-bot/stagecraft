# 按技术栈与阶段选择 Skills

运行器以 `基础阶段方法 + 技术栈专用方法` 组合上下文。不会把所有技术栈的技能一起塞给模型，也不会在运行中自动执行不固定版本的市场安装命令。

## 已接入的映射

| 技术选择 | 架构 / 开发 | 测试 | 修复 |
| --- | --- | --- | --- |
| Vue 3 | vue-best-practices | vue-testing-best-practices | vue-debug-guides + Vue 开发方法 |
| Pinia / Vue Router | 各自 best-practices | 对应方法 + 通用测试 | 对应方法 + 通用诊断 |
| Vue Options API / JSX | 显式 vue-options / vue-jsx 选择对应方法 | 相同技术约束 | 相同技术约束 |
| Flutter | 官方 architecture、responsive-layout | 官方 widget-test、integration-test、static-analysis | 官方 runtime-errors、static-analysis |
| React / Next.js | Vercel react-best-practices | 当前复用通用 TDD / Web 测试 | React 方法 + 通用诊断 |
| React Native | Vercel react-native-skills | 当前通用 TDD；未单独内置原生测试技能 | Native 方法 + 通用诊断 |

| Node.js / Express / Fastify | wshobson nodejs-backend-patterns | 通用 TDD + 所选测试框架 | Node 方法 + 通用诊断 |
| Python / FastAPI | python-design-patterns；FastAPI 单独加 fastapi-templates | python-testing-patterns | Python 测试与设计方法 |
| Go / Java / Spring Boot | Jeffallan golang-pro / java-architect | 对应语言方法 + 通用 TDD | 对应语言方法 |
| PostgreSQL | Supabase postgres-best-practices | 数据库方法 + 所选测试框架 | 加 SQL 优化方法 |
| MySQL | PlanetScale mysql | 同一数据库约束 | 索引、查询、事务方法 |
| Redis | 官方 redis-core / redis-connections | 同一连接与数据约束 | 同一方法 |
| MongoDB | 官方 mongodb-schema-design | 同一模型约束 | 加 mongodb-query-optimizer |
| Vitest / Jest | antfu vitest / javascript-testing-patterns | 对应测试方法 | 对应测试方法 |
| pytest / Playwright / Cypress | python-testing-patterns / e2e-testing-patterns | 对应测试方法 | 对应测试方法 |

设计：Web 使用 Anthropic frontend-design，Flutter 使用官方布局方法。部署始终叠加 Compose 方法，框架技能不能授权远端发布。Flutter 原生商店发布没有接入；需要 Web 容器部署时必须确认构建目标，不能默认把移动端项目当作 HTTP 服务。

## 如何识别与加载

1. 从所指项目根目录的 package.json 识别 Vue、React、Next.js、React Native、Pinia、Vue Router；从 pubspec.yaml 的 sdk: flutter 识别 Flutter。后端和测试依赖也从 package.json 识别；Python 从 pyproject.toml/requirements.txt，Go 从 go.mod，Java 从 Maven/Gradle，数据库还从 Prisma provider 和 Compose image 识别。
2. 新建项目尚无代码时，可使用 `--stack vue`；批准的方案或部署 setup 中的具体 stack 也参与识别。原始 PRD 的候选方案不会参与匹配。
3. 进入阶段前加载该 run 的 technologySkills 映射，只注入对应技能。每次调用保存 `attempts/<n>-<phase>/skills-selection.json`，记录识别依据、匹配项和缺口。
4. 版本与完整资源在创建 run 时快照，恢复不会跟随上游 main 变化。Vue 2 不会自动加载 Vue 3 方法；未知显式标签或已识别的不支持版本停止并说明缺口，需提供已审阅 profile 后新建 run。
5. 单独阶段包也分发自己相关的技术栈映射与上游资源，无需安装 runner。

```sh
npm run stagecraft -- skills --dir /path/to/project --phase test_plan
npm run stagecraft -- start --prd /path/to/PRD.md --dir /path/to/project --stack vue
npm run stagecraft -- test --dir /path/to/flutter-project --stack flutter
```

`skills` 是只读预览，不启动 Agent。支持 `--skills profile.json` 替换完整来源和映射；profile 中 `technologySkills.<tag>.<phase>` 是技能 id 数组，可加新的标签和来源。没有阶段专用条目的已知技术使用通用阶段方法，selection.matches 会明确显示这一点。当前不是全市场覆盖；复杂 monorepo 应指向具体应用根目录或显式选择标签。

## 调研记录（2026-10-20）

安装量来自 skills.sh 对应页面当次显示，页面抓取时间可能不同，不能作为全球绝对最多或质量保证。优先结合原始维护者、许可、适用版本和任务匹配。

| 候选 | 当次显示 | 决策 |
| --- | --- | --- |
| vuejs-ai/vue-best-practices | 41.4K | 采用原始来源；MIT |
| antfu/vue-best-practices | 23.7K | 页面标注转自 vuejs-ai；不重复引入 |
| Flutter 官方 architecture | 41.9K | 采用；BSD-3-Clause |
| Flutter 官方 widget-test | 38.1K | 采用，按测试阶段加载 |
| jeffallan/flutter-expert | 13.4K | 候选，首批优先采用官方细分技能 |
| Vercel react-best-practices | 819.9K | 采用；SKILL.md 声明 MIT |
| jeffallan/golang-pro | 18.7K | 已内置，完成映射测试；未完成该语言应用实测 |
| jeffallan/java-architect | 5.8K | 已内置，完成映射测试；未完成该语言应用实测 |
| jeffallan/fastapi-expert | 6.0K | 已内置，完成映射测试；未完成该语言应用实测 |

本次新增 16 个资源，全部锁定提交并保留上游许可证。Go/Java 方法已审阅，要求适配已有项目版本，不强制采用上游默认版本或覆盖率百分比。FastAPI 选用 wshobson 模板；普通 Python 项目不会误加载 FastAPI。Rust、.NET、SQLite 专用方法尚未纳入。

| 新增来源 | skills.sh 当次安装量 | 选择理由 |
| --- | --- | --- |
| [Node.js backend patterns](https://www.skills.sh/wshobson/agents/nodejs-backend-patterns) | 48.0K | Express/Fastify 共用后端方法，仓库持续维护 |
| [Supabase Postgres](https://www.skills.sh/supabase/agent-skills) | 450.7K | 官方来源，覆盖查询、索引与连接 |
| [antfu Vitest](https://www.skills.sh/antfu/skills/vitest) | 41.4K | 专门测试框架资料；遵守项目实际版本 |
| [Python testing](https://www.skills.sh/wshobson/agents/python-testing-patterns) | 36.3K | pytest、fixtures、异步测试 |
| [E2E testing](https://www.skills.sh/wshobson/agents/e2e-testing-patterns) | 24.1K | Playwright 与 Cypress |
| [PlanetScale MySQL](https://www.skills.sh/planetscale/database-skills/mysql) | 8.4K | 数据库厂商来源；不强推其托管服务 |
| [MongoDB schema](https://www.skills.sh/mongodb/agent-skills/mongodb-schema-design) | 4.9K | 官方来源 |
| [Redis](https://www.skills.sh/redis/agent-skills) | core 3.8K / connections 2.7K | 官方来源及细分连接方法 |

维护记录见 [来源清单](backend-skill-provenance.json)：记录截至 2026-10-20 的仓库最新提交日期、精确 revision、原始路径与许可。最近提交范围为 2026-09-08 至 2026-10-19；这代表仓库活跃度，不等同于每个 skill 文件都在该日更新。安装量是目录显示的累计数，不代表全球排名或效果评测。

来源：
- https://www.skills.sh/vuejs-ai/skills/vue-best-practices
- https://www.skills.sh/antfu/skills/vue-best-practices
- https://www.skills.sh/flutter/agent-plugins/flutter-apply-architecture-best-practices
- https://www.skills.sh/flutter/agent-plugins/flutter-add-widget-test
- https://www.skills.sh/jeffallan/claude-skills/flutter-expert
- https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
- https://www.skills.sh/jeffallan/claude-skills/golang-pro
- https://www.skills.sh/jeffallan/claude-skills/java-architect
- https://www.skills.sh/jeffallan/claude-skills/fastapi-expert

原始仓库：vuejs-ai/skills、flutter/agent-plugins、vercel-labs/agent-skills。精确提交和资源路径由 packages/runner/skills.profile.json 记录。Vercel 原目录无独立 LICENSE 文件，保留上游 SKILL.md 的 MIT 声明并附标准 MIT 条款与来源说明；未伪造上游提交或原始许可证文件。

## 实际验证

Vue 真实 Codex run：`output/entry-runs/595f8ef4-919d-439b-9293-eea4713f9240`。项目由 package.json 自动识别 Vue 3，在 test_plan 与 test_prepare 的 skills-selection.json 均记录 vue-testing-best-practices；保留原有 3 项测试并补充 3 项，最终真实 Node 测试 6/6 通过。没有引入 Vitest/Playwright，说明上游建议按项目情况适配而非强行替换工具。

Flutter 验证覆盖 pubspec 识别、架构/布局/Widget 测试映射、排除默认 Web 设计技能及资源哈希锁定；本机未安装 Flutter SDK，没有声称通过 Flutter 编译或设备测试。React/Native 当前完成映射与资源分发，未进行真实应用构建实测。

后端、数据库和测试框架增加了清单识别、重复方法去重、Python extras、单次 PRD 到部署状态衔接回归。全栈实测记录见 [PRD 到部署演练](fullstack-live-drill.md)。


2026-10-20 全栈演练：Vue + Fastify + PostgreSQL，15 项真实应用测试通过；安全升级到 Vitest 5 后触发真实配置故障，独立测试入口自动修复 1 次，测试文件哈希不变。独立部署入口更新镜像并保持数据，最终 npm audit 0。运行器回归 43/43。详细人工介入、暂停恢复和部署证据见 [全链路演练](fullstack-live-drill.md)。
