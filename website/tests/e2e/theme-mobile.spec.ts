import { test, expect } from '@playwright/test'

test('主题切换持久化，键盘焦点可见，深浅主题有可读对比', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('switch', { name: '切换到深色模式' })
  await toggle.click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('switch', { name: '切换到浅色模式' }).click()
    const contrast = await page.locator('.intro').evaluate(el => {
      const rgb = (s: string) => s.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number)
      const luminance = (v: number[]) => v.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0)
      const foreground = luminance(rgb(getComputedStyle(el).color))
      const background = luminance(rgb(getComputedStyle(document.body).backgroundColor))
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)
    })
    expect(contrast).toBeGreaterThanOrEqual(4.5)
    await page.screenshot({ path: `test-results/home-${theme}.png`, fullPage: true })
  }
  await page.getByRole('link', { name: '开始使用', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '了解工作流程', exact: true })).toBeFocused()
  const outline = await page.getByRole('link', { name: '了解工作流程', exact: true }).evaluate(el => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})

test('手机菜单、文档侧栏、长内容和减少动态效果可用', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'mobile navigation' }).click()
  await page.locator('.VPNavScreen').getByRole('link', { name: '指南', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('什么是 Stagecraft')
  await page.getByRole('button', { name: '文档导航' }).click()
  await page.getByRole('link', { name: '创建需求说明', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('创建需求说明')
  for (const path of ['/', '/guide/requirements.html', '/guide/confirmation.html', '/cli/']) {
    await page.goto(path)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await page.goto('/guide/confirmation.html')
  await page.screenshot({ path: 'test-results/guide-mobile.png', fullPage: true })
  await page.goto('/')
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true })
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
})
