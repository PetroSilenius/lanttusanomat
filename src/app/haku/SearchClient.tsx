'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArticleBadges } from '@/components/Badges'
import { searchArticles, type SearchDoc, type SearchResult } from '@/lib/search'

type IndexState =
  { status: 'loading' } | { status: 'ready'; docs: SearchDoc[] } | { status: 'error' }

export function SearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [index, setIndex] = useState<IndexState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/search-index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<SearchDoc[]>
      })
      .then((docs) => {
        if (!cancelled) setIndex({ status: 'ready', docs })
      })
      .catch(() => {
        if (!cancelled) setIndex({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const results: SearchResult[] =
    index.status === 'ready' && query.trim().length >= 2 ? searchArticles(index.docs, query) : []

  return (
    <div className="mt-4">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          const params = new URLSearchParams()
          if (query.trim()) params.set('q', query.trim())
          router.replace(`/haku${params.size > 0 ? `?${params}` : ''}`)
        }}
      >
        <label htmlFor="hakukentta" className="block text-sm font-semibold text-ink">
          Hakusana
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="hakukentta"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Esim. kahvi, työryhmä, pysäköinti…"
            autoComplete="off"
            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-light"
          >
            Hae
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-6">
        {index.status === 'loading' ? <p className="text-ink-muted">Ladataan hakemistoa…</p> : null}
        {index.status === 'error' ? (
          <p className="text-ink-muted">
            Hakemistoa ei voitu ladata. Jos olet offline-tilassa, haku toimii vasta kun yhteys
            palaa.
          </p>
        ) : null}
        {index.status === 'ready' && query.trim().length >= 2 ? (
          <>
            <p className="text-sm font-semibold text-ink-muted" data-testid="search-result-count">
              {results.length === 0
                ? 'Ei hakutuloksia.'
                : `${results.length} ${results.length === 1 ? 'tulos' : 'tulosta'}`}
            </p>
            <ul className="mt-3 space-y-4">
              {results.map(({ doc }) => (
                <li key={doc.slug} data-testid="search-result">
                  <Link
                    href={doc.url}
                    className="block rounded-xl border border-line bg-white p-4 hover:border-brand"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
                      <span className="font-bold text-brand">{doc.categoryName}</span>
                      <ArticleBadges aiGenerated={doc.aiGenerated} />
                    </div>
                    <h2 className="mt-1 text-lg font-extrabold text-ink">{doc.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{doc.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {index.status === 'ready' && query.trim().length < 2 ? (
          <p className="text-ink-muted">Kirjoita vähintään kaksi merkkiä.</p>
        ) : null}
      </div>
    </div>
  )
}
