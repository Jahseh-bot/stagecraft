---
title: 版本与迁移
description: Stagecraft Skills-first 零基础教程：版本与迁移。
---

# 版本与迁移

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
