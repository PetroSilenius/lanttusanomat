import { categorySlugs } from './categories'

/**
 * Hero-image registry.
 *
 * Every category ships **three** stylized SVG illustrations in
 * `public/images/heroes/`. Article generation picks the variant whose
 * `description` best fits the article (see `.github/workflows/generate-articles.yml`);
 * the first entry is the category default when nothing fits better.
 *
 * An article may instead point `heroImage` at a bespoke, article-specific image
 * under `public/images/articles/<slug>.svg` — any `/`-prefixed path is accepted,
 * and the file must exist (validated at load time in `content.ts`).
 *
 * Pure data + helpers, no React/Next imports (see the layering rule in CLAUDE.md).
 */

export interface HeroVariant {
  /** Site-relative path, e.g. `/images/heroes/politiikka-2.svg`. */
  path: string
  /** Short Finnish description of what the illustration depicts. */
  description: string
}

/** The three variants for each category, default first. */
export const categoryHeroes: Readonly<Record<string, readonly HeroVariant[]>> = {
  politiikka: [
    { path: '/images/heroes/politiikka.svg', description: 'Puhujapönttö ja tyhjiä puhekuplia' },
    {
      path: '/images/heroes/politiikka-2.svg',
      description: 'Pylväikköinen hallintorakennus ja lippu',
    },
    { path: '/images/heroes/politiikka-3.svg', description: 'Äänestyslipas ja äänestyslippu' },
  ],
  liikenne: [
    { path: '/images/heroes/liikenne.svg', description: 'Autojono ja liikennevalo' },
    { path: '/images/heroes/liikenne-2.svg', description: 'Juna asemalaiturilla' },
    { path: '/images/heroes/liikenne-3.svg', description: 'Pysäköintikyltti ja tyhjä ruutu' },
  ],
  ruoka: [
    { path: '/images/heroes/ruoka.svg', description: 'Höyryävä kahvikuppi' },
    { path: '/images/heroes/ruoka-2.svg', description: 'Lautanen, haarukka ja veitsi' },
    { path: '/images/heroes/ruoka-3.svg', description: 'Ruokaostoskori täynnä ostoksia' },
  ],
  teknologia: [
    { path: '/images/heroes/teknologia.svg', description: 'Älypuhelin ja ilmoituskuplia' },
    { path: '/images/heroes/teknologia-2.svg', description: 'Kannettava tietokone ja koodia' },
    { path: '/images/heroes/teknologia-3.svg', description: 'Robotti ja puhekupla' },
  ],
  talous: [
    { path: '/images/heroes/talous.svg', description: 'Nouseva pylväsdiagrammi kolikoista' },
    { path: '/images/heroes/talous-2.svg', description: 'Lompakko ja seteleitä' },
    { path: '/images/heroes/talous-3.svg', description: 'Säästöpossu ja kolikko' },
  ],
  urheilu: [
    { path: '/images/heroes/urheilu.svg', description: 'Pokaali korokkeella' },
    { path: '/images/heroes/urheilu-2.svg', description: 'Tulostaulu ja kenttä' },
    { path: '/images/heroes/urheilu-3.svg', description: 'Mitali nauhassa' },
  ],
  kotimaa: [
    { path: '/images/heroes/kotimaa.svg', description: 'Kaksi hahmoa odottaa bussipysäkillä' },
    { path: '/images/heroes/kotimaa-2.svg', description: 'Saunan kiuas, kiulu ja löylyä' },
    { path: '/images/heroes/kotimaa-3.svg', description: 'Kesämökki järven rannalla' },
  ],
}

/** The hero variants offered for a category (empty for an unknown slug). */
export function heroVariants(category: string): readonly HeroVariant[] {
  return categoryHeroes[category] ?? []
}

/** The default hero image for a category (first variant), if any. */
export function defaultHeroImage(category: string): string | undefined {
  return categoryHeroes[category]?.[0]?.path
}

/** Every registered category-hero path, for build-time asset validation. */
export function allHeroPaths(): string[] {
  return categorySlugs.flatMap((slug) => heroVariants(slug).map((v) => v.path))
}
