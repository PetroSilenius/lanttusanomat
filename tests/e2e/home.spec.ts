import { expect, test } from '@playwright/test'

test.describe('Home page', () => {
  test('loads with the site branding and satire notice', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Lanttusanomat/)
    await expect(page.getByRole('banner')).toContainText('Lanttusanomat')
    await expect(page.getByRole('banner')).toContainText(/satiiria/i)
  })

  test('shows a featured article and a grid of latest articles', async ({ page }) => {
    await page.goto('/')
    const cards = page.getByTestId('article-card')
    expect(await cards.count()).toBeGreaterThanOrEqual(4)
    await expect(cards.first().getByTestId('satire-badge').first()).toBeVisible()
  })

  test('has working category navigation in the header', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Kategoriat', exact: true })
      .getByRole('link', { name: 'Ruoka' })
      .click()
    await expect(page).toHaveURL(/\/kategoria\/ruoka/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ruoka')
  })

  test('exposes RSS feed and manifest links', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest'
    )
    await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute(
      'href',
      /feed\.xml/
    )
  })

  test('has no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    )
    expect(overflow).toBe(false)
  })
})
