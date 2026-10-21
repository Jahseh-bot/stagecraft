---
title: 阶段包与技能安装
description: Stagecraft 0.3.0 零基础教程：阶段包与技能安装，包含操作步骤、预期结果与注意事项。
---

# 阶段包与技能安装

## 进阶 其他阶段包有什么用

| 包 | 什么时候使用 |
| --- | --- |
| `runner` | 从需求开始，完成开发、测试，按需继续部署；新手从这里开始 |
| `build` | 单独从需求进入开发，`run --prd ./PRD.md --dir ./my-app` |
| `test` | 对已有项目测试或修复 |
| `deploy` | 对已有项目进行本机 Compose 部署 |
| `discover`、`spec`、`design`、`architect` | 安装对应阶段的技能文件，供支持这些技能的工具使用 |

例如安装设计技能：

```sh
npx --yes @gaaraa/design@0.3.0 init --agent codex --dir ./my-app
```

`init` 只安装技能，不会单独生成完整应用。`runner/build/test/deploy` 已包含所需运行器和方法资源，不用把所有阶段包安装一遍。
