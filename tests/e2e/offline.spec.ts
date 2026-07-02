import { expect, test, type Page } from '@playwright/test'

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        })
        // If the active worker claimed us before the listener attached:
        if (navigator.serviceWorker.controller) resolve()
      })
    }
    return registration.active?.state
  })
}

test.describe('Offline support', () => {
  test('previously opened article stays readable offline', async ({ page, context }) => {
    await page.goto('/')
    await waitForServiceWorker(page)
    await page.goto('/artikkeli/tutkimus-kahvitauko')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('kahvia')

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('kahvia')
    await expect(page.getByTestId('satire-disclaimer')).toBeVisible()
  })

  test('homepage serves the cached version offline', async ({ page, context }) => {
    await page.goto('/')
    await waitForServiceWorker(page)
    await page.reload() // ensure the controlled page caches the homepage

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('banner')).toContainText('Lanttusanomat')
    expect(await page.getByTestId('article-card').count()).toBeGreaterThan(0)
  })

  test('shows the offline indicator when the connection drops', async ({ page, context }) => {
    await page.goto('/')
    await waitForServiceWorker(page)
    await context.setOffline(true)
    await expect(page.getByTestId('offline-indicator')).toBeVisible()
    await expect(page.getByTestId('offline-indicator')).toContainText('Ei verkkoyhteyttä')

    await context.setOffline(false)
    await expect(page.getByTestId('offline-indicator')).toHaveCount(0)
  })

  test('unvisited pages fall back to the offline page', async ({ page, context }) => {
    await page.goto('/')
    await waitForServiceWorker(page)

    await context.setOffline(true)
    await page.goto('/artikkeli/juna-saapui-ajoissa').catch(() => {})
    await expect(page.getByRole('heading', { name: 'Ei verkkoyhteyttä' })).toBeVisible()
  })
})
