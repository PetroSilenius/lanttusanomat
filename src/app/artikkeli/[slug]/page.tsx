import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleBadges } from '@/components/Badges'
import { ArticleCard } from '@/components/ArticleCard'
import { JsonLd } from '@/components/JsonLd'
import { SatireDisclaimer } from '@/components/SatireDisclaimer'
import { getCategory } from '@/lib/categories'
import { getAllArticles, getArticleBySlug, getRelatedArticles } from '@/lib/content'
import { formatDateTime } from '@/lib/format'
import { markdownToHtml, readingTimeMinutes } from '@/lib/markdown'
import { articleJsonLd } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  const categoryName = getCategory(article.category)?.name ?? article.category
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: absoluteUrl(article.url) },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary,
      url: absoluteUrl(article.url),
      publishedTime: article.date.toISOString(),
      section: categoryName,
      tags: [...article.tags],
      images: article.heroImage ? [{ url: absoluteUrl(article.heroImage) }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: article.heroImage ? [absoluteUrl(article.heroImage)] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const category = getCategory(article.category)
  const html = await markdownToHtml(article.body)
  const related = getRelatedArticles(article, 3)
  const readingTime = readingTimeMinutes(article.body)

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={articleJsonLd(article)} />

      <nav aria-label="Murupolku" className="text-sm font-semibold text-ink-muted">
        <Link href="/" className="hover:text-brand">
          Etusivu
        </Link>
        <span aria-hidden="true"> › </span>
        <Link href={`/kategoria/${article.category}`} className="text-brand hover:underline">
          {category?.name ?? article.category}
        </Link>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <ArticleBadges aiGenerated={article.aiGenerated} />
        </div>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed font-medium text-ink-muted">{article.summary}</p>
        <p className="mt-3 text-sm text-ink-muted">
          <span className="font-semibold text-ink">{article.author}</span>
          {' · '}
          <time dateTime={article.date.toISOString()}>{formatDateTime(article.date)}</time>
          {' · '}
          <span>{readingTime} min lukuaika</span>
        </p>
      </header>

      <div className="mt-5">
        <SatireDisclaimer aiGenerated={article.aiGenerated} />
      </div>

      {article.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export serves hand-optimized SVGs
        <img
          src={article.heroImage}
          alt=""
          width={1200}
          height={630}
          className="mt-6 aspect-[1200/630] w-full rounded-xl object-cover"
        />
      ) : null}

      <div
        data-testid="article-body"
        className="article-body mt-8"
        // Trusted build-time content: rendered from validated repo Markdown, never user input.
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="mt-10 border-t border-line pt-6">
        <ul className="flex flex-wrap gap-2" aria-label="Avainsanat">
          {article.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark"
            >
              #{tag}
            </li>
          ))}
        </ul>
      </footer>

      {related.length > 0 ? (
        <section aria-labelledby="lue-seuraavaksi" className="mt-12">
          <h2
            id="lue-seuraavaksi"
            className="border-b-2 border-accent pb-1 text-sm font-extrabold tracking-wider text-brand-dark uppercase"
          >
            Lue seuraavaksi
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {related.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.slug} article={relatedArticle} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
