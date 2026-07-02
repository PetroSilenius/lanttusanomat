import { expect, test } from '@playwright/test'

test.describe('Article page', () => {
  test('opens from the home page and shows full transparency labeling (AI article)', async ({
    page,
  }) => {
    await page.goto('/artikkeli/tutkimus-kahvitauko')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('kahvia')
    await expect(page.getByTestId('satire-badge').first()).toBeVisible()
    await expect(page.getByTestId('ai-badge').first()).toBeVisible()
    const disclaimer = page.getByTestId('satire-disclaimer')
    await expect(disclaimer).toBeVisible()
    await expect(disclaimer).toContainText('satiiria')
    await expect(disclaimer).toContainText('tekoälyn')
  })

  test('manual article shows satire badge but no AI badge', async ({ page }) => {
    await page.goto('/artikkeli/espoolainen-loysi-parkkipaikan')
    await expect(page.getByTestId('satire-badge').first()).toBeVisible()
    const header = page.locator('article > header')
    await expect(header.getByTestId('ai-badge')).toHaveCount(0)
  })

  test('navigating from home to an article works', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('article-card').first().getByRole('link').first().click()
    await expect(page).toHaveURL(/\/artikkeli\//)
    await expect(page.getByTestId('satire-disclaimer')).toBeVisible()
  })

  test('has article SEO metadata', async ({ page }) => {
    await page.goto('/artikkeli/tutkimus-kahvitauko')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/artikkeli\/tutkimus-kahvitauko/
    )
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(JSON.parse(jsonLd!)['@type']).toBe('SatiricalArticle')
  })

  test('shows related articles for further reading', async ({ page }) => {
    await page.goto('/artikkeli/tutkimus-kahvitauko')
    await expect(page.getByRole('heading', { name: 'Lue seuraavaksi' })).toBeVisible()
    expect(await page.getByTestId('article-card').count()).toBeGreaterThan(0)
  })

  test('unknown article returns the 404 page', async ({ page }) => {
    const response = await page.goto('/artikkeli/tata-ei-ole-olemassa')
    expect(response!.status()).toBe(404)
    await expect(page.getByText('Sivua ei löytynyt')).toBeVisible()
  })
})
