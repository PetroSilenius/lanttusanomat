// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import HomePage from '@/app/page'
import { categories, getCategory } from '@/lib/categories'
import { getAllArticles } from '@/lib/content'

afterEach(cleanup)

describe('Home page', () => {
  it('features the newest article', () => {
    render(<HomePage />)
    const newest = getAllArticles()[0]!
    expect(screen.getByText(newest.title)).toBeDefined()
  })

  it('renders a grid of latest articles', () => {
    render(<HomePage />)
    const cards = screen.getAllByTestId('article-card')
    expect(cards.length).toBeGreaterThanOrEqual(Math.min(getAllArticles().length, 7))
  })

  it('shows the category as a tag on the featured card', () => {
    render(<HomePage />)
    const featured = getAllArticles()[0]!
    const card = screen.getByText(featured.title).closest('[data-testid="article-card"]')!
    const categoryName = getCategory(featured.category)?.name ?? featured.category
    const badge = within(card as HTMLElement).getByTestId('category-badge')
    expect(badge.textContent).toBe(categoryName)
  })

  it('links to every category', () => {
    render(<HomePage />)
    for (const category of categories) {
      const links = screen.getAllByRole('link', { name: category.name })
      expect(links.length).toBeGreaterThan(0)
    }
  })

  it('embeds WebSite and Organization JSON-LD with a search action', () => {
    const { container } = render(<HomePage />)
    const data = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
      JSON.parse(s.innerHTML)
    )
    const website = data.find((d) => d['@type'] === 'WebSite')
    const organization = data.find((d) => d['@type'] === 'NewsMediaOrganization')
    expect(website).toBeDefined()
    expect(JSON.stringify(website.potentialAction)).toContain('/haku')
    expect(organization).toBeDefined()
    expect(organization.logo.url).toContain('/icons/icon-512.png')
  })
})
