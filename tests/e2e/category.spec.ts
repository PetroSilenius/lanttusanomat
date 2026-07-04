import { expect, test } from '@playwright/test'

test.describe('Category navigation', () => {
  test('category page lists only matching articles', async ({ page }) => {
    await page.goto('/kategoria/liikenne')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Liikenne')
    const cards = page.getByTestId('article-card')
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
    for (const card of await cards.all()) {
      await expect(card).toContainText('Liikenne')
    }
  })

  test('breadcrumb from article leads back to its category', async ({ page }) => {
    await page.goto('/artikkeli/juna-saapui-ajoissa')
    await page
      .getByRole('navigation', { name: 'Murupolku' })
      .getByRole('link', { name: 'Liikenne' })
      .click()
    await expect(page).toHaveURL(/\/kategoria\/liikenne/)
  })

  test('footer links reach every category', async ({ page }) => {
    await page.goto('/')
    const footerNav = page.getByRole('navigation', { name: 'Kategoriat (alatunniste)' })
    await footerNav.getByRole('link', { name: 'Kotimaa' }).click()
    await expect(page).toHaveURL(/\/kategoria\/kotimaa/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kotimaa')
  })

  test('unknown category returns 404', async ({ page }) => {
    const response = await page.goto('/kategoria/olematon')
    expect(response!.status()).toBe(404)
  })
})
