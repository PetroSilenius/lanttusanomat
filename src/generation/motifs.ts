/**
 * Repetition analysis over recently published articles.
 *
 * The generation pipeline is stateless: every run reads the topic briefing and
 * the Satire Skill, but never sees what it already published. Left alone it
 * converges on one comic device — an institution founding a työryhmä, selvitys
 * or lautakunta — because nothing in its input says that joke is spent.
 *
 * This module makes the pipeline self-aware: it counts the satirical devices,
 * structural beats and categories used in a recent window and reports the ones
 * that have become formula, so `scripts/select-topics.mts` can hand the writer
 * an explicit "already used, pick something else" list.
 *
 * Pure and unit-tested — the caller supplies the articles.
 */

/** The subset of an Article this analysis needs. */
export interface MotifArticle {
  slug: string
  date: Date
  title: string
  summary: string
  body: string
  category: string
}

export interface MotifCount {
  id: string
  /** Finnish label, written to be read by the article writer. */
  label: string
  count: number
  /** Share of the analysed window, 0–1. */
  share: number
  /** Up to three example slugs, newest first. */
  examples: string[]
}

export interface CategoryCount {
  category: string
  count: number
  share: number
}

export interface MotifReport {
  windowDays: number
  articleCount: number
  /** Motifs at or above the overuse threshold, most-used first. */
  overused: MotifCount[]
  /** Every motif that occurred at least once, most-used first. */
  all: MotifCount[]
  categories: CategoryCount[]
  /** Registry categories with no article in the window. */
  unusedCategories: string[]
}

interface MotifDefinition {
  id: string
  label: string
  /**
   * Lowercased Finnish stems. Chosen to survive inflection and consonant
   * gradation the same way `safety.ts` does — 'lautakun' matches both
   * 'lautakunta' and 'lautakunnan'; prefer the shortest unambiguous prefix.
   */
  stems: readonly string[]
  /** Which part of the article the stems are matched against. */
  scope: 'all' | 'opening' | 'ending'
}

/**
 * The comic vehicle an article leans on. These are the devices that turned
 * repetitive: each one is a way of saying "the institution responded by
 * creating a procedure", and the pipeline reached for them almost every day.
 */
const MOTIFS: readonly MotifDefinition[] = [
  {
    id: 'tyoryhma',
    label: 'työryhmä / toimikunta / ohjausryhmä perustetaan',
    stems: ['työryhm', 'toimikun', 'ohjausryhm', 'projektiryhm'],
    scope: 'all',
  },
  {
    id: 'lautakunta',
    label: 'lautakunta / neuvottelukunta arvioimaan asiaa',
    stems: ['lautakun', 'neuvottelukun', 'valiokun'],
    scope: 'all',
  },
  {
    id: 'selvitys',
    label: 'selvitys / kartoitus tilataan',
    stems: ['selvity', 'selvittämään', 'kartoitu', 'kartoitta'],
    scope: 'all',
  },
  {
    id: 'yksikko',
    label: 'uusi yksikkö / erillisvirasto',
    stems: ['yksikk', 'yksikö', 'erillisvirast'],
    scope: 'all',
  },
  {
    id: 'mittari',
    label: 'indeksi / mittari / asteikko / kriteeristö',
    stems: ['indeksi', 'mittari', 'mittaus', 'asteik', 'pisteyty', 'luokitus', 'kriteerist'],
    scope: 'all',
  },
  {
    id: 'koulutus',
    label: 'koulutus / valmennus / perehdytys',
    stems: ['koulutu', 'valmennu', 'perehdyty'],
    scope: 'all',
  },
  {
    id: 'suunnitelma',
    label: 'suunnitelma / strategia / tiekartta',
    stems: ['suunnitelm', 'strategi', 'tiekart', 'toimenpideohjelm'],
    scope: 'all',
  },
  {
    id: 'raportti',
    label: 'raportti / väliraportti luvataan',
    // 'raporti' already covers raportin/raportissa; 'raportti' the geminate forms.
    stems: ['raporti', 'raportti', 'väliraport'],
    scope: 'all',
  },
  {
    id: 'lomake',
    label: 'lomake / ilmoitusvelvollisuus',
    stems: ['lomak', 'ilmoitusvelvolli', 'velvoit'],
    scope: 'all',
  },
  {
    id: 'perustaminen',
    label: 'aloitus: "X perusti Y:n" -rakenne',
    stems: ['perust'],
    scope: 'opening',
  },
  {
    id: 'lykkaysloppu',
    label: 'lopetus: työ jatkuu, raportti valmistuu syksyllä',
    stems: [
      'kokoontuu seuraavan',
      'seuraavan kerran',
      'on määrä valmistua',
      'valmistuu syksyllä',
      'syyskuussa',
      'ensi vuonna',
      'harkitse',
      'laajentamis',
    ],
    scope: 'ending',
  },
  {
    id: 'viestintalahde',
    label: 'toinen lähde on viestintävastaava / tiedottaja',
    stems: [
      'viestinnästä vastaa',
      'viestintäasiantunt',
      'viestintäjohtaj',
      'viestintäpäällik',
      'tiedottaj',
    ],
    scope: 'all',
  },
]

/** A motif used in at least this share of the window counts as overused. */
export const OVERUSE_SHARE = 0.25
/** …but never flag on fewer than this many occurrences. */
export const OVERUSE_MIN_COUNT = 3
/** Default look-back window for the daily briefing. */
export const DEFAULT_WINDOW_DAYS = 14

