/**
 * Transparency badges. Every article gets the satire badge; AI-generated
 * articles additionally get the AI badge. These are a core editorial
 * requirement, not decoration — do not remove them from article surfaces.
 */

export function SatireBadge() {
  return (
    <span
      data-testid="satire-badge"
      className="inline-flex items-center rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-extrabold tracking-wider text-brand-dark uppercase"
    >
      Satiiri
    </span>
  )
}

export function AiBadge() {
  return (
    <span
      data-testid="ai-badge"
      className="inline-flex items-center gap-1 rounded-sm bg-brand px-1.5 py-0.5 text-[11px] font-extrabold tracking-wider text-white uppercase"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3 fill-accent">
        <path d="M8 1l1.8 4.4L14.5 7 9.8 8.6 8 13 6.2 8.6 1.5 7l4.7-1.6z" />
      </svg>
      Tekoäly
    </span>
  )
}

export function CategoryBadge({ name }: { name: string }) {
  return (
    <span
      data-testid="category-badge"
      className="inline-flex items-center rounded-sm bg-brand/10 px-1.5 py-0.5 text-[11px] font-extrabold tracking-wider text-brand-dark uppercase"
    >
      {name}
    </span>
  )
}

export function ArticleBadges({ aiGenerated }: { aiGenerated: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SatireBadge />
      {aiGenerated ? <AiBadge /> : null}
    </span>
  )
}
