---
title: CLI 参考
description: Stagecraft 0.3.0 的公开命令、参数、阶段包、答案文件、运行目录与退出码。
---

# CLI 参考

本页面向已经跟过[零基础教程](/guide/)的用户。所有示例固定使用公开 npm 版本 `0.3.0`，需要 Node.js 22+ 与已登录的 Codex CLI。`npx --yes` 只同意下载包，不代表批准开发或部署。

## 包与用途

| npm 包 | 用途 |
| --- | --- |
| `@gaaraa/runner` | 完整运行器，提供 start、test、deploy、status、answer、resume、skills |
| `@gaaraa/build` | 从需求独立进入开发，内置运行器 |
| `@gaaraa/test` | 已有项目测试与修复，内置运行器 |
| `@gaaraa/deploy` | 已有项目本机 Compose 部署，内置运行器 |
| `@gaaraa/discover`、`@gaaraa/spec`、`@gaaraa/design`、`@gaaraa/architect` | 安装对应阶段技能 |

不需要安装全部八个包。**`init` 只安装技能，不会生成完整应用。**

```sh
npx --yes @gaaraa/design@0.3.0 init --agent codex --dir ./my-app
npx --yes @gaaraa/build@0.3.0 run --prd ./PRD.md --dir ./my-app
npx --yes @gaaraa/test@0.3.0 run --dir ./my-app --mode audit
npx --yes @gaaraa/deploy@0.3.0 run --dir ./my-app
```

## runner 命令

以下以公开包的 `--help` 为准。项目路径是示例，运行前替换为自己的目录。

```sh
npx --yes @gaaraa/runner@0.3.0 --version
npx --yes @gaaraa/runner@0.3.0 --help
npx --yes @gaaraa/runner@0.3.0 start --prd ./PRD.md --dir ./my-app
npx --yes @gaaraa/runner@0.3.0 test --dir ./my-app --mode audit
npx --yes @gaaraa/runner@0.3.0 test --dir ./my-app --mode repair --max-repairs 2 --goal "检查温度换算；保持现有框架"
npx --yes @gaaraa/runner@0.3.0 deploy --dir ./my-app
npx --yes @gaaraa/runner@0.3.0 deploy --dir ./my-app --target ./target.json
npx --yes @gaaraa/runner@0.3.0 status --run "$RUN_DIR"
npx --yes @gaaraa/runner@0.3.0 answer --run "$RUN_DIR" --file ./answers.json
npx --yes @gaaraa/runner@0.3.0 resume --run "$RUN_DIR"
npx --yes @gaaraa/runner@0.3.0 skills --dir ./my-app --stack vue,playwright --phase implement
```

`test` 与 `deploy` 不需要 PRD，不会重新进行产品澄清和架构设计。`audit` 不自动修业务代码，但可能在确认后新增测试；项目自己的检查命令也可能生成构建产物。

## 参数

| 参数 | 适用场景及说明 |
| --- | --- |
| `--prd <file>` | start / build run 的需求文件 |
| `--dir <project>` | 项目目录；start 缺目录时创建，测试与部署使用已有项目 |
| `--state-root <dir>` | 指定任务记录存放位置；通常保留默认即可 |
| `--max-repairs 2` | 设置自动修复预算，示例为 2 次；用完后需要人工介入 |
| `--agent-timeout-ms 600000` | Agent 执行超时，单位毫秒；示例为 10 分钟 |
| `--skills <profile.json>` | 自定义技能来源与阶段映射配置 |
| `--stack vue,playwright` | start / test / deploy 显式选择技术方法；skills 可预览匹配 |
| `--until deploy` | start 在构建验证后继续本机部署，仍需确认部署配置与计划 |
| `--mode audit\|repair` | test 选择审计或允许修复业务代码 |
| `--goal <text>` | test / deploy 的具体目标，用引号包住含空格的文字 |
| `--target <file.json>` | deploy 使用已指定的本机 Compose 目标；省略时发现并提出配置 |
| `--run <run-directory>` | status / answer / resume 使用的任务运行目录 |
| `--file <answers.json>` | answer 读取的答案文件 |
| `--phase implement` | skills 预览指定执行阶段的方法 |

## runDir 与答案文件

运行后保存终端输出的 **完整运行目录**。它通常在项目的 `.stagecraft/runs/任务编号` 下；不要将示例编号当成自己的目录。

```sh
RUN_DIR="把这里替换为你的完整运行目录"
npx --yes @gaaraa/runner@0.3.0 status --run "$RUN_DIR"
```

状态是 JSON。`waiting_input` 表示等待输入，`pending.questions` 包含当前问题；`plan` 是待确认方案。`RUN_DIR` 只在当前终端有效。目录内的状态、日志和技能快照用于恢复，不要删除或手动改写。

只有当前问题恰好为 `approve_plan` 时，才使用这个答案：

```json
{"approve_plan":"yes"}
```

需要修改时：

```json
{"approve_plan":"revise:保留中文温度换算，移除数据库。"}
```

保存为 `answers.json`，然后执行上面的 `answer` 命令。答案必须包含当前所有问题 id，值为非空字符串，不添加旧字段。`answer` 保存答案并自动继续，不需要重复 start。普通 `resume` 不会替你回答问题。

- 配置确认：当前询问 `approve_setup` 时，审阅 `setup` 后回答 `yes` 或 `revise:修改要求`。
- 错误介入：当前询问 `resume_action` 时，解决原因后选 `retry`；已手动修好选 `manual_fix`；取消选 `stop`。
- 暂停：按一次 `Ctrl + C`，等待退出，再用同版本 `resume`。
- 完成：阅读运行目录中的 `delivery.md`，按实际启动 argv 和 Smoke URL 打开应用。

完整文件创建操作见[回答问题与确认方案](/guide/confirmation)。

## 常用退出码

| 退出码 | 含义 |
| --- | --- |
| 0 | 成功或 status 查询完成；仍应阅读状态内容 |
| 1 | 无效命令或执行错误 |
| 2 | 正在等待人工输入，不是卡住 |
| 3 | audit 检查发现失败，completed / outcome=failed |
| 130 | 已暂停 |

## 本机部署目标与恢复

目标示例来自直接入口文档，使用前根据自己的 Docker context、Compose 文件和服务端口调整：

```json
{
  "provider": "compose",
  "context": "default",
  "projectName": "my-product-preview",
  "file": "compose.yaml",
  "url": "http://127.0.0.1:43189/health",
  "expectedStatus": 200,
  "bodyIncludes": "ok",
  "timeoutMs": 120000
}
```

仅支持本机 Unix socket 引擎与带显式端口的本地 HTTP。Compose 文件须为项目内相对路径；不支持 SSH context、云发布或公网目标。`projectName` 用于隔离项目。审批时审阅目标、服务、端口与持久化资源，以及运行目录里的 `compose.approved.json`。

部署调用 Compose v2 的 `docker --context ... compose ... up --build --detach --wait`，随后核对 HTTP 和所有服务的 running / healthy 状态。不会推送镜像，也不会自动执行 `down -v`。

- 预检失败：修正后 retry，尚未部署。
- 部署意图落盘后中断：resume 核对服务，不重放 up。
- up 失败或结果未知：健康旧容器不代表新版本成功。人工核对并修好后 manual_fix；retry 只再次检查，重新部署需要新任务。
- 健康检查失败：保留服务和日志，不自动清理、回滚或重复发布。

成功后按 `delivery.md` 的 `Scoped cleanup argv` 清理。仅验证单机服务，不代表生产可用性证明；审批与执行之间应避免改动源码、外部环境或镜像标签。更多步骤见[本机部署](/guide/deployment)。
