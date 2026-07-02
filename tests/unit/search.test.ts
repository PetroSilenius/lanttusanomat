import { describe, expect, it } from 'vitest'
import { searchArticles, tokenize, type SearchDoc } from '@/lib/search'

function doc(overrides: Partial<SearchDoc>): SearchDoc {
  return {
    slug: 'testi',
    url: '/artikkeli/testi',
    title: 'Otsikko',
    summary: 'Tiivistelmä',
    category: 'ruoka',
    categoryName: 'Ruoka',
    tags: [],
    date: '2026-07-01T00:00:00.000Z',
    aiGenerated: false,
    body: '',
    ...overrides,
  }
}

const docs: SearchDoc[] = [
  doc({
    slug: 'kahvi',
    title: 'Kahvinkeitin aloitti lakon',
    summary: 'Toimiston kahvinkeitin vaatii parempia papuja.',
    tags: ['kahvi', 'työelämä'],
    body: 'Kahvinkeitin keitti pelkkää vettä protestiksi.',
    date: '2026-07-02T00:00:00.000Z',
  }),
  doc({
    slug: 'bussi',
    title: 'Bussikuski nyökkäsi matkustajalle',
    summary: 'Tervehtimislautakunta tutkii tapausta.',
    category: 'liikenne',
    categoryName: 'Liikenne',
    tags: ['bussi'],
    body: 'Nyökkäys tapahtui Tampereella arkiaamuna.',
    date: '2026-07-01T00:00:00.000Z',
  }),
  doc({
    slug: 'pysakointi',
    title: 'Parkkipaikka löytyi heti',
    summary: 'Espoolainen löysi parkkipaikan ensimmäisellä yrityksellä.',
    category: 'liikenne',
    categoryName: 'Liikenne',
    tags: ['pysäköinti'],
    body: 'Kahvia juotiin juhlan kunniaksi.',
    date: '2026-06-30T00:00:00.000Z',
  }),
]

describe('tokenize', () => {
  it('lowercases and keeps Finnish letters', () => {
    expect(tokenize('Nyökkäys Tampereella!')).toEqual(['nyökkäys', 'tampereella'])
  })

  it('drops single-character noise', () => {
    expect(tokenize('a b kahvi')).toEqual(['kahvi'])
  })
})

describe('searchArticles', () => {
  it('finds matches by title with highest weight', () => {
    const results = searchArticles(docs, 'kahvinkeitin')
    expect(results[0]!.doc.slug).toBe('kahvi')
  })

  it('matches across body text', () => {
    const results = searchArticles(docs, 'tampereella')
    expect(results.map((r) => r.doc.slug)).toEqual(['bussi'])
  })

  it('matches tags and categories', () => {
    const byTag = searchArticles(docs, 'pysäköinti')
    expect(byTag.map((r) => r.doc.slug)).toEqual(['pysakointi'])
    const byCategory = searchArticles(docs, 'liikenne')
    expect(byCategory.map((r) => r.doc.slug).sort()).toEqual(['bussi', 'pysakointi'])
  })

  it('requires every query token to match (AND semantics)', () => {
    expect(searchArticles(docs, 'kahvi bussi')).toHaveLength(0)
    expect(searchArticles(docs, 'kahvi protesti').map((r) => r.doc.slug)).toEqual(['kahvi'])
  })

  it('supports prefix matching for longer tokens', () => {
    const results = searchArticles(docs, 'nyökkä')
    expect(results.map((r) => r.doc.slug)).toEqual(['bussi'])
  })

  it('returns empty for empty or too-short queries', () => {
    expect(searchArticles(docs, '')).toEqual([])
    expect(searchArticles(docs, ' ')).toEqual([])
  })

  it('ranks title matches above body-only matches', () => {
    const results = searchArticles(docs, 'kahvi')
    expect(results[0]!.doc.slug).toBe('kahvi')
    expect(results.map((r) => r.doc.slug)).toContain('pysakointi')
  })

  it('respects the result limit', () => {
    expect(searchArticles(docs, 'liikenne', 1)).toHaveLength(1)
  })
})
