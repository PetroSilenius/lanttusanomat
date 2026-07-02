import { expect, test } from '@playwright/test'

test.describe('PWA basics', () => {
  test('serves a valid web app manifest', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    const response = await request.get(href!)
    expect(response.ok()).toBe(true)

    const manifest = await response.json()
    expect(manifest.name).toContain('Lanttusanomat')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.lang).toBe('fi')

    const purposes = manifest.icons.map((icon: { purpose?: string }) => icon.purpose)
    expect(purposes).toContain('any')
    expect(purposes).toContain('maskable')
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  test('manifest icons actually exist', async ({ page, request }) => {
    await page.goto('/')
    const manifest = await (await request.get('/manifest.webmanifest')).json()
    for (const icon of manifest.icons) {
      const response = await request.get(icon.src)
      expect(response.status(), `icon ${icon.src}`).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
    }
  })

  test('registers a service worker', async ({ page }) => {
    await page.goto('/')
    const scope = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready
      return registration.scope
    })
    expect(scope).toContain('localhost')
  })

  test('has iOS installability metadata and theme color', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/icons/apple-touch-icon.png'
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#4a1d6e')
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/
    )
  })
})
