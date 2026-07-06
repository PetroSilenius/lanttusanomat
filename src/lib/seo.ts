import { absoluteUrl, siteConfig } from './site'
import { getCategory, type Category } from './categories'
import type { Article } from './content'

/**
 * JSON-LD builders. Note the schema.org type: satire is explicitly modelled
 * as `SatiricalArticle` (a NewsArticle subtype), which is both honest and
 * good structured data — crawlers know this is not factual reporting.
 *
 * Stable node `@id`s let structured data on different pages describe the same
 * publisher and website entities; crawlers reconcile them into one knowledge
 * graph node instead of many duplicates.
 */

/** Canonical `@id` of the publisher entity, referenced from every page. */
export const ORGANIZATION_ID = `${siteConfig.url}/#organization`
/** Canonical `@id` of the website entity. */
export const WEBSITE_ID = `${siteConfig.url}/#website`

/** Roughly counts words in the raw Markdown body for `wordCount`. */
function wordCount(body: string): number {
  const words = body.trim().match(/\S+/g)
  return words ? words.length : 0
}

/**
 * The publishing organization. Modelled as `NewsMediaOrganization` and marked
 * as a satire outlet so search engines understand the site's nature.
 */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': ORGANIZATION_ID,
    name: siteConfig.publisher,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icons/icon-512.png'),
      width: 512,
      height: 512,
    },
    knowsLanguage: siteConfig.language,
  }
}

export function articleJsonLd(article: Article): Record<string, unknown> {
  const categoryName = getCategory(article.category)?.name ?? article.category
  const url = absoluteUrl(article.url)
  return {
    '@context': 'https://schema.org',
    '@type': 'SatiricalArticle',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.summary,
    datePublished: article.date.toISOString(),
    dateModified: article.date.toISOString(),
    inLanguage: siteConfig.language,
    articleSection: categoryName,
    keywords: article.tags.join(', '),
    wordCount: wordCount(article.body),
    image: article.heroImage ? [absoluteUrl(article.heroImage)] : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID },
    author: { '@type': 'Organization', name: article.author, url: siteConfig.url },
    publisher: {
      '@type': 'NewsMediaOrganization',
      '@id': ORGANIZATION_ID,
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
    '@id': WEBSITE_ID,
    name: siteConfig.name,
    alternateName: siteConfig.tagline,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    publisher: { '@id': ORGANIZATION_ID },
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

/**
 * A breadcrumb trail for rich results. Each entry is `{ name, url }`; the URL
 * may be site-relative (it is resolved to an absolute URL) or already absolute.
 */
export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : absoluteUrl(item.url),
    })),
  }
}

/**
 * A category listing page as a `CollectionPage` whose `mainEntity` is an
 * ordered `ItemList` of its articles — helps crawlers understand the section
 * and the articles it groups.
 */
export function collectionPageJsonLd(
  category: Category,
  articles: Article[]
): Record<string, unknown> {
  const url = absoluteUrl(`/kategoria/${category.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name: category.name,
    description: category.description,
    url,
    inLanguage: siteConfig.language,
    isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(article.url),
        name: article.title,
      })),
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
