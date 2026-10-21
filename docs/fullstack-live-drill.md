# Vue 后端数据库全链路演练

演练日期：2026-10-20。输入为 [今日事项 PRD](../examples/task-board/PRD.md)，产物位于 `output/fullstack-taskboard`。这是实际 Vue 3、Fastify、PostgreSQL 应用，使用 Vitest 和真实数据库，不是运行器的假 Agent fixture。

## 运行方式

```sh
STAGECRAFT_CODEX_ISOLATED=1 node packages/runner/bin/cli.mjs start \
  --prd examples/task-board/PRD.md --dir output/fullstack-taskboard \
  --stack vue,fastify,nodejs,postgres,vitest --until deploy \
  --agent-timeout-ms 1200000 --state-root output/fullstack-runs
```

运行记录：`output/fullstack-runs/638de6e1-0f04-44de-a6d5-f17ec4f15f53`。`STAGECRAFT_CODEX_ISOLATED` 用于本机 CLI 配置兼容，仍使用现有登录，不是绕过权限。

运行器先询问计数、删除交互与视觉方向，再提出实际命令、架构和验收文件。按用户已授权的推荐方案作答：主计数为待办数量、三个筛选各显示数量、删除前页面内确认、冷白与蓝色视觉。批准验收计划后进入实现。

## 技能与验收

plan/implement 的 skills-selection.json 包含 Vue 开发、Node 后端、Supabase Postgres、antfu Vitest 及通用设计/TDD 方法。技能固定在 run 快照中；没有按运行时热榜下载新指令。技术方案沿用 Vitest 3，未因上游参考文件介绍 Vitest 5 而强行升级。

验收命令为 npm ci、typecheck、test:api、test:ui、完整 Vitest 和 production build，随后启动 43192 的 HTTP 服务探测真实数据库健康。三个验收文件在实现完成后冻结：tasks.api.test.ts、health.api.test.ts、App.test.ts。独立测试库端口 55439，测试使用独立 schema，不与部署数据卷共享。

## 实际发现并修复的问题

- CLI 的 skillsProfile 曾误取 --stack 参数，显式栈被当作 profile 文件名；已修正并加 CLI 回归。
- Python extras 写法 psycopg[binary] 曾漏识别 PostgreSQL；已补边界匹配。
- 本机 npm 镜像安装停滞：暂停 run，仅对示例项目设置官方 registry，宿主安装依赖后恢复原 run，未重复产品澄清与方案确认。
- Codex 子命令可独立进程组运行，原来的组终止遗漏 npm 进程；已补终止前捕获后代进程并清理，回归使用忽略 SIGTERM 的 detached 子进程验证。

## 范围

当前部署为本机 OrbStack Compose，不是云端生产发布。未覆盖远端凭据、TLS、备份恢复、零停机、正式迁移与回滚。其他语言和数据库已完成技能映射；这次真实应用验证仅覆盖 Vue、Fastify、PostgreSQL、Vitest。

## 复现测试环境

演练使用单独的本机 PostgreSQL；下面的口令仅用于这个隔离演练容器：

```sh
docker --context orbstack run -d --name stagecraft-prd-db \
  -p 127.0.0.1:55439:5432 \
  -e POSTGRES_DB=taskboard_test -e POSTGRES_USER=stagecraft \
  -e POSTGRES_PASSWORD=stagecraft_test_only postgres:15
```

容器已存在时直接 `docker --context orbstack start stagecraft-prd-db`，不要重复创建。最终应用使用另一套部署库。仅需停止测试环境时执行 `docker --context orbstack stop stagecraft-prd-db`。

## 构建验收结果

运行器独立执行的第一次冻结验收通过：API 8/8、Vue UI 7/7，完整 Vitest 15/15；npm ci、类型检查、Vue 生产构建和 43192 的真实数据库健康烟测全部通过。修正 Fastify unknown 类型与 Unicode 输入规则发生在实现阶段；此次冻结后未消耗自动 repair 额度，不将它冒称为发生过独立 repair 阶段。

