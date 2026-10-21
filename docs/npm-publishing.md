# npm 正式发布流程

本仓库已具备公共包发布配置，但本次 owner scope 为 @gaaraa，npm CLI 用户 gaaraa；后续维护者需具备该scope的发布权限和有效登录。当前没有连接 Git remote；工作流文件只有在推送到 GitHub 后才会运行。不要把本地 dry-run 等同于已上线。

## 首次发布

1. 在 npm 创建或使用自己有写权限的用户/组织 scope；在本机执行 `npm login --registry=https://registry.npmjs.org`，再执行 `npm whoami --registry=https://registry.npmjs.org`。不把 token、OTP 写入仓库或聊天。
2. `npm run release:scope -- @你的scope`。八个包保持 `/runner`、`/build`、`/test`、`/deploy`、`/discover`、`/spec`、`/design`、`/architect` 后缀。若这些名称已有其他项目占用，先换 scope，不接管无关包。
3. `npm run release:version -- 0.3.0`。八个包同步版本；根 workspace 永远 private。版本变更后更新 CHANGELOG.md。稳定版使用 latest；如 `0.3.0-beta.1` 使用 next。
4. 执行下面的发布检查、打包、预演及发布。发布器仅上传已生成的 tarball，不在上传过程中重新构建。

```sh
npm test
npm run release
npm run release:publish -- --dry-run
npm run release:publish
npm run verify:registry
```

`npm run release` 自动更新当前 scope/version 对应的包 README 与 docs/npm-usage.md。`output/releases/<version>/manifest.json` 记录八个包的文件清单、SHA256、npm integrity；`publish-results.json` 保存逐包结果；`registry-verification.json` 验证公共registry的完整性，并在仓库外使用独立缓存执行全部八个包的 npx 入口。

首次发布可能要求 npm 2FA/网页验证，应在自己的终端完成。脚本不收集凭据。dry-run 不验证scope所有权，也不能证明实际发布权限。

## 发布重试与版本规则

发布前检查全部tarball内容哈希和metadata，查询已有同名同版本。已存在且integrity相同可跳过；不同则终止，必须使用新版本。八包发布不是原子事务：中途失败后保留原目录与tarball，使用同一个目录重跑，例如 `npm run release:publish -- output/releases/0.3.0`。不要重新打包已部分发布的版本。脚本不自动删除包或覆盖版本。

按 SemVer：修复用patch，新增兼容能力用minor，不兼容CLI/检查点变化需明确记录。0.x阶段的破坏性变化使用minor并说明迁移。npm同名同版本不能重新使用，即使撤包也不能复用；遇到坏版本发布修复版本并按需人工调整dist-tag。

## CI 与后续可信发布

`.github/workflows/release-check.yml` 在push/PR/manual运行Node24回归、打包和publish dry-run，并上传审核产物，不含长期token，也不会自动发布。首次本地发布和真实GitHub仓库建立后，可在每个npm包的设置配置可信发布者（准确的owner/repository/workflow）；之后再启用OIDC发布工作流。当前不虚构GitHub URL或声称OIDC已接通。

发布验证不替代真实模型回归：registry验证检查下载、完整性与CLI启动；自动开发/修复/部署另用 docs/package-live-drill.md 的外部演练流程验证，需要已登录的Codex和Docker。

参考：[npm publish](https://docs.npmjs.com/cli/commands/npm-publish/)、[公共 scoped 包](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)、[可信发布](https://docs.npmjs.com/trusted-publishers/)。

## 2026-10-21 发布验收状态

- npm CLI 11.19.1，登录账号gaaraa，八个正式包名均无已有包冲突。
- 48项回归通过；八个0.3.0 tarball完成npm publish --dry-run。
- 首包@gaaraa/architect实际发布返回E403，明确要求2FA；npm profile确认tfa=false。未发布任何包，尚不能从公共registry运行npx。
- 启用账号2FA后在交互式终端执行 `npm run release:publish`，按npm提示完成验证；然后执行 `npm run verify:registry`。保持 output/releases/0.3.0 内正式tarball不变。
