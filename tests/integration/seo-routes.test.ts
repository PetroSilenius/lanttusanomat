import { describe, expect, it } from 'vitest'
import { GET as getFeed } from '@/app/feed.xml/route'
import { GET as getSearchIndex } from '@/app/search-index.json/route'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { getAllArticles } from '@/lib/content'
import { categories } from '@/lib/categories'
import { searchArticles, type SearchDoc } from '@/lib/search'

describe('/feed.xml', () => {
  it('serves RSS 2.0 with the correct content type', async () => {
    const response = getFeed()
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml')
    const body = await response.text()
    expect(body).toContain('<rss version="2.0"')
  })

  it('contains one item per published article', async () => {
    const body = await getFeed().text()
    const itemCount = (body.match(/<item>/g) ?? []).length
    expect(itemCount).toBe(getAllArticles().length)
  })

  it('never leaks originalSources into the feed', async () => {
    const body = await getFeed().text()
    for (const article of getAllArticles()) {
      for (const source of article.originalSources) {
        expect(body).not.toContain(source)
      }
    }
  })
})

describe('/search-index.json', () => {
  it('indexes every published article with all searchable fields', async () => {
    const docs = (await getSearchIndex().json()) as SearchDoc[]
    expect(docs).toHaveLength(getAllArticles().length)
    for (const doc of docs) {
      expect(doc.slug).toBeTruthy()
      expect(doc.title).toBeTruthy()
      expect(doc.summary).toBeTruthy()
      expect(doc.categoryName).toBeTruthy()
      expect(Array.isArray(doc.tags)).toBe(true)
      expect(typeof doc.body).toBe('string')
      expect(doc.body.length).toBeGreaterThan(0)
    }
  })

  it('supports end-to-end search over the real index', async () => {
    const docs = (await getSearchIndex().json()) as SearchDoc[]
    const results = searchArticles(docs, 'kahvi')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]!.doc.url).toMatch(/^\/artikkeli\//)
  })

  it('does not include originalSources in index documents', async () => {
    const raw = await getSearchIndex().text()
    expect(raw).not.toContain('originalSources')
  })
})

describe('sitemap.xml', () => {
  const entries = sitemap()

  it('includes the home page with top priority', () => {
    expect(entries[0]!.url.endsWith('/')).toBe(true)
    expect(entries[0]!.priority).toBe(1)
  })

  it('includes every category and article exactly once', () => {
    const urls = entries.map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
    for (const category of categories) {
      expect(urls.some((u) => u.endsWith(`/kategoria/${category.slug}`))).toBe(true)
    }
    for (const article of getAllArticles()) {
      expect(urls.some((u) => u.endsWith(article.url))).toBe(true)
    }
  })

  it('uses absolute URLs', () => {
    expect(entries.every((e) => e.url.startsWith('https://'))).toBe(true)
  })
})

describe('robots.txt', () => {
  it('allows crawling, hides search, and points to the sitemap', () => {
    const config = robots()
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    expect(rules[0]!.allow).toBe('/')
    expect(rules[0]!.disallow).toContain('/haku')
    expect(String(config.sitemap)).toMatch(/^https:\/\/.*\/sitemap\.xml$/)
  })

  it('grants LLM crawlers full access, search UI included', () => {
    const config = robots()
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules]
    const llmRule = rules.find((rule) => {
      const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]
      return agents.includes('GPTBot')
    })
    expect(llmRule).toBeDefined()
    const agents = llmRule!.userAgent as string[]
    expect(agents).toEqual(
      expect.arrayContaining(['ClaudeBot', 'PerplexityBot', 'Google-Extended'])
    )
    expect(llmRule!.allow).toBe('/')
    // No disallow — the /haku search UI is reachable by LLM crawlers.
    expect(llmRule!.disallow ?? []).not.toContain('/haku')
  })
})
