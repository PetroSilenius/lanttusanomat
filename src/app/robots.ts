import type { MetadataRoute } from 'next'
import { absoluteUrl, siteConfig } from '@/lib/site'

export const dynamic = 'force-static'

/**
 * Open the whole site to every crawler, LLM / answer engines included — the
 * wildcard rule already covers them, so no per-bot allowlist is needed. The
 * `/haku` search UI is left crawlable too; its page carries a `noindex` meta
 * robots tag, which keeps the empty search shell out of the index without
 * blocking navigation.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  }
}
