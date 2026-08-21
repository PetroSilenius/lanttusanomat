import { describe, expect, it } from 'vitest'
import { validateGeneratedArticle, MIN_WORDS } from '@/generation/editorial'

/** Builds an article source with a body of `words` benign Finnish words. */
const body = (words: number) => Array.from({ length: words }, () => 'kunta').join(' ')

const article = ({
  aiGenerated = true,
  category = 'politiikka',
  words = MIN_WORDS + 50,
  title = 'Valtuusto perusti työryhmän työryhmien tutkimiseksi',
  summary = 'Kunnallinen selvitys etenee suunnitellusti ja aikataulussa.',
  bodyText = body(words),
}: {
  aiGenerated?: boolean
  category?: string
  words?: number
  title?: string
  summary?: string
  bodyText?: string
} = {}) => `---
title: '${title}'
slug: valtuusto-perusti-tyoryhman
date: 2026-07-05T08:00:00.000Z
author: Lanttusanomat AI-toimitus
category: ${category}
summary: '${summary}'
tags: [politiikka]
aiGenerated: ${aiGenerated}
---

${bodyText}
`

describe('validateGeneratedArticle', () => {
  it('accepts a well-formed AI-generated article', () => {
    const result = validateGeneratedArticle(article(), 'ok.md')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.category).toBe('politiikka')
      expect(result.words).toBeGreaterThanOrEqual(MIN_WORDS)
    }
  })

  it('rejects articles that are not marked aiGenerated', () => {
    const result = validateGeneratedArticle(article({ aiGenerated: false }), 'human.md')
    expect(result).toMatchObject({ ok: false })
    if (!result.ok) expect(result.reason).toMatch(/aiGenerated/)
  })

  it('rejects bodies below the word-count floor', () => {
    const result = validateGeneratedArticle(article({ words: 100 }), 'short.md')
    expect(result).toMatchObject({ ok: false })
    if (!result.ok) expect(result.reason).toMatch(/word count/)
  })

  it('rejects content that trips the banned-topic filter', () => {
    const result = validateGeneratedArticle(
      article({ summary: 'Uutinen käsittelee sotaa ja hyökkäystä rajalla.' }),
      'unsafe.md'
    )
    expect(result).toMatchObject({ ok: false })
    // The stem is named so a false positive is diagnosable from the CI log.
    if (!result.ok) expect(result.reason).toMatch(/banned-topic filter \(matched "hyökkä"\)/)
  })

  it('rejects articles whose frontmatter fails the schema', () => {
    const result = validateGeneratedArticle(article({ category: 'ei-olemassa' }), 'bad-cat.md')
    expect(result).toMatchObject({ ok: false })
  })
})
