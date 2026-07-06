import { describe, expect, it } from 'vitest'
import {
  ORGANIZATION_ID,
  WEBSITE_ID,
  articleJsonLd,
  breadcrumbJsonLd,
  buildRssFeed,
  collectionPageJsonLd,
  escapeXml,
  organizationJsonLd,
  toRfc822,
  websiteJsonLd,
} from '@/lib/seo'
import { parseArticleSource } from '@/lib/content'
import { getCategory } from '@/lib/categories'

const article = parseArticleSource(
  `---
title: 'Otsikko & "erikoismerkeillä" <testi>'
slug: seo-testiartikkeli
date: 2026-07-01T08:00:00.000Z
author: Toimitus
category: teknologia
summary: 'Tiivistelmä, jossa on riittävä määrä tekstiä testiin.'
tags: [seo, testi]
aiGenerated: true
originalSources:
  - 'https://example.com/lahde-jota-ei-saa-nakya'
heroImage: /images/heroes/teknologia.svg
---

Leipäteksti, joka ylittää validoinnin vaatiman viidenkymmenen merkin rajan helposti.
`,
  'seo-test.md'
)

describe('articleJsonLd', () => {
  it('produces SatiricalArticle structured data', () => {
    const jsonLd = articleJsonLd(article)
    expect(jsonLd['@type']).toBe('SatiricalArticle')
    expect(jsonLd.headline).toBe(article.title)
    expect(jsonLd.inLanguage).toBe('fi')
    expect(jsonLd.articleSection).toBe('Teknologia')
    expect(
      String(jsonLd.mainEntityOfPage && (jsonLd.mainEntityOfPage as { '@id': string })['@id'])
    ).toContain('/artikkeli/seo-testiartikkeli')
  })

  it('never exposes originalSources', () => {
    const serialized = JSON.stringify(articleJsonLd(article))
    expect(serialized).not.toContain('lahde-jota-ei-saa-nakya')
  })

  it('references the shared website and organization nodes and counts words', () => {
    const jsonLd = articleJsonLd(article)
    expect((jsonLd.isPartOf as { '@id': string })['@id']).toBe(WEBSITE_ID)
    expect((jsonLd.publisher as { '@id': string })['@id']).toBe(ORGANIZATION_ID)
    expect(jsonLd.wordCount).toBeGreaterThan(0)
  })
})

describe('organizationJsonLd', () => {
  it('describes a NewsMediaOrganization with a stable @id and logo', () => {
    const jsonLd = organizationJsonLd()
    expect(jsonLd['@type']).toBe('NewsMediaOrganization')
    expect(jsonLd['@id']).toBe(ORGANIZATION_ID)
    expect((jsonLd.logo as { url: string }).url).toContain('/icons/icon-512.png')
  })
})

describe('breadcrumbJsonLd', () => {
  it('produces a positioned BreadcrumbList with absolute item URLs', () => {
    const jsonLd = breadcrumbJsonLd([
      { name: 'Etusivu', url: '/' },
      { name: 'Teknologia', url: '/kategoria/teknologia' },
    ])
    expect(jsonLd['@type']).toBe('BreadcrumbList')
    const items = jsonLd.itemListElement as { position: number; item: string }[]
    expect(items).toHaveLength(2)
    expect(items[0]!.position).toBe(1)
    expect(items[1]!.item).toContain('/kategoria/teknologia')
    expect(items[1]!.item.startsWith('http')).toBe(true)
  })
})

describe('collectionPageJsonLd', () => {
  it('lists a category’s articles as an ItemList', () => {
    const jsonLd = collectionPageJsonLd(getCategory('teknologia')!, [article])
    expect(jsonLd['@type']).toBe('CollectionPage')
    const list = jsonLd.mainEntity as {
      numberOfItems: number
      itemListElement: { url: string }[]
    }
    expect(list.numberOfItems).toBe(1)
    expect(list.itemListElement[0]!.url).toContain('/artikkeli/seo-testiartikkeli')
  })
})

describe('websiteJsonLd', () => {
  it('includes a SearchAction pointing at /haku', () => {
    const jsonLd = websiteJsonLd()
    expect(jsonLd['@type']).toBe('WebSite')
    expect(JSON.stringify(jsonLd)).toContain('/haku?q=')
  })

  it('links to the shared website and organization nodes', () => {
    const jsonLd = websiteJsonLd()
    expect(jsonLd['@id']).toBe(WEBSITE_ID)
    expect((jsonLd.publisher as { '@id': string })['@id']).toBe(ORGANIZATION_ID)
  })
})

describe('escapeXml & toRfc822', () => {
  it('escapes all XML special characters', () => {
    expect(escapeXml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;')
  })

  it('formats RFC 822 dates', () => {
    expect(toRfc822(new Date('2026-07-01T08:00:00.000Z'))).toBe('Wed, 01 Jul 2026 08:00:00 GMT')
  })
})

describe('buildRssFeed', () => {
  const feed = buildRssFeed([article])

  it('produces a valid RSS 2.0 skeleton', () => {
    expect(feed).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(feed).toContain('<rss version="2.0"')
    expect(feed).toContain('<language>fi</language>')
    expect(feed).toContain('rel="self"')
  })

  it('escapes item titles', () => {
    expect(feed).toContain('Otsikko &amp; &quot;erikoismerkeillä&quot; &lt;testi&gt;')
    expect(feed).not.toContain('<testi>')
  })

  it('links items with permalink GUIDs', () => {
    expect(feed).toContain('<guid isPermaLink="true">')
    expect(feed).toContain('/artikkeli/seo-testiartikkeli</guid>')
  })

  it('never leaks originalSources', () => {
    expect(feed).not.toContain('lahde-jota-ei-saa-nakya')
  })
})
