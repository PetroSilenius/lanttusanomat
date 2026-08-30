import { getLatestArticles } from '@/lib/content'

export const dynamic = 'force-static'

/**
 * Lists the article URLs shown in the homepage listing (featured + tuoreimmat),
 * so the service worker can precache them for offline reading without the
 * visitor having opened each one individually first.
 */
export function GET(): Response {
  return Response.json({ articles: getLatestArticles(7).map((article) => article.url) })
}
