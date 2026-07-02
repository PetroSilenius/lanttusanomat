import { getCategory } from './categories'
import { getAllArticles } from './content'
import { markdownToPlainText } from './markdown'
import type { SearchDoc } from './search'

/** Builds the client-side search index from all published articles. */
export function buildSearchIndex(): SearchDoc[] {
  return getAllArticles().map((article) => ({
    slug: article.slug,
    url: article.url,
    title: article.title,
    summary: article.summary,
    category: article.category,
    categoryName: getCategory(article.category)?.name ?? article.category,
    tags: [...article.tags],
    date: article.date.toISOString(),
    aiGenerated: article.aiGenerated,
    body: markdownToPlainText(article.body).slice(0, 4000),
  }))
}
