# 安装包仓库外验证

验证日期：2026-10-21。发行版本 0.2.0，八个 tarball 位于 output/releases/0.2.0，manifest.json 包含文件列表与哈希。并未上传公共 registry。

独立演练目录为 `/Users/curveslink/stagecraft-acceptance/2026-10-21`，不在源码仓库内。三个 consumer 各仅安装一个 tarball：runner-client、test-client、deploy-client。npm install 使用 --ignore-scripts，无安装时构建，无兄弟包依赖。installation-evidence.json 记录真实安装位置、bin 目标与校验结果。

## 环境隔离

最初的外层 sandbox-exec 能验证源码读访问返回 EPERM，但 macOS 不允许 Codex 编码子进程再次施加沙箱，因此没有将这一失败算作应用交付。改用 run-without-source.sh：每条运行器命令前将源码目录权限暂设 000，确认读取返回 EACCES，然后使用正常 Codex 沙箱执行已安装命令；退出时通过 trap 恢复原 755 权限。使用互斥目录避免并发权限恢复。源码不可读期间，运行器、Codex 子进程、应用测试和 Docker 构建只能使用消费目录中的安装资源和应用文件。

这一权限隔离是本机验收手段，安装用户不需要修改任何源码权限。Node/Codex/Docker 是明确宿主条件，不是源码依赖。技能库、profile、schema、运行器代码都来自 tarball。

## 真实应用与记录

新的 PRD 是中文包裹运费报价器：Node 24 原生 HTTP、整数克与整数分计费、原生前端、Node 内置测试，无第三方应用依赖。烟测端口43201，部署端口43202，Compose项目stagecraft-package-acceptance。它不复用之前 Vue 示例的代码、数据库或部署配置。

PRD run：`runs/95335980-7862-42fd-82ee-196e7382cb43`。业务契约明确，因此澄清阶段直接通过；验收方案另行审阅确认。macOS 嵌套沙箱故障和一次服务429保留在运行日志里，恢复不重走PRD。

## 包级回归

46/46 通过。新增三个测试分别把 build/test/deploy 打成 tarball，在临时目录单独 npm install，确认 runner 兄弟包不存在、版本正确、技术栈技能选择正确、执行入口能建立正确类型的 run，并从包内文件生成完整38项技能快照。既有阶段安装、测试修复、暂停恢复、部署配置生成与健康检查回归保持通过。

## 最终交付结果

PRD run 最终 completed/passed。运行器生成应用，通过首轮24项测试，自动发现缺少部署配置并提出部署方案。安装后的 deploy 包接续同一 PRD run，生成 Dockerfile、.dockerignore、compose.yaml，经方案确认后执行真实 Docker 构建、Compose up 与持续健康验证。

独立 test 包从已有项目直接开始，run `aa4c028b-04f2-448e-99f2-8ff955b74a85`：发现数组 zone 被隐式转换接受、null 根输入返回500的真实缺陷。先新增4项测试，记录失败，再自动修复1轮，28/28通过；原有两个验收文件哈希不变。没有人工注入故障。

浏览器验证又发现1.001公斤因浮点换算被前端拒绝。独立 test run `54b1b5ad-1d93-4cd2-9808-70fbb7b0d119` 新增2项测试，执行真实 app.js 提交处理器（最小 DOM/FormData/fetch stub，不复制换算实现），覆盖有效转换和非法输入；先失败，再自动修复1轮，最终30/30通过。

独立 deploy run `ead7e3ea-88bd-46af-8771-ccd323e95727` 直接从现有项目与目标开始，不经过PRD。预检、全部30项测试、重新构建与部署、健康验证均通过。浏览器最终验证1.001公斤本地报价¥10.00、偏远报价¥23.00，截图见外部目录 deployed.png。

真实 HTTP 验证覆盖HTML、健康、5个正确报价、6个非法请求与JSON404。外部 http-evidence.json、repair-evidence.json、acceptance-summary.json 和各run的state/attempts保存证据。服务位于 http://127.0.0.1:43202/ ，Compose app running/healthy；仅本机部署，不代表公网生产验收。

演练包含方案与配置确认，以及两次暂时的Codex429重试；检查点保留，未从头重建。澄清阶段因PRD已经明确，没有额外必答问题。编码、回归补齐和修复由安装包调用真实Codex完成，未手工补写应用代码。运行结束后源码权限恢复755、隔离锁释放。

## 能力边界

runner/build/test/deploy 为可执行闭环入口，其中三个阶段包嵌入运行器而不依赖兄弟包；discover/spec/design/architect 目前仍为独立 skills 安装包。38项技能资源随包分发，按阶段和技术栈选择。本次新应用验证Node栈；不把单个示例当作所有技术栈都已验收。

交付为0.2.0 npm tarball，未公共发布。宿主仍需Node22+、登录后的Codex CLI，部署还需Docker/Compose；示例本身要求Node24。
