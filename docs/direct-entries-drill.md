# 直接测试与部署演练：2026-10-20

## 环境与证据类型

macOS、Node.js 24、Codex CLI 0.144.1，使用 STAGECRAFT_CODEX_ISOLATED=1 避免本机旧 CLI 与用户配置不兼容。Docker Engine 29.4.0、Compose 5.1.2、OrbStack 本地 Unix socket。初次启动 VM 超时，随后确认引擎运行成功。

自动化回归使用 Agent/Docker 协议替身配合真实 Node 子进程与本地 HTTP。下面两次直接入口使用真实 Codex；部署实际构建并启动 Docker 容器，未发布云平台。

## 直接测试

项目：output/direct-test-converter，复制既有可运行应用，并显式注入公式 +32→+31 的错误。输入是已有代码、现有测试与短任务说明，不是 PRD。

run：`output/entry-runs/376aa432-18d3-449e-ae45-eee435184efe`

实际 Agent 阶段仅为 `test_plan, repair`。确认计划后运行 npm test，捕获真实失败，进行一次 Codex 修复，然后 13/13 通过。两份已有测试文件的冻结哈希未改变；未运行 clarify、plan 或 implement。

- 首次错误含 expected fahrenheit=32，actual=31。
- 最终 outcome=passed，repairsUsed=1。
- 日志：attempts/verify-1-0.log、verify-2-0.log。
- Codex 只读规划环境曾无法绑定测试端口（EPERM）；运行器在真实执行环境独立运行测试，以运行器证据作为结论。

## 直接部署

项目：output/direct-deploy-converter，已有 Dockerfile 与 compose.yaml。单个无状态 web 服务，非 root、只读文件系统、无卷，映射 127.0.0.1:43189→8080。

run：`output/entry-runs/733943ef-814a-4f06-bc0b-3932905b06f4`

实际 Agent 阶段仅为 deploy_plan。真实 Codex 完成配置检查；审批后 Compose 配置检查和 npm test 均通过。运行器执行真实 Docker 构建/up --wait，容器达到 running/healthy，HTTP /health 返回 200 与 ok，outcome=passed。

运行器退出后独立请求 `/api/convert?c=0` 返回 `{"fahrenheit":32}`；服务保持运行，访问 http://127.0.0.1:43189/ 。原 43187 PRD 预览不受影响。

## 真实部署中断与恢复

run：`output/entry-runs/a5fb389c-4da0-45d8-92c0-7d6ae55cfb79`

此演练复用前次已审阅的计划，未重复调用模型；Docker 命令与 HTTP 观测仍是真实执行。完成 apply 并落盘后触发 AbortController，保存 paused/deploy_verify。随后通过标准 CLI resume 恢复到 completed，事件仅有一次 deployment_intent/deployment_applied，不重新执行 up。

服务保留供查看。清理时使用最新 run 的 delivery.md 中 scoped cleanup argv，或：

```sh
docker --context orbstack compose -p stagecraft-entry-drill \
  -f /Users/curveslink/workspace/stagecraft/output/direct-deploy-converter/compose.yaml down
```

不带 -v；该示例无数据库或持久化卷。

## 验证边界

没有验证云凭据、远端 Docker、生产发布、数据库迁移、自动回滚或并发部署。设计方法已接入资源映射与独立包，本轮没有额外设计改版实验。健康检查和配置审批不等于不可变制品部署：源码构建上下文、bind mount 与浮动镜像标签仍可变化。
