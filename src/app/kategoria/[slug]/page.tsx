import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/components/ArticleCard'
import { categories, getCategory } from '@/lib/categories'
import { getArticlesByCategory } from '@/lib/content'
import { absoluteUrl } from '@/lib/site'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: absoluteUrl(`/kategoria/${category.slug}`) },
    openGraph: {
      title: category.name,
      description: category.description,
      url: absoluteUrl(`/kategoria/${category.slug}`),
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const articles = getArticlesByCategory(category.slug)

  return (
    <>
      <header className="border-b-2 border-accent pb-4">
        <h1 className="text-3xl font-black text-brand-dark">{category.name}</h1>
        <p className="mt-2 text-ink-muted">{category.description}</p>
      </header>
      {articles.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-ink-muted">
          Tässä kategoriassa ei ole vielä artikkeleita.
        </p>
      )}
    </>
  )
}
