import { getAllArticles } from '@/lib/content'
import { buildRssFeed } from '@/lib/seo'

export const dynamic = 'force-static'

export function GET(): Response {
  const feed = buildRssFeed(getAllArticles())
  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
