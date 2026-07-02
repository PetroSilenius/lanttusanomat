import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchClient } from './SearchClient'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Haku',
  description:
    'Hae Lanttusanomien satiiriartikkeleista otsikon, sisällön ja avainsanojen perusteella.',
  alternates: { canonical: absoluteUrl('/haku') },
  robots: { index: false },
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black text-brand-dark">Haku</h1>
      <Suspense fallback={<p className="mt-4 text-ink-muted">Ladataan hakua…</p>}>
        <SearchClient />
      </Suspense>
    </div>
  )
}
