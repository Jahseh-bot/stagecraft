import { test, expect } from '@playwright/test'

test('从首页进入指南，翻页、目录和代码复制都可操作', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('到能运行的应用')
  await page.getByRole('link', { name: '开始使用', exact: true }).click()
  await expect(page).toHaveURL(/\/guide\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('什么是 Stagecraft')
  await page.getByRole('link', { name: /下一篇.*准备环境/ }).click()
  await expect(page).toHaveURL(/\/guide\/preparation\.html$/)
  await page.getByRole('link', { name: '第二步 安装并检查 Node.js', exact: true }).click()
  await expect(page).toHaveURL(/#.*node-js$/)
  const copy = page.getByRole('button', { name: 'Copy Code', exact: true }).first()
  await copy.click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('node --version')
  await page.getByRole('link', { name: /上一篇.*什么是 Stagecraft/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('什么是 Stagecraft')
})

test('顶栏各入口有真实正文，404 可返回首页', async ({ page }) => {
  await page.goto('/')
  for (const [link, heading] of [['工作流程', '从需求到交付，每一步都有依据'], ['CLI 参考', 'CLI 参考'], ['更新记录', '更新记录']]) {
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('link', { name: link, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
  }
  await page.goto('/404.html')
  await page.getByRole('link', { name: '返回首页', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('到能运行的应用')
})
