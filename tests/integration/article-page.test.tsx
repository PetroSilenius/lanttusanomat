// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ArticlePage from '@/app/artikkeli/[slug]/page'
import { getArticleBySlug } from '@/lib/content'

async function renderArticle(slug: string) {
  const page = await ArticlePage({ params: Promise.resolve({ slug }) })
  return render(page)
}

afterEach(cleanup)

describe('Article page (AI-generated)', () => {
  const slug = 'tutkimus-kahvitauko'

  it('renders the headline, summary and body', async () => {
    const article = getArticleBySlug(slug)!
    const { container } = await renderArticle(slug)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(article.title)
    expect(container.textContent).toContain(article.summary.trim().slice(0, 40))
    expect(container.querySelector('[data-testid="article-body"] h2')).not.toBeNull()
  })

  it('shows both the satire and AI badges', async () => {
    await renderArticle(slug)
    const header = screen.getByRole('heading', { level: 1 }).closest('header')!
    expect(within(header).getAllByTestId('satire-badge').length).toBeGreaterThan(0)
    expect(within(header).getAllByTestId('ai-badge').length).toBeGreaterThan(0)
  })

  it('shows the AI-specific disclaimer', async () => {
    await renderArticle(slug)
    const disclaimer = screen.getByTestId('satire-disclaimer')
    expect(disclaimer.textContent).toContain('satiiria')
    expect(disclaimer.textContent).toContain('tekoälyn')
  })

  it('embeds SatiricalArticle JSON-LD', async () => {
    const { container } = await renderArticle(slug)
    const script = container.querySelector('script[type="application/ld+json"]')!
    const data = JSON.parse(script.innerHTML)
    expect(data['@type']).toBe('SatiricalArticle')
    expect(data.headline).toBe(getArticleBySlug(slug)!.title)
  })

  it('embeds a BreadcrumbList ending at the article', async () => {
    const { container } = await renderArticle(slug)
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')]
    const breadcrumb = scripts
      .map((s) => JSON.parse(s.innerHTML))
      .find((d) => d['@type'] === 'BreadcrumbList')
    expect(breadcrumb).toBeDefined()
    const items = breadcrumb.itemListElement
    expect(items[0].name).toBe('Etusivu')
    expect(items[items.length - 1].name).toBe(getArticleBySlug(slug)!.title)
  })

  it('never renders originalSources anywhere', async () => {
    const { container } = await renderArticle(slug)
    const html = container.innerHTML
    for (const source of getArticleBySlug(slug)!.originalSources) {
      expect(html).not.toContain(source)
    }
    expect(html).not.toContain('originalSources')
  })

  it('renders related articles', async () => {
    await renderArticle(slug)
    expect(screen.getByRole('heading', { name: /lue seuraavaksi/i })).toBeDefined()
    expect(screen.getAllByTestId('article-card').length).toBeGreaterThan(0)
  })
})

describe('Article page (manually written)', () => {
  const slug = 'espoolainen-loysi-parkkipaikan'

  it('shows the satire badge but no AI badge', async () => {
    await renderArticle(slug)
    const header = screen.getByRole('heading', { level: 1 }).closest('header')!
    expect(within(header).getAllByTestId('satire-badge').length).toBeGreaterThan(0)
    expect(within(header).queryByTestId('ai-badge')).toBeNull()
  })

  it('shows the plain satire disclaimer without the AI clause', async () => {
    await renderArticle(slug)
    const disclaimer = screen.getByTestId('satire-disclaimer')
    expect(disclaimer.textContent).toContain('satiiria')
    expect(disclaimer.textContent).not.toContain('tekoälyn avulla')
  })
})