function normalize(text: string): string {
  return text.toLowerCase()
}

/**
 * Folds ä/ö/å to a/o/a. Slugs are ASCII transliterations of the Finnish title
 * ('...-tyoryhma'), so a stem written with umlauts would never match one.
 * Matching is done against both the raw and the folded form.
 */
function asciiFold(text: string): string {
  return text.replace(/[äå]/g, 'a').replace(/ö/g, 'o')
}

function matches(text: string, stem: string): boolean {
  return text.includes(stem) || asciiFold(text).includes(asciiFold(stem))
}

/** First paragraph of the body — where the article's premise is set up. */
function openingOf(body: string): string {
  return body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith('#')) ?? ''
}

/** Last paragraph of the body — where the kicker lands. */
function endingOf(body: string): string {
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim())
  return paragraphs[paragraphs.length - 1] ?? ''
}

function haystack(article: MotifArticle, scope: MotifDefinition['scope']): string {
  if (scope === 'opening') {
    return normalize(`${article.title} ${article.summary} ${openingOf(article.body)}`)
  }
  if (scope === 'ending') {
    return normalize(endingOf(article.body))
  }
  return normalize(`${article.slug} ${article.title} ${article.summary} ${article.body}`)
}

/** True when any of the motif's stems occurs in the article's relevant scope. */
export function articleUsesMotif(article: MotifArticle, motifId: string): boolean {
  const motif = MOTIFS.find((m) => m.id === motifId)
  if (!motif) return false
  const text = haystack(article, motif.scope)
  return motif.stems.some((stem) => matches(text, stem))
}

/** Articles published within `windowDays` before `now`, newest first. */
export function recentArticles(
  articles: readonly MotifArticle[],
  windowDays: number = DEFAULT_WINDOW_DAYS,
  now: Date = new Date()
): MotifArticle[] {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000
  return articles
    .filter((a) => a.date.getTime() >= cutoff && a.date.getTime() <= now.getTime())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Counts motif and category usage across a window of recent articles.
 *
 * `allCategories` is the fixed category registry, so the report can also point
 * out which categories have gone unused — the pipeline drifted heavily toward
 * talous and politiikka.
 */
export function analyzeMotifs(
  articles: readonly MotifArticle[],
  allCategories: readonly string[] = [],
  windowDays: number = DEFAULT_WINDOW_DAYS,
  now: Date = new Date()
): MotifReport {
  const window = recentArticles(articles, windowDays, now)
  const total = window.length

  const all: MotifCount[] = MOTIFS.map((motif) => {
    const used = window.filter((article) =>
      motif.stems.some((stem) => matches(haystack(article, motif.scope), stem))
    )
    return {
      id: motif.id,
      label: motif.label,
      count: used.length,
      share: total === 0 ? 0 : used.length / total,
      examples: used.slice(0, 3).map((a) => a.slug),
    }
  })
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))

  const counted = new Map<string, number>()
  for (const article of window) {
    counted.set(article.category, (counted.get(article.category) ?? 0) + 1)
  }
  const categories: CategoryCount[] = [...counted.entries()]
    .map(([category, count]) => ({ category, count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))

  return {
    windowDays,
    articleCount: total,
    overused: all.filter((m) => m.count >= OVERUSE_MIN_COUNT && m.share >= OVERUSE_SHARE),
    all,
    categories,
    unusedCategories: allCategories.filter((c) => !counted.has(c)),
  }
}

function percent(share: number): string {
  return `${Math.round(share * 100)} %`
}

/**
 * Renders the report as the Finnish "don't repeat yourself" section of the
 * daily briefing. Written as instructions to the writer, not as statistics.
 */
export function formatMotifBriefing(report: MotifReport): string {
  const lines: string[] = ['# Viime aikoina käytetyt keinot (älä toista näitä)', '']

  if (report.articleCount === 0) {
    lines.push(
      `Viimeisen ${report.windowDays} päivän ajalta ei löytynyt julkaistuja artikkeleita, joten toistoa ei voitu arvioida.`,
      ''
    )
    return lines.join('\n')
  }

  lines.push(
    `Analysoitu ${report.articleCount} artikkelia viimeisen ${report.windowDays} päivän ajalta.`,
    ''
  )

  if (report.overused.length > 0) {
    lines.push(
      '**Loppuunkalutut keinot.** Näitä on käytetty niin usein, että ne ovat muuttuneet kaavaksi.',
      'Älä rakenna artikkelia näiden varaan, ellei aihe suorastaan vaadi sitä – ja jos vaatii,',
      'käytä keinoa sivuhuomiona, älä juonena:',
      ''
    )
    for (const motif of report.overused) {
      lines.push(
        `- **${motif.label}** – ${motif.count}/${report.articleCount} artikkelia (${percent(motif.share)}), esim. ${motif.examples.join(', ')}`
      )
    }
    lines.push('')
  } else {
    lines.push('Yksikään yksittäinen keino ei tällä hetkellä ylitä toistorajaa.', '')
  }

  if (report.categories.length > 0) {
    const distribution = report.categories
      .map((c) => `${c.category} ${c.count} (${percent(c.share)})`)
      .join(' · ')
    lines.push(`**Kategoriajakauma.** ${distribution}`, '')
  }

  if (report.unusedCategories.length > 0) {
    lines.push(
      `**Käyttämättömät kategoriat:** ${report.unusedCategories.join(', ')}. Suosi näitä, jos aihe antaa myöten.`,
      ''
    )
  }

  return lines.join('\n')
}
