> 本文记录0.2.0本地tarball分发。0.3.0正式发布流程见 [npm-publishing.md](npm-publishing.md)，npx用法见 [npm-usage.md](npm-usage.md)。

# npm 安装包与仓库外执行

0.2.0 分发为八个真实 npm tarball。安装后无需 Stagecraft 源码仓库，也没有 Stagecraft 包之间的运行时依赖。当前 scope 暂定、private 保留；尚未上传公共 npm registry，因此请使用 tarball 安装，不要把尚未发布的包名当作可从 registry 下载。

## 包与命令

| 包 | 安装后的命令 | 能力 |
| --- | --- | --- |
| @stagecraft-draft/runner | stagecraft start/test/deploy | PRD、测试、部署完整运行器 |
| @stagecraft-draft/build | stagecraft-build run | 从 PRD 自动开发，可 --until deploy |
| @stagecraft-draft/test | stagecraft-test run | 已有项目 audit/repair，不需要 PRD |
| @stagecraft-draft/deploy | stagecraft-deploy run | 发现/生成部署配置与本机 Compose 发布 |
| @stagecraft-draft/discover | stagecraft-discover init | 独立安装创意判断技能 |
| @stagecraft-draft/spec | stagecraft-spec init | 独立安装规格技能 |
| @stagecraft-draft/design | stagecraft-design init | 独立安装设计技能 |
| @stagecraft-draft/architect | stagecraft-architect init | 独立安装架构技能 |

build/test/deploy 仍支持 init 安装技能。init 不代表自动执行任务；run 才会启动模型与运行器。四个纯技能安装包尚未扩展自动执行入口，不将它们描述成已有自主闭环。

## 安装与使用

```sh
mkdir stagecraft-client
cd stagecraft-client
npm init -y
npm install /absolute/path/stagecraft-draft-runner-0.2.0.tgz
npx --no-install stagecraft --version
npx --no-install stagecraft start --prd /absolute/path/PRD.md \
  --dir /absolute/path/new-app --until deploy
```

运行器返回 runDir、pending.questions 和计划。将明确答案写到 JSON，再继续。例如方案确认 `{"approve_plan":"yes"}`；部署配置确认 `{"approve_setup":"yes"}`。

```sh
npx --no-install stagecraft answer --run /path/to/run --file /path/to/answers.json
npx --no-install stagecraft status --run /path/to/run
npx --no-install stagecraft resume --run /path/to/run
```

单独测试或部署可以放在不同消费目录，只安装各自的包：

```sh
npm install /absolute/path/stagecraft-draft-test-0.2.0.tgz
npx --no-install stagecraft-test run --dir /absolute/path/app --mode repair
# 或者另一个目录只安装部署包
npm install /absolute/path/stagecraft-draft-deploy-0.2.0.tgz
npx --no-install stagecraft-deploy run --dir /absolute/path/app
```

对应命令的 answer/status/resume 使用同一个 runDir。不要通过修改 state.json 跳过确认。Ctrl+C 保存检查点；部署意图已落盘后不会自动重复发布。

## 宿主条件

需要 Node.js 22+、已安装并登录的 Codex CLI。部署需要可用的本机 Docker/Compose 和 Unix socket context。模型执行使用宿主登录，npm 包不包含凭据；应用需要的第三方库仍需要安装或可用缓存。网络与 Docker 不是 Stagecraft 源码依赖。

当前已验证 macOS、Node.js 24、OrbStack。Windows 和远端生产部署未验证。Codex 旧 CLI 与用户配置不兼容时可设置 STAGECRAFT_CODEX_ISOLATED=1；它忽略 CLI 配置，但不绕过登录或沙箱。

## 打包与校验

源码维护者运行：

```sh
npm test
npm run release
# 可选，自定义产物目录
npm run release -- /absolute/path/releases
```

release 先生成独立安装器和嵌入运行器，再 npm pack 八个包；manifest.json 记录版本、文件列表、包大小、SHA-256 与 npm integrity。不执行 npm publish，没有安装时从源码构建的 postinstall 脚本。可使用 --ignore-scripts 安装这些包。

build/test/deploy 的 runtime 是构建时复制的运行器及技能，属于各自 tarball 的文件。包升级需重新构建并验证，现有 run 仍保留原技能快照。技能来源、提交和许可证随包保存。

仓库外演练见 [安装包全链路验证](package-live-drill.md)。
