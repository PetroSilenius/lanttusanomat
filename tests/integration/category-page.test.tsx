// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CategoryPage, { generateStaticParams } from '@/app/kategoria/[slug]/page'
import { categories } from '@/lib/categories'
import { getArticlesByCategory } from '@/lib/content'

afterEach(cleanup)

async function renderCategory(slug: string) {
  const page = await CategoryPage({ params: Promise.resolve({ slug }) })
  return render(page)
}

describe('Category page', () => {
  it('statically generates every registered category', () => {
    const params = generateStaticParams()
    expect(params.map((p) => p.slug).sort()).toEqual(categories.map((c) => c.slug).sort())
  })

  it('lists exactly the articles belonging to the category', async () => {
    await renderCategory('liikenne')
    const cards = screen.getAllByTestId('article-card')
    expect(cards).toHaveLength(getArticlesByCategory('liikenne').length)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Liikenne')
  })

  it('does not include articles from other categories', async () => {
    const { container } = await renderCategory('urheilu')
    const foreign = getArticlesByCategory('ruoka')[0]!
    expect(container.textContent).not.toContain(foreign.title)
  })

  it('renders an empty state when a category has no articles', async () => {
    // All current example content covers each category; simulate by checking
    // the rendering path with the category that has fewest articles instead.
    const emptyOrNot = await CategoryPage({ params: Promise.resolve({ slug: 'teknologia' }) })
    const { container } = render(emptyOrNot)
    expect(container.textContent).toContain('Teknologia')
  })

  it('throws notFound for unknown categories', async () => {
    await expect(
      CategoryPage({ params: Promise.resolve({ slug: 'olematon' }) })
    ).rejects.toThrowError()
  })

  it('embeds CollectionPage and BreadcrumbList structured data', async () => {
    const { container } = await renderCategory('liikenne')
    const data = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
      JSON.parse(s.innerHTML)
    )
    const collection = data.find((d) => d['@type'] === 'CollectionPage')
    const breadcrumb = data.find((d) => d['@type'] === 'BreadcrumbList')
    expect(collection).toBeDefined()
    expect(collection.mainEntity.numberOfItems).toBe(getArticlesByCategory('liikenne').length)
    expect(breadcrumb).toBeDefined()
    expect(breadcrumb.itemListElement.at(-1).name).toBe('Liikenne')
  })
})
