# 已有项目的测试和部署入口

入口决定从哪里开始，不要求其他 Stagecraft 包或上游阶段产物。使用 Node.js 22+ 和已登录的 Codex CLI；部署另需可运行的本机 Docker 与 Compose。

## 测试

```sh
npm run stagecraft -- test --dir /absolute/project --mode audit
npm run stagecraft -- test --dir /absolute/project --mode repair --max-repairs 2 \
  --goal '检查订单取消和退款行为；保持现有框架'
```

1. `test_plan` 只读检查已有仓库与测试，选择可执行检查，列出受保护测试路径；需求不明时仅问当前测试必需的问题。
2. 使用 `answer --run <run> --file answers.json` 确认 `{"approve_plan":"yes"}`。无需产品 PRD、重新选栈或架构设计。
3. 已有测试直接冻结并执行；缺少的测试由 `test_prepare` 按批准计划补齐，禁止改应用和已有测试，然后冻结验收文件。
4. audit 输出报告与真实失败，completed/outcome=failed 返回 3；repair 使用真实日志修复，达到上限后请求介入。
5. 任一入口沿用 `status`、`answer`、`resume`。测试文件路径和执行命令属于验收契约，修复不能自行换掉。

`audit` 表示不自动修业务代码，不表示绝对不写文件：可能生成批准的新测试，项目测试命令也会产生正常构建产物。无现有覆盖时需要审阅新断言是否反映业务预期。当前仅保护计划列出的文件，无法数学证明测试覆盖完整或业务正确。

## 部署

可以直接运行 `deploy --dir /project` 自动识别并生成缺失配置，详见 [自动部署](auto-deployment.md)。已有 Dockerfile/Compose 配置时，也可创建目标文件：

```json
{
  "provider": "compose",
  "context": "orbstack",
  "projectName": "my-product-preview",
  "file": "compose.yaml",
  "url": "http://127.0.0.1:43189/health",
  "expectedStatus": 200,
  "bodyIncludes": "ok",
  "timeoutMs": 120000
}
```

context 应替换成自己的本机 Docker context（例如 default）；只接受 Unix socket 引擎。projectName 决定被更新的 Compose 项目，使用独立名称可隔离演练。file 必须为项目内相对路径。url 必须是带显式端口的本地 HTTP；首版不支持 SSH context、远端地址或云平台。

```sh
npm run stagecraft -- deploy --dir /absolute/project --target /absolute/target.json
```

`deploy_plan` 使用 docker-expert 审查现有配置，提出预检命令。运行器渲染 Compose 模型，在运行目录写入 `compose.approved.json`，并展示目标、服务、端口与持久化资源；审阅后用相同的 approve_plan 答案继续。

运行器执行预检、保存部署意图、调用 `docker --context ... compose ... up --build --detach --wait`，再核对目标 HTTP 与所有声明服务的 running/healthy 状态。成功后容器保留运行，`delivery.md` 记录访问地址与精确清理 argv。不会执行 `down -v`，不会推送镜像。

## 恢复语义

- 部署前预检失败：解决问题后 retry，尚未产生部署动作。
- 部署意图落盘后中断：resume 进入服务核对，不重放 up。
- up 明确失败或结果未知：健康的旧容器不能直接算新版本成功。人工核对实际版本并修好后用 manual_fix 确认；retry 只再检查。重新部署需新 run。
- 健康检查失败：保留服务和日志供诊断，不自动清理、回滚或重复发布。
- 强制终止仍要求确认遗留进程和状态，随后执行以上核对。

成功验证的是单机 Compose 服务，不等于生产可用性证明。渲染模型有哈希保护，但源码构建上下文、外部环境和镜像标签不是完整不可变制品。审批与执行之间应避免更改这些输入；有迁移、远端发布或回滚需求时先使用现有发布流程。
