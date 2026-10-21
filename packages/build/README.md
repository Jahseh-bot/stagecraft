# @gaaraa/build

Standalone PRD delivery runner and build skills

当前候选版本：0.3.0；scope：@gaaraa。这些命令必须在该版本成功发布后使用；以 registry-verification.json 为上线验证结果。

需要 Node.js >=22、已安装且登录的 Codex CLI。部署还需要可运行的 Docker/Compose；只支持本机 Compose 部署，是否运行业务应用需要的额外环境由项目决定。Codex 调用使用你的账户与额度。


```sh
npx --yes @gaaraa/build@0.3.0 run --prd ./PRD.md --dir ./my-app
```

## 从任意入口开始

```sh
# PRD → 方案确认 → 编码 → 测试修复 → 部署配置确认 → 本机部署
npx --yes @gaaraa/runner@0.3.0 start --prd ./PRD.md --dir ./my-app --until deploy

# 已有项目：只测试并修复，不需要 PRD
npx --yes @gaaraa/test@0.3.0 run --dir ./my-app --mode repair

# 已有项目：识别栈、生成缺失配置、确认后部署
npx --yes @gaaraa/deploy@0.3.0 run --dir ./my-app

# 单独从开发阶段启动
npx --yes @gaaraa/build@0.3.0 run --prd ./PRD.md --dir ./my-app
```

`--yes` 只跳过 npm 下载确认，不跳过运行器的方案/部署确认。每个可执行阶段包都内置运行器，不需要安装 runner 包。其余 discover/spec/design/architect 目前提供 skills 安装入口：

```sh
npx --yes @gaaraa/design@0.3.0 init --agent codex --dir ./my-app
```

## 确认、人工介入与恢复

运行器输出 runDir、pending.questions 和计划。根据实际问题 ID 创建 answers.json，例如方案确认是 `{"approve_plan":"yes"}`；部署配置通常为 `approve_setup`，应以实际输出为准。

```sh
npx --yes @gaaraa/runner@0.3.0 status --run /absolute/path/to/run
npx --yes @gaaraa/runner@0.3.0 answer --run /absolute/path/to/run --file ./answers.json
npx --yes @gaaraa/runner@0.3.0 resume --run /absolute/path/to/run
```

answer 保存回答并自动继续。Ctrl-C 暂停后可 resume；执行错误需要按 pending 的恢复问题回答，不能假定 resume 会自动解决错误。修复有次数上限，达到上限会请求人工介入。test/deploy 包也提供 answer/status/resume，可接续同版本记录。退出码：0成功，2待输入，3审计发现失败，130暂停，1命令错误。

技能随包固定版本分发，按阶段及技术栈匹配；可使用 `--stack vue,postgres` 显式选择。不会在执行中悄悄更新上游 skills。

## 升级与排障

建议固定版本以复现运行；新项目可使用 @latest。继续旧 run 时保留原版本，不保证跨版本检查点迁移。若 npm 返回404，先确认正式scope、版本和发布结果；若Codex认证失败，先在终端运行 codex 完成登录。若Docker不可用，先启动Docker并确认上下文。包安装不提供模型凭据、云服务器或数据库账户。


MIT；第三方技能保留自己的许可证，见 NOTICE.md。
