import { test, expect } from '@playwright/test'
for (const term of ['安装', '暂停', 'Docker']) {
  test(`本地搜索“${term}”返回真实文档并可打开`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '搜索文档' }).click()
    const search = page.getByRole('searchbox')
    await search.fill(term)
    const results = page.locator('.VPLocalSearchBox a')
    await expect(results.first()).toBeVisible()
    // A body match may display only the section heading in compact results.
    await expect(results.first()).not.toHaveText('')
    const href = await results.first().getAttribute('href')
    expect(href).toMatch(/^\/(guide|cli|workflow|changelog)\//)
    await results.first().click()
    await expect(page).toHaveURL(new RegExp(href!.split('#')[0]))
    await expect(page.getByRole('main')).toContainText(new RegExp(term, 'i'))
    await expect(search).not.toBeVisible()
  })
}
