# Stagecraft 零基础使用指南

## 什么是 Stagecraft

Stagecraft 是一组直接在 coding agent 中使用的阶段技能。你可以把它理解为给 AI 编程助手装上七套完整工作方法：创意、需求、设计、架构、开发、测试、部署。

每个技能都会检查输入、完成本职工作、实际验证、在授权范围内修复，再留下可继续使用的交接记录。你不需要操作 runner，也不需要手写答案 JSON。

## 先了解你将完成什么

第一次可以做一个温度换算网页。安装 build 和 test 技能后，在你正在使用的 agent 中描述需求，要求它实现并测试。常规技术细节由 agent 处理；只有关键业务歧义、权限或环境阻塞才会问你。

0.4.0 是已发布到 npm 的 Skills-first 版本，下面使用 npm 自带的 npx 直接安装技能，无需下载 Stagecraft 源码。0.3.0 为旧版 runner；0.3.1 曾部分发布，仅 architect 已上传，不要将它作为完整新版安装。

安装技能不会自动调用模型，也不会替你购买或配置模型账号。执行时使用当前 coding agent 的账号、额度、工具和权限。

## 准备环境

## 第一步 打开终端

macOS 按 Command + 空格，搜索“终端”并打开；Windows 使用 PowerShell；Linux 打开终端。命令应整行复制，不要把提示符 `$`、`%` 或 `➜` 一起复制。

## 第二步 安装并检查 Node.js

