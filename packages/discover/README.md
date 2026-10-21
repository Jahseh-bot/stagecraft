# @gaaraa/discover

创意判断

版本 0.4.1。npm 命令以该版本已实际发布为前提；未发布时从仓库执行 node packages/discover/bin/cli.mjs。

在当前 coding agent 中完成 discover 阶段的执行、验证、修复与交接，无需安装其他阶段包。Stagecraft 按任务选择内置方法；请读取 references/methods.md 并实际应用，阶段报告记录具体产物和验证证据。

```sh
npx --yes @gaaraa/discover@0.4.1 init --agent codex --dir ./my-project
```

然后在 agent 中说：“使用 stagecraft-discover 完成本次任务，未确认的关键方向先给方案与推荐理由，等待我选择；确认后自动执行、验证、修复和交接。”

支持 --agent codex、claude、cursor、copilot、gemini、opencode、generic；也可用 --skills-dir 指定宿主目录。使用 --dry-run 预览；不同内容拒绝覆盖。没有原生 Skills 的宿主可直接读取安装目录里的 SKILL.md。宿主必须有任务所需的文件、执行及验证能力。

统一协议、报告模板和可选 Node.js 22+ 交接脚本随包提供；检查点写到目标项目 .stagecraft/workflows。

[完整零基础指南](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/npm-usage.md) · [宿主兼容说明](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/agent-compatibility.md)

MIT；第三方方法保留原许可证，见 NOTICE.md。
