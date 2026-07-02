import Link from 'next/link'
import { categories } from '@/lib/categories'
import { siteConfig } from '@/lib/site'

export function SiteHeader() {
  return (
    <header className="border-b-4 border-accent bg-brand text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          aria-label="Lanttusanomat – etusivu"
        >
          <span className="text-2xl font-black tracking-tight sm:text-3xl">{siteConfig.name}</span>
          <span className="hidden rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-brand-dark uppercase sm:inline">
            Satiiria
          </span>
        </Link>
        <Link
          href="/haku"
          className="flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium hover:bg-white/10"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 fill-none stroke-current stroke-2"
          >
            <circle cx="9" cy="9" r="6" />
            <line x1="13.5" y1="13.5" x2="18" y2="18" strokeLinecap="round" />
          </svg>
          Haku
        </Link>
      </div>
      <nav aria-label="Kategoriat" className="bg-brand-dark">
        <div className="mx-auto max-w-5xl overflow-x-auto px-4">
          <ul className="flex gap-1 whitespace-nowrap py-1 text-sm font-semibold">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/kategoria/${category.slug}`}
                  className="inline-block rounded-md px-3 py-1.5 hover:bg-white/10 focus-visible:bg-white/10"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <p className="bg-accent px-4 py-1 text-center text-[11px] font-bold tracking-wide text-brand-dark uppercase">
        Kaikki sisältömme on satiiria eikä perustu tosiasioihin
      </p>
    </header>
  )
}
