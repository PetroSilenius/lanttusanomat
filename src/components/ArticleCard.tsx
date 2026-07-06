import Link from 'next/link'
import type { Article } from '@/lib/content'
import { getCategory } from '@/lib/categories'
import { formatDate } from '@/lib/format'
import { ArticleBadges, CategoryBadge } from './Badges'

interface ArticleCardProps {
  article: Article
  /** Featured cards render a bigger headline and eager-load their image. */
  featured?: boolean
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const categoryName = getCategory(article.category)?.name ?? article.category
  return (
    <article
      data-testid="article-card"
      className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <Link
        href={article.url}
        className="block focus-visible:outline-2 focus-visible:outline-brand"
      >
        {article.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export serves hand-optimized SVGs
          <img
            src={article.heroImage}
            alt=""
            width={1200}
            height={630}
            loading={featured ? 'eager' : 'lazy'}
            className="aspect-[1200/630] w-full object-cover"
          />
        ) : null}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
            <CategoryBadge name={categoryName} />
            <time dateTime={article.date.toISOString()}>{formatDate(article.date)}</time>
            <ArticleBadges aiGenerated={article.aiGenerated} />
          </div>
          <h3
            className={`mt-2 font-extrabold leading-snug text-ink group-hover:text-brand ${
              featured ? 'text-2xl sm:text-3xl' : 'text-lg'
            }`}
          >
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {article.summary}
          </p>
        </div>
      </Link>
    </article>
  )
}
