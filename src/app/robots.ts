import type { MetadataRoute } from 'next'
import { absoluteUrl, siteConfig } from '@/lib/site'

export const dynamic = 'force-static'

/**
 * AI / LLM crawlers and answer engines. They are explicitly welcomed and given
 * full access — including the client-side `/haku` search UI — so the site's
 * satire can be discovered, cited and answered over. The content is openly
 * licensed satire, so there is no reason to gate it from them.
 */
const llmCrawlers = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Googlebot-News',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'Amazonbot',
  'Bytespider',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'cohere-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Generic crawlers: everything except the client-side search UI, which
      // has no server-rendered content to index.
      { userAgent: '*', allow: '/', disallow: ['/haku'] },
      // LLM crawlers: full access, search UI included.
      { userAgent: llmCrawlers, allow: '/' },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  }
}
