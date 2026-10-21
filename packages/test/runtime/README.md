# @gaaraa/runner

Persistent PRD-to-running-app delivery orchestrator

版本 0.4.1。npm 命令以该版本已实际发布为前提；未发布时从仓库执行 node packages/runner/bin/cli.mjs。

兼容入口：保留旧 Codex runner 和 .stagecraft/runs 检查点。新项目推荐在当前 coding agent 中直接调用各阶段 Skill，无需 runner、嵌套模型或 answers.json。

```sh
npx --yes @gaaraa/runner@0.4.1 resume --run /absolute/path/to/run
```

终端支持直接回答；--json 保留自动化协议。旧 runner 仍需已登录的 Codex CLI，部署范围仍为本机 Compose。

[完整零基础指南](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/npm-usage.md) · [宿主兼容说明](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/agent-compatibility.md)

MIT；第三方方法保留原许可证，见 NOTICE.md。
