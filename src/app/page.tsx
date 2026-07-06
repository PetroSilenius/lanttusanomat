import Link from 'next/link'
import { ArticleCard } from '@/components/ArticleCard'
import { JsonLd } from '@/components/JsonLd'
import { getAllArticles } from '@/lib/content'
import { categories } from '@/lib/categories'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import { siteConfig } from '@/lib/site'

export default function HomePage() {
  const articles = getAllArticles()
  const [featured, ...rest] = articles
  const latest = rest.slice(0, 6)

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <h1 className="sr-only">
        {siteConfig.name} – {siteConfig.tagline}
      </h1>

      {featured ? (
        <section aria-labelledby="paauutinen">
          <h2 id="paauutinen" className="sr-only">
            Pääuutinen
          </h2>
          <ArticleCard article={featured} featured />
        </section>
      ) : (
        <p className="py-12 text-center text-ink-muted">Ei vielä artikkeleita.</p>
      )}

      {latest.length > 0 ? (
        <section aria-labelledby="tuoreimmat" className="mt-8">
          <h2
            id="tuoreimmat"
            className="border-b-2 border-accent pb-1 text-sm font-extrabold tracking-wider text-brand-dark uppercase"
          >
            Tuoreimmat
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="kategoriat-otsikko" className="mt-10">
        <h2
          id="kategoriat-otsikko"
          className="border-b-2 border-accent pb-1 text-sm font-extrabold tracking-wider text-brand-dark uppercase"
        >
          Kategoriat
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/kategoria/${category.slug}`}
                className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-brand hover:border-brand"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
