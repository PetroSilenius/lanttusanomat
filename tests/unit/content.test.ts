import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadArticles, parseArticleSource } from '@/lib/content'

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'articles')

describe('loadArticles', () => {
  it('loads, validates and sorts published articles newest first', () => {
    const articles = loadArticles(fixtureDir)
    expect(articles).toHaveLength(2)
    expect(articles[0]!.slug).toBe('toinen-testi-bussikuski')
    expect(articles[1]!.slug).toBe('testiartikkeli-kahvinkeitin')
  })

  it('excludes unpublished articles', () => {
    const articles = loadArticles(fixtureDir)
    expect(articles.every((a) => a.published)).toBe(true)
    expect(articles.find((a) => a.slug === 'julkaisematon-luonnos')).toBeUndefined()
  })

  it('computes article URLs from slugs', () => {
    const articles = loadArticles(fixtureDir)
    expect(articles[0]!.url).toBe('/artikkeli/toinen-testi-bussikuski')
  })

  it('returns an empty list for a missing directory', () => {
    expect(loadArticles(path.join(fixtureDir, 'does-not-exist'))).toEqual([])
  })

  it('keeps originalSources as metadata without rendering hooks', () => {
    const articles = loadArticles(fixtureDir)
    const aiArticle = articles.find((a) => a.slug === 'testiartikkeli-kahvinkeitin')!
    expect(aiArticle.originalSources).toEqual(['https://example.com/salainen-lahde'])
  })
})

describe('parseArticleSource', () => {
  const source = (slug: string) => `---
title: 'Sama otsikko molemmissa tiedostoissa'
slug: ${slug}
date: 2026-07-01T08:00:00.000Z
author: Toimitus
category: ruoka
summary: 'Riittävän pitkä tiivistelmä testiartikkelille.'
tags: [testi]
aiGenerated: false
---

Tässä on tarpeeksi pitkä leipäteksti, jotta validointi menee läpi ongelmitta.
`

  it('parses a raw markdown document', () => {
    const article = parseArticleSource(source('oma-slug'), 'file.md')
    expect(article.slug).toBe('oma-slug')
    expect(article.aiGenerated).toBe(false)
  })
})
