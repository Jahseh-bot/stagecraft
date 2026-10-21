# @gaaraa/discover

创意判断

第一次使用请先阅读 [零基础使用指南](https://github.com/Jahseh-bot/stagecraft/blob/main/docs/npm-usage.md)，从安装工具、编写需求到打开网页逐步操作。

当前版本：0.3.0；scope：@gaaraa。这些命令必须在该版本成功发布后使用；以 registry-verification.json 为上线验证结果。

需要 Node.js >=22、已安装且登录的 Codex CLI。部署还需要可运行的 Docker/Compose；只支持本机 Compose 部署，是否运行业务应用需要的额外环境由项目决定。Codex 调用使用你的账户与额度。


```sh
npx --yes @gaaraa/discover@0.3.0 init --agent codex --dir ./my-app
```

此包只安装该阶段 skills；不会自动运行编码模型。使用 --dry-run 预览安装；支持 --agent codex 或 claude。不同内容不会被静默覆盖。

MIT；第三方技能保留自己的许可证，见 NOTICE.md。
