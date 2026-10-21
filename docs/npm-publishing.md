# npm 正式发布流程

本仓库已具备公共包发布配置，但本次 owner scope 为 @gaaraa，npm CLI 用户 gaaraa；后续维护者需具备该scope的发布权限和有效登录。仓库为 Jahseh-bot/stagecraft，GitHub Actions 已启用。不要把本地 dry-run 等同于已上线。

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

`npm run release` 自动更新当前 scope/version 对应的包 README；docs/npm-usage.md 与官网教程需同步维护。`output/releases/<version>/manifest.json` 记录八个包的文件清单、SHA256、npm integrity；`publish-results.json` 保存逐包结果；`registry-verification.json` 验证公共registry的完整性，并在仓库外使用独立缓存执行全部八个包的 npx 入口。

预检先校验清单、哈希与公开包元数据，再使用 `npm pack <tarball> --dry-run --json` 本地验证原始 tarball。这样已发布版本的后续 CI 不会被 npm 的“禁止重复发布”检查误判。正式发布仍查询 registry 并拒绝覆盖不同字节。

首次发布可能要求 npm 2FA/网页验证，应在自己的终端完成。脚本不收集凭据。dry-run 不验证scope所有权，也不能证明实际发布权限。

## 发布重试与版本规则

发布前检查全部tarball内容哈希和metadata，查询已有同名同版本。已存在且integrity相同可跳过；不同则终止，必须使用新版本。八包发布不是原子事务：中途失败后保留原目录与tarball，使用同一个目录重跑，例如 `npm run release:publish -- output/releases/0.3.0`。不要重新打包已部分发布的版本。脚本不自动删除包或覆盖版本。

按 SemVer：修复用patch，新增兼容能力用minor，不兼容CLI/检查点变化需明确记录。0.x阶段的破坏性变化使用minor并说明迁移。npm同名同版本不能重新使用，即使撤包也不能复用；遇到坏版本发布修复版本并按需人工调整dist-tag。

## CI 与后续可信发布

`.github/workflows/release-check.yml` 在push/PR/manual运行Node24回归、打包和publish dry-run，并上传审核产物，不含长期token，也不会自动发布。首次本地发布和真实GitHub仓库建立后，可在每个npm包的设置配置可信发布者（准确的owner/repository/workflow）；之后再启用OIDC发布工作流。当前尚未配置 OIDC 自动发布。

发布验证不替代真实模型回归：registry验证检查下载、完整性与CLI启动；自动开发/修复/部署另用 docs/package-live-drill.md 的外部演练流程验证，需要已登录的Codex和Docker。

参考：[npm publish](https://docs.npmjs.com/cli/commands/npm-publish/)、[公共 scoped 包](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)、[可信发布](https://docs.npmjs.com/trusted-publishers/)。

## 2026-10-21 发布验收状态

- npm CLI 11.19.1，登录账号gaaraa，八个正式包名均无已有包冲突。
- 48项回归通过；八个0.3.0 tarball完成npm publish --dry-run。
- 首包@gaaraa/architect实际发布返回E403，明确要求2FA；npm profile确认tfa=false。未发布任何包，尚不能从公共registry运行npx。
- 首次发布时需要启用账号2FA后在交互式终端执行 `npm run release:publish`，按npm提示完成验证；然后执行 `npm run verify:registry`。保持 output/releases/0.3.0 内正式tarball不变。

### 2FA完成后的实际发布

2026-10-21，账号重新登录并完成浏览器发布授权后，八个 @gaaraa/* 0.3.0 均返回发布成功；npm access确认公共访问，dist-tag latest为0.3.0。详见 output/releases/0.3.0/publish-results.json。初始下载查询出现短暂404，验证脚本对registry传播延迟作有限重试，不重新发布或修改已上传tarball。

### 最终公共registry验收通过

八包全部从registry下载，完整性与原始tarball相同；直接运行 `npx @gaaraa/<stage>@0.3.0`，没有使用本地tgz。外部目录：`/private/var/folders/9c/v5n7xq8s7rsbv5c1x6l_j_v00000gn/T/stagecraft-public-f8o8Co`，其中cache为新建独立缓存。architect/design/discover/spec真实安装Codex技能，runner/build/test/deploy检查版本与Vue/Postgres技能路由，全部通过。

原始记录：output/releases/0.3.0/registry-verification.json。此次发布验收没有重新执行完整PRD模型开发与Docker链路；该链路的先前真实验收见docs/package-live-drill.md，本次另有48项包级回归。

macOS临时目录的 /var 为符号链接，安装器会拒绝含符号链接的目标路径；验收脚本已使用realpath解析出的 /private/var 路径。公共registry最初返回404，有限重试后全部可用。

## 0.4.0 Skills-first 发布验收

2026-10-21，八个 `@gaaraa/*@0.4.0` 从原始 tarball 发布成功。公共 registry 元数据与下载入口经历传播延迟后，`npm run verify:registry` 全部通过：八包完整性一致、真实 npx 执行成功；七个阶段均安装到独立项目，校验 Skill、协议和交接助手，旧 runtime 包还校验版本与技能路由。

记录保存在 `output/releases/0.4.0/publish-results.json` 和 `registry-verification.json`。根目录及 release 目录的 `skills/` 为额外分发产物，没有修改已经发布的 npm tarball。`npx skills add Jahseh-bot/stagecraft --skill '*' --agent codex --copy --yes` 已从 GitHub 在独立目录实际安装七个阶段。

## 0.4.1 重新打包与公共安装验收

2026-10-21，账号 gaaraa 完成 npm 网页安全验证后，八个 @gaaraa/*@0.4.1 包从重新构建的原始 tarball 全部发布成功。包含七阶段评审协议、内置测试用例设计、详细阶段指引和最新复核后的三方方法；兼容 runner 同步版本。发布前 90 项回归通过、414 个入口的 Skills 审计无错误，八包打包预检通过。

发布使用 output/releases/0.4.1，保留了最外层 skills/ 完整目录、manifest.json、publish-results.json。旧未发布构建备份在 output/releases/0.4.1-before-final-npm-release，没有改动先前已经发布的版本。

公共 registry 经历元数据与 tarball 的短暂 404；没有重复发布或修改 tarball。为优先验证已传播的包，以相同清单的重排副本执行 verify:registry，最终八包全部完成完整性核对与真实 npx 执行，七个阶段安装到独立项目并检查协议和交接助手。最终结果归档至 output/releases/0.4.1/registry-verification.json。验证使用仓库外的独立缓存，不是本地 tarball 安装。

这次验证覆盖包分发、CLI 和 Skills 安装，并未额外重复真实产品从 PRD 到云部署的模型任务。README、官网和更新记录同步标明 0.4.1 已发布，提供固定版本安装方式。

## 0.4.2 阶段停顿修复发布

八个 @gaaraa/*@0.4.2 已从 output/releases/0.4.2 的固定 tarball 发布成功，包含“展示成果后结束本轮，后续真实回复通过后才进入下一阶段”的七阶段协议。最外层 skills/、manifest.json 和逐包 publish-results.json 一并保留；不覆盖 0.4.1 制品。

发布前 91 项回归、414 个入口 Skills 审计、八包打包预检通过。七个阶段 tarball 已逐一确认包含强制阶段停顿规则；官网四项检查和七项浏览器测试通过，Pages 基路径构建通过。公共安装验证另由 verify:registry 执行并记录，不以发布命令成功代替安装验收。
