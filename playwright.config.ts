import fs from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against the real production build (out/) served by the same
 * minimal static server used for local preview — so the service worker,
 * caching and clean URLs behave as they do on Cloudflare Pages.
 *
 * Set PLAYWRIGHT_SKIP_BUILD=1 when out/ is already built (CI downloads it).
 */
const PORT = 4173

// Some sandboxes pre-install a Chromium at a fixed path instead of the
// version-specific browser cache Playwright expects. Use it when present
// (never in CI, which installs matching browsers itself).
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const launchOptions =
  !process.env.CI && fs.existsSync(PREINSTALLED_CHROMIUM)
    ? { executablePath: PREINSTALLED_CHROMIUM }
    : {}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    launchOptions,
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_SKIP_BUILD
      ? `node scripts/serve-static.mjs out ${PORT}`
      : `pnpm build && node scripts/serve-static.mjs out ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
