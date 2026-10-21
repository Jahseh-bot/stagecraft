---
title: 版本与迁移
description: Stagecraft Skills-first 零基础教程：版本与迁移。
---

# 版本与迁移

## 当前版本状态

0.4.0 是 Skills-first 重构，源码可用；npm 发布状态以 registry 实际版本为准。0.3.0 是旧 runner；0.3.1 发布中断，仅 architect 已上传。

0.4.0 全部发布完成后，才可使用例如以下的固定版本安装：

```sh
npx --yes @gaaraa/build@0.4.0 init --agent codex --dir "/目标项目路径"
```

暂时不要假定这个 npm 命令已经可下载。当前可用方式见“准备环境”和“开始第一个任务”。

## 从旧 runner 迁移

保留原 `.stagecraft/runs`，用原版本恢复旧任务，或让当前 agent 读取其中 PRD、决定和报告作为新 Skill 的输入。新工作流写到 `.stagecraft/workflows`，不修改旧 runner 控制状态。

已经安装过同名 Skill 时先备份自定义内容；安装器会拒绝静默覆盖。团队协作时固定技能来源版本，交接中记录版本和实际能力，不把换宿主等同于全部验证仍有效。
