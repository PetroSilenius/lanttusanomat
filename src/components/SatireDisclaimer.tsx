import Link from 'next/link'

/**
 * The visually prominent transparency box shown at the top of every article.
 * States that the content is satire and, for AI articles, that it was
 * generated with AI and must not be read as factual reporting.
 */
export function SatireDisclaimer({ aiGenerated }: { aiGenerated: boolean }) {
  return (
    <aside
      data-testid="satire-disclaimer"
      role="note"
      aria-label="Sisältövaroitus: satiiria"
      className="rounded-lg border-2 border-accent bg-accent/15 px-4 py-3 text-sm leading-relaxed"
    >
      <p className="font-bold text-brand-dark">
        {aiGenerated
          ? 'Tämä artikkeli on satiiria, ja se on tuotettu tekoälyn avulla.'
          : 'Tämä artikkeli on satiiria.'}
      </p>
      <p className="mt-1 text-ink-muted">
        Sisältö on fiktiota: tapahtumat, henkilöt ja lainaukset ovat keksittyjä, eikä artikkelia
        tule tulkita uutisraportoinniksi tai tosiasioiden kuvaukseksi.{' '}
        <Link href="/tietoa" className="font-medium text-brand underline underline-offset-2">
          Lue lisää toimitusperiaatteistamme
        </Link>
        .
      </p>
    </aside>
  )
}
