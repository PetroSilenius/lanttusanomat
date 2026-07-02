import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-6xl font-black text-brand" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-3xl font-black text-brand-dark">Sivua ei löytynyt</h1>
      <p className="mt-3 leading-relaxed text-ink-muted">
        Etsimäsi sivu on kadonnut. Toisin kuin artikkelimme, tämä ei ole satiiria.
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