原运行在实现阶段暂停两次后恢复，未重走 clarify/plan。第一次发现独立进程组遗留，修复后第二次确认 npm 子进程随暂停退出。宿主与编码沙箱的依赖权限不同，项目 AGENTS.md 记录环境约束；最终验收仍由运行器真实 npm ci 执行。

进程修复后的运行器回归 42/42 通过，包含实际失败测试→修复、人工补充修复额度、测试不可改写、SIGINT 暂停、detached 后代进程清理和 PRD 部署衔接。

## 部署和持久化结果

最终原 run 为 completed / passed。访问 [今日事项](http://127.0.0.1:43193/)，健康接口为 `/health`。自动生成 Dockerfile、.dockerignore、compose.yaml，部署服务 app/db 均健康；数据库没有发布宿主端口。

首次冷部署发生真实超时：镜像拉取、构建和健康等待原先共用 60 秒。运行器保留失败的 apply，不会把部分启动当成功。修复后为镜像拉取/构建增加独立 10 分钟预算，另加目标健康等待；新增延迟构建回归。该次已发生的发布由宿主按原 compose.approved.json 接管执行，退出码 0；核对 app 容器 Image 与本次构建的 image ID 一致，再提交 resume_action=manual_fix。原 run 仅重新验收，没有自动重复发布。此次真实链路包含人工接管，不宣称全程无人介入。

浏览器实测新增任务、完成、已完成筛选、打开删除确认、Esc 取消及焦点恢复。HTTP 实测空标题 400、创建 201、删除演练记录 204。然后重启 app 和 db，比较完整 API 数据：同一任务 ID、标题、完成状态和计数保持一致，页面刷新后也保留。证据为 `output/fullstack-http-evidence.json`、`output/fullstack-taskboard.png` 和 run 内日志。

最终运行器回归 **43/43** 通过；应用测试 **15/15** 通过。

停止应用并保留数据库卷：

```sh
docker --context orbstack compose -p stagecraft-taskboard \
  -f output/fullstack-taskboard/compose.yaml down
```

不要添加 `-v`，否则会删除数据卷。重启可使用同一文件 `up -d --wait`。演练配置含明确的本机演练口令，运行镜像暂时保留完整 node_modules（tsx 为开发依赖但用于启动）；正式产品发布前应拆分运行依赖并做安全升级、备份和发布策略设计。

## 安全升级后的真实修复入口

初次镜像构建的 npm audit 提示 4 项漏洞，涉及 @fastify/static 和 Vitest/tinypool。已核对插件官方兼容表与 Vitest 引擎要求，升级到 @fastify/static 10.1.6、Vitest 5.0.5，并保留原始验收断言。新版 npm audit 为 0（证据 `output/fullstack-audit-final.json`）。

Vitest 5 默认继承根配置，旧配置重复注册 Vue 插件导致 SFC 解析失败。这是实际升级故障，不是人为改坏业务代码。独立测试修复 run 为 `output/fullstack-runs/d0d1854f-ffaa-4ee4-a1ed-4879d8e6d0c7`，使用技术栈自动识别和固定 Vitest/Vue 技能，从 test_plan 进入，不读取 PRD。

该修复 run 最终 completed/passed：verification 为 false→true，repairsUsed=1；修改 Vitest 配置以继承单一根 Vue 插件。三个验收测试文件 SHA-256 与最初 PRD run 完全相同。repair 匹配了 diagnosing-bugs、tdd、Vue debug/development、Vitest、Node 与 PostgreSQL 方法。

更新部署使用独立入口，run 为 `output/fullstack-runs/c67b6e1e-7c74-49e3-b315-13164bc8d9c0`；沿用原 target 和数据卷，无 PRD 阶段。安装量和技能示例不替代依赖兼容验证；适配器已补充新项目应核对包仓库支持版本、记录 lockfile 并指出已知公告的要求。

更新部署最终 completed/passed，apply.ok=true、timedOut=false，预检与持续健康验收均通过，未需要人工接管。app/db 均 running/healthy；更新后 API 数据与重启验证前完全一致，浏览器刷新确认页面正常。此次证明修复后的运行器可以完成真实构建发布，并保留已有数据库数据。
