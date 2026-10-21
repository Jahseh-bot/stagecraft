# @gaaraa/spec

需求规格

版本 0.4.0。npm 命令以该版本已实际发布为前提；未发布时从仓库执行 node packages/spec/bin/cli.mjs。

在当前 coding agent 中完成 spec 阶段的执行、验证、修复与交接，无需安装其他阶段包。

```sh
npx --yes @gaaraa/spec@0.4.0 init --agent codex --dir ./my-project
```

然后在 agent 中说：“使用 stagecraft-spec 完成本次任务，自行完成职责内的验证和修复，只在关键阻塞时询问我。”

支持 --agent codex、claude、cursor、copilot、gemini、opencode、generic；也可用 --skills-dir 指定宿主目录。使用 --dry-run 预览；不同内容拒绝覆盖。没有原生 Skills 的宿主可直接读取安装目录里的 SKILL.md。宿主必须有任务所需的文件、执行及验证能力。

统一协议、报告模板和可选 Node.js 22+ 交接脚本随包提供；检查点写到目标项目 .stagecraft/workflows。

[完整零基础指南](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/npm-usage.md) · [宿主兼容说明](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/agent-compatibility.md)

MIT；第三方方法保留原许可证，见 NOTICE.md。
