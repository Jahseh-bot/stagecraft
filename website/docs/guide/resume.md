---
title: 暂停、恢复与处理失败
description: Stagecraft 0.3.0 零基础教程：暂停、恢复与处理失败，包含操作步骤、预期结果与注意事项。
---

# 暂停、恢复与处理失败

## 第九步 暂停后继续或处理失败

### 主动暂停后继续

按 `Ctrl + C` 后，等程序退出。下次打开终端，重新设置 `RUN_DIR`，然后运行：

```sh
npx --yes @gaaraa/runner@0.3.0 resume --run "$RUN_DIR"
```

`resume` 接着已有任务继续。不要删除项目里的 `.stagecraft` 文件夹，它保存恢复所需的记录。

### 遇到需要处理的错误

如果当前问题是 `resume_action`，先阅读错误和日志路径，解决原因后再选择操作。例如恢复网络或完成 Codex 登录后，可创建：

```sh
cat > answers.json <<'EOF_ANSWERS'
{"resume_action":"retry"}
EOF_ANSWERS
```

再执行 `answer` 命令。`retry` 表示重试；`manual_fix` 表示你已经手动处理了实现或部署问题，需要程序重新检查；`stop` 表示取消本次任务。只在当前确实询问 `resume_action` 时使用这些答案。

修复预算用完时，不要反复提交 `retry`。查看具体失败、请有经验的人协助修复，再根据程序当前问题决定下一步。普通 `resume` 不会自动替你回答待处理的问题。
