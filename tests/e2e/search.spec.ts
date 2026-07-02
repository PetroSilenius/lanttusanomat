import { expect, test } from '@playwright/test'

test.describe('Search', () => {
  test('finds articles and links to them', async ({ page }) => {
    await page.goto('/haku')
    await page.getByLabel('Hakusana').fill('kahvi')
    const results = page.getByTestId('search-result')
    await expect(results.first()).toBeVisible()
    await expect(page.getByTestId('search-result-count')).toContainText(/tulos/)

    await results.first().getByRole('link').click()
    await expect(page).toHaveURL(/\/artikkeli\//)
  })

  test('supports query via URL parameter', async ({ page }) => {
    await page.goto('/haku?q=työryhmä')
    await expect(page.getByTestId('search-result').first()).toBeVisible()
  })

  test('shows a no-results state', async ({ page }) => {
    await page.goto('/haku')
    await page.getByLabel('Hakusana').fill('xyzzyplugh')
    await expect(page.getByTestId('search-result-count')).toContainText('Ei hakutuloksia')
  })

  test('is reachable from the header on every page', async ({ page }) => {
    await page.goto('/kategoria/urheilu')
    await page.getByRole('banner').getByRole('link', { name: 'Haku' }).click()
    await expect(page).toHaveURL(/\/haku/)
    await expect(page.getByLabel('Hakusana')).toBeVisible()
  })
})
