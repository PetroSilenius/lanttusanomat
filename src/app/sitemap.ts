import type { MetadataRoute } from 'next'
import { categories } from '@/lib/categories'
import { getAllArticles } from '@/lib/content'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles()
  const newestDate = articles[0]?.date ?? new Date()

  return [
    { url: absoluteUrl('/'), lastModified: newestDate, changeFrequency: 'daily', priority: 1 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/kategoria/${category.slug}`),
      lastModified: newestDate,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(article.url),
      lastModified: article.date,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: absoluteUrl('/tietoa'), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: absoluteUrl('/tietosuoja'), changeFrequency: 'yearly' as const, priority: 0.3 },
  ]
}