从 [Node.js 官方网站](https://nodejs.org/) 安装 22 或以上版本。安装结束后重新打开终端，执行：

```sh
node --version
```

看到 `v22` 或更高的大版本即可。Node.js 用于安装器和可选交接助手；Skill 主体是 Markdown，不要求使用某个特定模型。

## 第三步 准备 coding agent

打开你已有的 Codex、Claude Code、Cursor、Copilot、Gemini CLI 或 OpenCode，并完成它自身的登录。给 agent 打开目标项目文件夹，让它能按任务需要读写文件、运行命令。

无需为了使用 Stagecraft 单独安装 Codex CLI。其他 agent 没有原生 Skills 功能时，可让它直接读取 SKILL.md；只有纯聊天能力、不能操作文件和验证结果的工具不能完成编码闭环。

## 第四步 检查 npm 和 npx

安装 Node.js 时会同时安装 npm 和 npx。分别执行：

```sh
npm --version
npx --version
```

两条命令都输出版本号即可。若提示找不到命令，先关闭并重新打开终端；仍不行时重新安装 Node.js。

npx 会从 npm 下载指定的 Stagecraft 包并运行安装器。无需安装 Git、克隆源码或全局安装 Stagecraft，也无需登录 npm。首次使用需要联网，`--yes` 表示同意下载指定包。

下一步创建目标项目文件夹，并按照“开始第一个任务”安装技能。安装完成后由你的 coding agent 执行任务。

## 创建需求说明

## 用普通话描述你要的结果

你可以在 agent 会话里直接描述，不强制先写 PRD。需求复杂时，在目标项目新建 `PRD.md` 文本文件，写清楚给谁使用、主要功能、范围和完成标准。

例如：

```md
# 温度换算网页

给普通人使用，中文界面，适配电脑与手机尺寸。
输入摄氏度或华氏度，显示另一种温度，保留一位小数。
支持清空；空值和非法数字显示中文提示。
只在本机运行，不需要账号、数据库、支付或外部 API。
验收：0℃ = 32.0℉；100℃ = 212.0℉；32℉ = 0.0℃。
请实际运行测试，给出本地启动命令和浏览器地址。
```

第一次不要把真实密码、Token、私密业务数据写进需求。需要外部服务时使用宿主已有的凭据机制；敏感值不写进交接报告。

如果需求仍不清楚，可以先安装 `spec` 技能，让 agent 从现有材料补足可验收规则。它只会集中询问真正影响业务含义的缺口。

## 开始第一个任务

## 安装需要的技能

先在电脑上创建一个空文件夹作为目标项目，例如桌面的 `my-app`。复制它的完整路径，将以下命令中的路径替换掉。路径有空格时保留双引号。

在终端任意目录执行以下两条命令。请把示例路径改成刚创建的项目文件夹路径：

```sh
npx --yes @gaaraa/build@0.4.0 init --agent codex --dir "/你的项目完整路径/my-app"
npx --yes @gaaraa/test@0.4.0 init --agent codex --dir "/你的项目完整路径/my-app"
```

使用 Claude Code 将 `codex` 换成 `claude`，Cursor 换成 `cursor`，其他选项见“阶段包与技能安装”。看到“已安装”表示技能文件已放到目标项目。

## 在 agent 中开始工作

在 coding agent 中打开 `my-app`，重新加载技能或重开这个项目会话，然后输入：

```text
使用 stagecraft-build 和 stagecraft-test，按照 PRD.md 做出可运行的温度换算网页并测试。
常规可逆技术选择自行决定，执行测试并修复，不要让我手写 JSON。
把阶段交接记录保存在项目中，完成后告诉我怎样启动和打开网页。
```

如果宿主没有发现技能，明确让它读取安装输出中的 `stagecraft-build/SKILL.md`，并按文件指示工作。不要在系统终端里输入这段自然语言，它是发给 coding agent 的消息。

## 从 PRD 自动完成开发、测试和部署 {#prd-to-deploy}

如果你已经有一份 PRD（产品需求说明），可以让 agent 按 `build → test → deploy` 连续工作。下面的安装命令在系统终端执行；完整提示词则复制到 coding agent 的聊天输入框中。

### 第一步：准备需求和三个技能

1. 在 agent 中打开目标项目文件夹，例如 `my-app`。
2. 把需求文件放进这个文件夹，命名为 `PRD.md`。确认 agent 能读到文件；如果文件名或位置不同，修改下方提示词中的路径。
3. 安装 `stagecraft-build`、`stagecraft-test` 和 `stagecraft-deploy`。前面已经安装 build 和 test 的话，只需在终端补装 deploy：

```sh
npx --yes @gaaraa/deploy@0.4.0 init --agent codex --dir "/你的项目完整路径/my-app"
```

如果你通过 `npx skills add Jahseh-bot/stagecraft` 安装过全部七个技能，就不用再装。安装后重新加载技能或重开项目会话，让 agent 发现新技能。

### 第二步：填写部署目标

复制提示词前，先把其中的 `【替换为你的部署目标】` 改成具体目标，不要保留括号原样发送。例如：

| 你希望怎样使用 | 可以填写的部署目标 | 需要提前准备 |
| --- | --- | --- |
| 先在自己电脑上使用 | 本机 Docker，仅供本机访问 | 安装并启动 Docker；这不会产生公网地址 |
| 发布静态网站 | GitHub 仓库 `你的用户名/仓库名` 的 GitHub Pages | 已有仓库及可用的 GitHub 授权；不适用于需要独立后端的应用 |
| 使用已有托管项目 | 我已登录的 Vercel 项目 `项目名` | 明确账号和项目，并让 agent 能使用相应工具 |
| 发布到自己的服务器 | 服务器 `主机别名` 的 `/srv/my-app`，使用现有 SSH 配置 | 已配置 SSH 访问，明确可以修改的服务和目录 |

请填写你实际拥有或已获授权的目标。密码、Token 等不要写进 PRD 或提示词，按平台自己的登录或凭据配置流程处理。如果暂时不知道部署到哪里，可以先用前面的 build + test 提示词完成开发和测试。

### 第三步：复制给 agent 的完整提示词

将部署目标替换好后，整段复制到 coding agent 的聊天输入框发送：

```text
请使用 Stagecraft Skills，按照当前项目中的 PRD.md，完成开发、测试和部署。

部署目标：【替换为你的部署目标】

请先读取 PRD.md、项目现有说明和相关 Skill，然后依次执行：
1. stagecraft-build：实现需求，实际运行项目并完成自测。
2. stagecraft-test：对照 PRD 独立验收，发现问题后在本次需求范围内修复并重新验证。
3. stagecraft-deploy：部署到上面指定的目标，验证本次部署的版本、访问地址和关键功能。

请在当前 agent 中自动衔接三个阶段，不要在每个阶段结束后询问是否继续。
复用已经确认的需求和决定，不要重复采访我，不要让我手写状态或答案 JSON。
常规、可逆的技术选择自行决定；只有关键业务歧义、缺少凭据、权限不足、
需要付费或可能造成不可逆的数据损失时，才向我说明具体问题并询问。

使用同一个 .stagecraft/workflows 工作流保存验收标准、阶段报告、验证证据和交接记录。
如果测试阶段修改了代码，重新验证相关开发成果，再完成测试并继续部署。
没有实际通过必要验证的阶段，不得标记为完成或直接进入部署。
不要通过删除有效测试、跳过断言或降低验收标准来取得通过。

若某个必需技能、工具或权限不可用，请记录具体阻塞和下一步操作，不要假装完成。
最后告诉我：实现了什么、测试结果、实际访问地址、启动与回滚方法，以及剩余问题。
```

### 第四步：等待执行，处理必要阻塞

自动衔接由当前 agent 按 Skill 协议完成，并不是安装后有一个后台服务一直运行。让会话保持运行；如果 agent 请求平台登录或确实缺少关键业务信息，完成对应操作后让它继续。

中断、换会话或解决阻塞后，在同一个项目中发送：

```text
请读取本项目已有的 Stagecraft 工作流、阶段报告和验证证据，
继续完成 PRD.md 对应的开发、测试和部署任务。
沿用此前确认的需求、部署目标和决定，从中断或阻塞处继续。
不要重做仍然有效的已验证阶段；对变更或过期的证据重新验证。
如果存在多个无法区分的工作流，请说明区别并让我选择。
```

如果 agent 没识别到技能，Codex 用户可以补充：

```text
请先读取 .agents/skills/stagecraft-build/SKILL.md，
再按交接协议读取 stagecraft-test 和 stagecraft-deploy 的 SKILL.md，
完成刚才指定的开发、测试和部署目标。
```

其他宿主请使用安装命令输出的技能路径。最终检查 agent 是否给出了实际验证结果和可访问地址；“代码已生成”或“推送成功”不等于部署验收完成。

## 自主执行与必要确认

## 不再逐阶段审批

明确要求“做到实现和测试通过”，就授权 agent 在该目标内推进。它先查文件、复用已知决定，自行选择常规可逆方案；不会为了每个按钮颜色或函数名字停下来。

关键业务含义不明确、需要本人登录或凭据、超出授权的付费/生产操作，才会在 agent 会话中提问。你直接在同一会话回答即可。

## 什么时候算完成

每个阶段先约定可观察验收条件，保存实际执行或检查证据；不把“计划运行”写成“已经通过”。失败时定位原因、修复并重新验证，默认最多三次有新证据的修复尝试；相同原因连续失败且无新信息时报告具体阻塞。

方案阶段不是单纯生成待办列表：还要核实关键技术约束、验收路径和风险。开发阶段必须实际验证；部署阶段必须检查发布后的目标与版本。

## 保留明确边界

“只审计、不改业务代码”就只审计；“只设计界面”不会自动上线；“本机预览”不会自动创建云服务器。既有授权无需重复确认，新的敏感边界仍遵守宿主和用户要求。

## 恢复与处理失败

## 在同一或另一个 agent 中继续

在新会话打开同一项目，然后说：

```text
读取 .stagecraft/workflows 中与温度换算项目对应的交接记录，继续未完成阶段。
保留已确认需求与我的改动；先检查已有成果和验证是否仍有效，不要重新采访或从头再做。
```

如果有多个同类任务，提供具体工作流目录。agent 无法确定哪个记录对应你的目标时，应只问这个选择问题。

## 上游改动会使旧结果失效

助手记录关键成果和日志的 SHA-256。文件改动或丢失时，相关阶段与后续记录会标为 stale。测试修复了业务代码后，要重新验证并记录构建结果，再完成受影响测试，不能沿用修改前的通过结论。

## 外部阻塞

网络、凭据、目标服务或权限不可用时，agent 应保存已完成动作、具体原因及下一步。必要验证未执行就标为 blocked/partial，不应一直无意义重试。

## 旧 runner 任务

`.stagecraft/runs` 是旧运行器记录，新技能使用 `.stagecraft/workflows`，两者不能混写。旧记录仍可用创建它的 runner 版本恢复。迁移到 Skill 时读取旧记录中的需求和已确认决定作为输入，不自动把旧状态转换为新版已完成记录。

## 查看成果与启动网页

## 找到交付结果

agent 最后应给出成果文件、实际验证结果、启动方法和仍未验证的部分。交接报告通常在目标项目 `.stagecraft/workflows/任务编号/` 下，文件可直接在编辑器里打开。

检查报告里的 AC（验收编号），确认你的每个要求都有对应成果及证据。“completed”只代表本次约定范围完成，不是保证软件没有任何缺陷。

## 打开网页

按 agent 给出的具体启动命令操作。不同项目的命令和端口不同，不要照抄其他项目的地址。例如项目确实提供 `dev` 脚本时：

```sh
npm run dev
```

终端显示本地地址后，用浏览器打开它。逐一试试温度换算、空值、非法输入和清空按钮。测试时临时启动的服务可能已经关闭；交付说明应明确是否需要你重新启动。

不要双击源码 HTML 代替项目启动流程。若启动失败，把错误直接发给当前 agent，让它根据交接记录继续诊断。

## 已有项目测试与修复

## 直接从测试切入

不需要先跑创意、需求、设计和开发阶段。安装 test 技能后，在已有项目中说：

```text
使用 stagecraft-test，检查本次改动，补充必要测试并修复范围内的问题，运行回归。
保留现有测试，不要通过删断言获得通过。记录基线、失败原因、修复和最终证据。
```

只希望得到报告时改成：

```text
使用 stagecraft-test，只审计这个项目，不修改业务代码。
实际运行可用检查，交付缺陷复现步骤、证据和修复建议。
```

“审计完成”可以包含发现的失败，不能写成“产品测试通过”。纯 URL 测试应说明源码检查、内部权限路径等覆盖限制。

## 部署与发布验证

已有 PRD、希望一次完成开发到部署？直接使用[从 PRD 自动衔接的完整提示词](https://jahseh-bot.github.io/stagecraft/guide/first-run.html#prd-to-deploy)，其中包含技能准备、部署目标示例和中断恢复方法。

## 向 agent 说明目标

安装 deploy 技能后，明确目标、权限和你希望公开的内容。例如：

```text
使用 stagecraft-deploy，把这个静态网站部署到我已授权的 GitHub Pages 仓库。
配置后续更新自动发布，等待流水线完成，验证公网地址和关键页面，再给我链接。
```

也可以指定已有服务器、本机服务或其他平台。Skill 按当前 agent 的工具和目标配置执行，不强制 Docker，也不会自动购买资源。

## 完整发布闭环

部署前检查实际版本、测试结果、构建和配置；部署后核对实际运行的修订版本、地址、健康与关键路径。推送成功或旧实例仍健康都不代表本次上线成功。

失败时诊断并在授权范围内修复，必要时按已授权计划回滚并验证。凭据、账单、DNS等必须由你处理的阻塞，会留下具体状态和恢复步骤。不能访问生产环境时不会伪造已发布结论。

旧 runner 的 deploy 命令仍只支持本机 Docker Compose；本页描述的是在当前 agent 中执行的新版 deploy Skill。

## 阶段包与技能安装

## 七个包各司其职

| npm 包 | Skill | 用途 |
| --- | --- | --- |
| @gaaraa/discover | stagecraft-discover | 创意、证据和验证实验 |
| @gaaraa/spec | stagecraft-spec | 需求与可验证规格 |
| @gaaraa/design | stagecraft-design | 体验、界面和交互 |
| @gaaraa/architect | stagecraft-architect | 架构与技术可行性 |
| @gaaraa/build | stagecraft-build | 实现、自测和修复 |
| @gaaraa/test | stagecraft-test | 测试、审计或授权修复 |
| @gaaraa/deploy | stagecraft-deploy | 发布、验证和回滚 |

只装你需要的阶段即可；多阶段连续交付需安装目标范围里的技能。以下每一行是独立安装命令，把路径替换为你的项目完整路径，把 `codex` 替换为下表对应的 agent：

```sh
npx --yes @gaaraa/discover@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/spec@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/design@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/architect@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/build@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/test@0.4.0 init --agent codex --dir "/目标项目路径"
npx --yes @gaaraa/deploy@0.4.0 init --agent codex --dir "/目标项目路径"
```

这些命令通过 npm 下载包，并把技能文件复制到项目的宿主技能目录。仅执行 `npm install @gaaraa/build` 会把包放入 node_modules，不等于完成技能安装；新手建议直接使用上面的 npx 命令。`@gaaraa/runner@0.4.0` 供旧任务恢复使用，直接使用 Skills 不需要安装 runner。

## 使用通用 skills CLI 安装整套技能

也可以通过 [skills CLI](https://github.com/vercel-labs/skills) 直接从 GitHub 安装。此方式需要 Node.js 22.20 或以上版本及 Git。先在终端进入你的目标项目：

```sh
cd "/目标项目路径"
npx skills add Jahseh-bot/stagecraft
```

按界面提示选择技能和 coding agent。只安装开发、测试两个技能到 Codex，可执行：

```sh
npx skills add Jahseh-bot/stagecraft --skill stagecraft-build stagecraft-test --agent codex
```

安装全部七个技能到 Codex：

```sh
npx skills add Jahseh-bot/stagecraft --skill '*' --agent codex
```

正确顺序是 `npx skills add`。通用 CLI 的 agent 名称由它自己定义，例如 Claude Code 使用 `--agent claude-code`，与上方 Stagecraft 安装器的 `--agent claude` 不同。两种安装方式选一种即可；通用 CLI 使用 GitHub 当前版本，固定 npm 0.4.0 则使用上方各阶段命令。

仓库根目录和 release 产物最外层的 `skills/` 都包含七个完整技能，以及各自的引用资料、报告模板、脚本和许可证。源码仍维护在 `packages/<阶段>/skills/`，通过 `npm run build` 自动同步根目录，避免手工维护两份。

## 宿主目录

| --agent | 项目内目录 |
| --- | --- |
| codex / generic | .agents/skills |
| claude | .claude/skills |
| cursor | .cursor/skills |
| copilot | .github/skills |
| gemini | .gemini/skills |
| opencode | .opencode/skills |

其他宿主可用 `--skills-dir "自定义技能目录"`，它与 `--agent` 二选一。通用兜底是让 agent 直接读取 SKILL.md。目录适配经过自动化安装测试，不表示所有宿主和模型都已实机跑过完整任务。

## 预览与冲突

命令末尾加 `--dry-run` 只预览，不写文件。重复安装相同内容安全；发现已有不同内容会拒绝覆盖，先备份自定义修改再决定替换。安装器不会修改你的 AGENTS.md、CLAUDE.md 或全局 agent 配置。

## 故障排查与平台说明

## 常见问题与下一步

| 现象 | 处理 |
| --- | --- |
| 找不到 node | 安装 Node.js 22+，重新打开终端 |
| 找不到 Skill | 检查 --agent 与宿主一致；重载项目；让 agent 直接读取安装后的 SKILL.md |
| npm 下载 0.4.0 返回 404 | 检查包名及版本；若使用镜像源，命令改为 `npx --yes --registry=https://registry.npmjs.org @gaaraa/build@0.4.0 init --agent codex --dir "目标项目路径"` 后重试 |
| 安装提示不同内容 | 原有技能可能被修改；先备份和对比，不强制覆盖 |
| 提示符后输入“是”报错 | 系统终端不是 agent 对话框。新版在 agent 会话直接回答 |
| workflow locked | 检查占用者与进程是否仍运行；不要自动删除活跃锁 |
| 验证工具不可用 | 补充环境或权限；agent 保留 blocked/partial，不能声称通过 |
| 下一 Skill 没安装 | 安装该阶段并读取已有交接，不需重做已完成工作 |

## Windows、macOS 和 Linux

技能主体是通用 Markdown。安装器和助手使用 Node.js 路径 API；终端命令中的项目路径要换成你的系统路径。自动化和真实小任务验证的执行主机是 macOS，不能据此宣称所有操作系统、宿主和工具链都实机验证。

宿主权限和信任提示由宿主控制。Stagecraft 不绕过这些提示，也不提供模型账号、云服务器或数据库凭据。

## 版本与迁移

## 当前版本状态

0.4.0 是已发布到 npm 的 Skills-first 版本。0.3.0 是旧 runner；0.3.1 发布中断，仅 architect 已上传。

推荐固定版本安装，方便团队成员使用相同技能：

```sh
npx --yes @gaaraa/build@0.4.0 init --agent codex --dir "/目标项目路径"
```

检查可用版本可运行 `npm view @gaaraa/build version --registry=https://registry.npmjs.org`。升级时将安装命令中的版本号替换为目标版本。

## 从旧 runner 迁移

保留原 `.stagecraft/runs`，用原版本恢复旧任务，或让当前 agent 读取其中 PRD、决定和报告作为新 Skill 的输入。新工作流写到 `.stagecraft/workflows`，不修改旧 runner 控制状态。

已经安装过同名 Skill 时先备份自定义内容；安装器会拒绝静默覆盖。团队协作时固定技能来源版本，交接中记录版本和实际能力，不把换宿主等同于全部验证仍有效。
