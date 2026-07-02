import Link from 'next/link'
import { categories } from '@/lib/categories'
import { siteConfig } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-4 border-accent bg-brand-dark text-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-xl font-black">{siteConfig.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {siteConfig.tagline}. Kaikki artikkelimme ovat fiktiota. Henkilöt, lainaukset ja
            tapahtumat ovat keksittyjä, ja tekoälyllä tuotetut jutut on merkitty erikseen.
          </p>
        </div>
        <nav aria-label="Kategoriat (alatunniste)">
          <p className="text-sm font-bold tracking-wider text-accent uppercase">Kategoriat</p>
          <ul className="mt-2 space-y-1 text-sm">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/kategoria/${category.slug}`} className="hover:underline">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Sivusto">
          <p className="text-sm font-bold tracking-wider text-accent uppercase">Sivusto</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/tietoa" className="hover:underline">
                Tietoa meistä
              </Link>
            </li>
            <li>
              <Link href="/tietosuoja" className="hover:underline">
                Tietosuoja
              </Link>
            </li>
            <li>
              <Link href="/haku" className="hover:underline">
                Haku
              </Link>
            </li>
            <li>
              <a href="/feed.xml" className="hover:underline">
                RSS-syöte
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {siteConfig.publisher} · Satiirijulkaisu · Avoin lähdekoodi
      </div>
    </footer>
  )
}
