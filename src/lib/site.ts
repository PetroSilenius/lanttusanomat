/**
 * Central site configuration. The canonical URL comes from the environment so
 * preview deployments and a future custom domain work without code changes.
 */
export const siteConfig = {
  name: 'Lanttusanomat',
  shortName: 'Lanttusanomat',
  tagline: 'Suomen luotettavin lähde uutisille, jotka eivät ole totta',
  description:
    'Lanttusanomat on suomalainen satiiriuutissivusto. Kaikki artikkelimme ovat fiktiota – ' +
    'emme raportoi tosiasioita, vaan irvimme niille.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanttusanomat.pages.dev',
  locale: 'fi-FI',
  language: 'fi',
  publisher: 'Lanttusanomat',
  themeColor: '#4a1d6e',
  backgroundColor: '#faf8f5',
} as const

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, '')
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}
