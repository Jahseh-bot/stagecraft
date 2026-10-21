# 自动生成部署配置

已有项目可以只指定目录：

```sh
npm run stagecraft -- deploy --dir /absolute/project
```

可补充 `--goal "只在本机预览，使用某个端口"`；也可提供 `--target target.json` 固定部署目标。如果指定的 Compose 文件不存在，会先进入配置生成。

流程为 deploy_discover → 关键问题/配置确认 → deploy_prepare → deploy_plan → 发布确认 → deploy → deploy_verify。

- discover 只读查看清单、锁文件、入口、健康路由、现有配置，使用 docker-expert 提出完整配置草稿和仓库依据。没有目标时同时建议 context、项目名、端口和健康检查。缺少部署事实时只问当前阶段必要问题；不要求 PRD，不重选应用架构。
- 关键问题通过普通 answer 文件回答；具体配置写入 run/deployment-setup.json，使用 `{"approve_setup":"yes"}` 确认，或 `{"approve_setup":"revise:修改要求"}` 重新生成草稿。
- 运行器独占创建缺失文件，保留现有文件。支持根目录 Dockerfile、.dockerignore 与常用 Compose 文件名。写入意图先落盘，中断后仅接受与批准内容一致的已写文件，否则停止，避免覆盖人工修改。
- 生成后进入既有部署计划审查。批准 `{"approve_plan":"yes"}` 后，运行真实预检、容器构建、启动和健康观测。生成文件哈希在计划和发布前核对。
- 模型不直接写配置或部署。用户看到的是完整可审阅的文件内容，不是空泛的“允许部署吗”。

当前仅本机 Compose / 本地 HTTP 服务。自动识别依靠 Agent 阅读项目，不承诺任意技术栈都能无修改容器化。多 Dockerfile、自定义文件位置、数据库迁移、外部服务凭据和原生移动端商店发布需要人工处理；遇到未确定条件会停在问题或错误检查点，不会伪报完成。

## 实际演练

项目 `output/auto-deploy-converter` 起始只有原有 Node 源码、页面、测试和 package.json，没有 Dockerfile、Compose、.dockerignore，也没有 target JSON。

run：`output/entry-runs/182b8336-81ec-484a-9cd1-a357dcb20423`。

使用真实 Codex 识别 Node ESM、启动参数和 /health 合约，返回三份配置；演练范围已指定 orbstack、隔离项目名与端口，因此无须重复询问这些事实。通过标准 CLI 分别确认 setup 与 plan，真实 Docker 构建和健康检查通过，最终 completed/outcome=passed。服务保持运行于 http://127.0.0.1:43191/ 。

关键问题分支、拒绝覆盖、写入断点恢复由真实文件系统回归测试覆盖；此真实样例没有业务歧义，不将无必要的问答作为成功标准。

清理演练服务：

```sh
docker --context orbstack compose -p stagecraft-auto-drill \
  -f /Users/curveslink/workspace/stagecraft/output/auto-deploy-converter/compose.yaml down
```
