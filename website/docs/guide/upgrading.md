---
title: 版本与迁移
description: 更新项目里已安装的 Skills，区分 GitHub 源码、npm 版本和仓库维护命令。
---

# 版本与迁移

## 普通用户：更新已安装的 Skills

本教程使用 GitHub 当前版本。先保存产品项目的代码和需求，备份自己改过的技能文件，再在当初安装 Skills 的项目目录运行：

```sh
npx skills check
npx skills update
```

`update` 会检查并更新安装工具登记的 Skills，可能包含你安装的其他来源，阅读输出后确认本次实际更新了什么。更新后重新加载宿主技能或新开项目会话，请 agent 列出读取的 Stagecraft 入口与路径。

这更新的是方法文件，不会自动修改产品代码、批准新成果或重新部署。继续已有任务时，要求 agent 读取原工作流，检查新版方法对当前任务和证据的影响。

## 以前通过 npm 阶段包安装

npm 安装器复制的文件不一定登记在通用 skills CLI 的来源记录中。如果 `npx skills update` 没有识别到 Stagecraft：

1. 记下旧 Skill 目录，备份自己的改动。
2. 把旧的七个 Stagecraft 技能目录移出宿主扫描位置，保留备份；不要删除产品源码或 `.stagecraft`。
3. 在产品项目目录执行[七阶段 npm 0.5.0 安装命令](./packages)，或运行 `npx skills add Jahseh-bot/stagecraft` 选择所需阶段和宿主。
4. 重新加载后核对实际读取路径，避免同时加载项目版与全局旧版。

安装冲突时先比较文件，不盲目强制覆盖。

## 当前版本状态与固定来源

2026-10-22，全部八个 npm 包正在发布 0.5.0，完成后即可安装。0.4.2 包含阶段停顿，但不包含本次全链路联动；0.4.1 及更早版本还缺少阶段停顿修复。请使用 0.5.0 或当前 GitHub Skills；启用关联后的 v3 工作流不能交给旧助手。查看注册表版本：

```sh
npm view @gaaraa/build version --registry=https://registry.npmjs.org
```

团队需要完全复现时，记录所安装的 Stagecraft 提交、来源与安装输出，并使用经团队核验的固定提交副本；不要把持续变化的 main 当成固定版本。固定本次版本可用[七阶段 npm 0.5.0 安装命令](./packages)。npm 安装器不会覆盖不同内容：升级前备份旧技能，将旧目录移出宿主扫描位置后重装；不要删除产品源码和工作流。以后版本以[更新记录](/changelog/)的实际状态为准。

## 维护者：更新 Stagecraft 内置三方方法

`npm run update-skills` 和 `npm run upgrade-skills` 是 **Stagecraft 源码仓库**的维护命令，不是在你的产品项目里运行的通用更新命令。

前者追踪已登记来源，后者搜索替代候选。候选可能评分更高却不适合原职责，仍需要内容复核。详见[三方 Skills 维护](./skill-maintenance)。

## 从旧 runner 任务迁移

旧 `.stagecraft/runs` 保留原样，用创建该任务的版本恢复，或把其中的需求、决定和报告作为新 Skills 输入。新工作流位于 `.stagecraft/workflows`，不能把旧状态文件直接复制进去当作已验收成果。

0.3.0 是旧 runner；0.3.1 曾部分发布，不作为当前完整安装路线。旧命令集中在 [CLI 兼容参考](/cli/#legacy-runner)。
