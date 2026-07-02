import { absoluteUrl, siteConfig } from './site'
import { getCategory } from './categories'
import type { Article } from './content'

/**
 * JSON-LD builders. Note the schema.org type: satire is explicitly modelled
 * as `SatiricalArticle` (a NewsArticle subtype), which is both honest and
 * good structured data — crawlers know this is not factual reporting.
 */

export function articleJsonLd(article: Article): Record<string, unknown> {
  const categoryName = getCategory(article.category)?.name ?? article.category
  return {
    '@context': 'https://schema.org',
    '@type': 'SatiricalArticle',
    headline: article.title,
    description: article.summary,
    datePublished: article.date.toISOString(),
    dateModified: article.date.toISOString(),
    inLanguage: siteConfig.language,
    articleSection: categoryName,
    keywords: article.tags.join(', '),
    image: article.heroImage ? [absoluteUrl(article.heroImage)] : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(article.url) },
    author: { '@type': 'Organization', name: article.author, url: siteConfig.url },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.publisher,
      url: siteConfig.url,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png') },
    },
    isAccessibleForFree: true,
  }
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.tagline,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/haku?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** RFC 822 date required by RSS 2.0. */
export function toRfc822(date: Date): string {
  return date.toUTCString()
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Builds the RSS 2.0 feed document for the given articles. */
export function buildRssFeed(articles: Article[]): string {
  const items = articles
    .map((article) => {
      const categoryName = getCategory(article.category)?.name ?? article.category
      const url = absoluteUrl(article.url)
      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${toRfc822(article.date)}</pubDate>`,
        `      <category>${escapeXml(categoryName)}</category>`,
        `      <description>${escapeXml(article.summary)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(siteConfig.name)}</title>`,
    `    <link>${escapeXml(siteConfig.url)}</link>`,
    `    <description>${escapeXml(siteConfig.description)}</description>`,
    `    <language>${siteConfig.language}</language>`,
    `    <atom:link href="${escapeXml(absoluteUrl('/feed.xml'))}" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
