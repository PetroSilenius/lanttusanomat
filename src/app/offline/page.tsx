import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ei verkkoyhteyttä',
  description: 'Tämä sivu ei ole saatavilla offline-tilassa.',
  robots: { index: false },
}

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-6xl" aria-hidden="true">
        📡
      </p>
      <h1 className="mt-4 text-3xl font-black text-brand-dark">Ei verkkoyhteyttä</h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        Tätä sivua ei ole tallennettu laitteellesi. Aiemmin avaamasi artikkelit, viimeksi ladattu
        etusivu ja sen tuoreimmat uutiset ovat luettavissa myös ilman verkkoa.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-light"
      >
        Siirry etusivulle
      </Link>
    </div>
  )
}
