# Stagecraft 官网

公网地址：https://jahseh-bot.github.io/stagecraft/

官网源码放在主仓库的 `website/` 目录，使用 npm 发布的 `@gaaraa/runner@0.3.0` 生成，基于 Vue 3 和 VitePress。

## 本地修改与预览

安装 Node.js 22 或以上版本，在仓库根目录打开终端，依次运行：

```sh
cd website
npm ci
npm run dev
```

打开终端显示的本地地址。修改 `docs/` 内的 Markdown 即可更新教程；首页组件在 `docs/.vitepress/theme/`，导航在 `docs/.vitepress/config.ts`。

## 自动发布

将 `website/**` 的修改提交并推送到 `main`，GitHub Actions 的 **Deploy website** 会自动安装依赖、构建、检查所有页面链接并部署 GitHub Pages。修改 `.github/workflows/website.yml` 也会触发；其他项目文件的修改不会触发官网部署。也可在 Actions 页面手动点击 Run workflow。

在仓库 Settings → Pages 中将 Source 设置为 GitHub Actions。无需 Token 或服务器。

部署使用 `SITE_BASE=/stagecraft/`，保留 `.html` 页面后缀，确保直接打开或刷新教程地址正常。

## 本地验证

```sh
npm run build
node --test tests/*.test.mjs
npm run test:e2e
```

生产子路径构建检查（macOS/Linux）：

```sh
SITE_BASE=/stagecraft/ npm run build
SITE_BASE=/stagecraft/ node --test tests/*.test.mjs
```

`npm run preview` 可预览默认根路径构建。浏览器测试需要已安装 Chrome，或先运行 `npx playwright install chromium`。
