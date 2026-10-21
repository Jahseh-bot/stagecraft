---
title: 本机部署
description: Stagecraft 0.3.0 零基础教程：本机部署，包含操作步骤、预期结果与注意事项。
---

# 本机部署

## 进阶 在本机部署并保持服务运行

第一次成功打开网页后，再做这一节。部署入口会检查已有项目，提出缺少的 Docker 配置，经你确认后执行本机 Docker Compose 部署。

### 安装 Docker Desktop

Mac 用户打开 [Docker Desktop 官方安装页](https://docs.docker.com/desktop/setup/install/mac-install/)。在“关于本机”查看芯片：Apple M 系列选 Apple silicon，Intel 选 Intel。下载后打开 `.dmg`，将 Docker 拖入“应用程序”，再启动 Docker 并完成界面提示。

等 Docker 启动完成，在终端依次执行：

```sh
docker --version
docker compose version
docker info
```

前两条显示版本号，第三条应能显示服务端信息，而不是无法连接 Docker 的错误。后续部署时保持 Docker Desktop 运行。

### 部署刚才生成的项目

如果之前手动启动的网页占用了准备使用的端口，先在对应终端按 `Ctrl + C` 停止它。接着执行：

```sh
npx --yes @gaaraa/deploy@0.3.0 run --dir "$HOME/stagecraft-practice/my-app"
```

这是一次新的部署任务，会输出新的运行目录。将 `RUN_DIR` 更新为这次的路径，并使用同版本 runner 的 `status` 和 `answer` 命令处理问题。

程序可能询问端口、需要保留的数据等。读清建议后作答；若出现 `approve_setup`，检查 `setup` 里的配置草稿，再用 `{"approve_setup":"yes"}` 确认。之后可能还会出现 `approve_plan`，需另行确认部署方案。每次都以当前问题为准，不要一次提交所有确认字段。

成功后的 `delivery.md` 会给出服务地址和清理命令 `Scoped cleanup argv`。打开该地址检查应用；要停止这次部署，按文件提供的参数列表执行对应的 Docker 命令。不要随意增加删除数据卷的参数，以免删掉要保留的数据。

本机部署需要你的电脑和 Docker 继续运行。当前流程不负责购买域名、发布到云服务器或生成公网访问地址。

如果下一次想从新需求直接走到部署，可以在开始时加上 `--until deploy`：

```sh
npx --yes @gaaraa/runner@0.3.0 start --prd ./PRD.md --dir ./another-app --until deploy
```
