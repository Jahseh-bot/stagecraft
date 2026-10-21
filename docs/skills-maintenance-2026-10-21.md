# Skills 更新与升级记录（2026-10-21）

## 范围与结论

已实际执行 `npm run update-skills` 和 `npm run upgrade-skills`。更新检查覆盖全部 40 项登记方法；候选复查使用 `--max-repos 16`，属于有界搜索，不是全市场的穷尽比较。遇到 GitHub API 限流后重试，并通过公开 Git 核对受阻来源。

最终保留三项替换：

| 方法 | 采纳理由 |
| --- | --- |
| frontend-design | 加入设计方向、实现约束、输出结构、可访问性与性能验证；明确主观设计评分不能证明实际效果。 |
| e2e-testing-patterns | 补充测试前提、失败登录的可观察断言示例、真实集成与模拟边界、首次失败证据和重试局限。 |
| sql-optimization-patterns | 先验证结果正确性再比较性能，说明 EXPLAIN ANALYZE 的实际执行、副作用与代表性数据要求。 |

三项来源均为 `sickn33/agentic-awesome-skills` 的固定提交 `2984de11956e413008c6f98121cd141c499e47a3`，目录在 `plugins/agentic-awesome-skills-claude/skills/` 下。精确链接、许可证和哈希保存在 `packages/runner/skills.profile.json` 与 `tooling/upstream-integrity.json`。

另外，Docker 原来源已改名为上述仓库，更新了规范地址和提交锁，技能正文没有变化。grilling、codebase-design、tdd、diagnosing-bugs 四项补齐许可证分发，属于同版本同步。

本次选择基于原文、目录资源和覆盖审查，没有做真实产品任务的效果对照实验。结构评分与构建通过不等同于实际效果更优。采纳的三方正文保持上游原文，所有分发副本由构建同步。

## 未采纳的替换

第一轮把通用前端设计误匹配为粒子可视化模板，也把 Vue 开发规范误匹配为已安装的调试等互补方法，已整轮恢复并修正规则。

第二轮逐项检查后拒绝以下六项，精确候选版本及理由已写入 `tooling/skill-maintenance.config.json` 的 `rejectedCandidates`，后续不会重复采纳相同版本：

- grilling：候选仅在需求不明确时提问，丢失现有决策树穷尽访谈能力。
- webapp-testing：候选引用了未随包提供的 examples 目录及三个示例。
- vue-best-practices：Markstream 包集成不能替代通用 Vue 开发规范。
- react-best-practices：Markstream beta 集成不能替代 React/Next 性能实践。
- nodejs-backend-patterns：候选丢失现有依赖注入覆盖。
- fastapi-templates：候选缺少现有依赖配置和异步测试指导，覆盖退化未得到补偿。

第二轮整体恢复后，仅将三项通过复核的候选原文重新应用。

## 未更新与受限项

- MongoDB 两项、MySQL、Go、Java 经重试确认已是当前上游提交，其余无变更项保留原版本。
- Vercel React 与 React Native 的默认分支仍为本地锁定的 `063bee94c3f4df8453406c830b0a7df0f2860278`；仓库没有校验器要求的许可证正文，因此没有重新导入。
- Docker REST 请求先遇到仓库改名重定向，随后受配额限制；最终通过公开 Git 克隆、完整目录树、固定提交和许可证核验完成更新。

## 脚本修正

- 有上限地跟随 GitHub 同源重定向，并使用规范仓库名称；拒绝跨站点跳转。
- 同时匹配入口用途和正文，排除已经安装的互补专项方法。
- 支持 YAML 块描述和缩进续行，避免误拒 React Native 等有效入口。
- 保存已评审不适用的精确候选版本，并增加回归测试。

## 本机追溯与恢复

最终应用后全量测试 90 项通过；Skills 审计覆盖 414 个入口、40 项三方来源，错误数为 0。未执行下载候选自带的脚本来为候选评分。

机器报告与备份保存在 `output/skill-maintenance/`，大型备份不提交到仓库：

- `2026-10-21T08-50-22-644Z-6a9d1b68`：全量更新及四项许可证同步。
- `2026-10-21T09-01-22-638Z-bb1dfae6`：受限条目重试。
- `2026-10-21T09-01-56-207Z-bfcd0235`：第一轮候选，已恢复。
- `2026-10-21T09-06-59-577Z-a30ee694`：第二轮候选，已整体恢复。
- `2026-10-21T09-11-49-671Z-reviewed-maintenance`：最终三项替换及 Docker 来源更新，附事务备份、测试与审计日志。

保留本机备份的原工作区可以恢复最终维护：

```sh
npm run update-skills -- --restore 2026-10-21T09-11-49-671Z-reviewed-maintenance
```

若相关文件有后续编辑，恢复命令会拒绝覆盖。此次没有发布 npm。
