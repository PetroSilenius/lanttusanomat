/**
 * Editorial safety filter.
 *
 * First line of defense: topics matching these Finnish keyword stems are
 * excluded from satire generation entirely. The Satire Skill prompt repeats
 * the same policy as a second line, and output validation re-checks the
 * result as a third.
 *
 * The third pass runs over a whole 400-700 word article rather than a
 * headline, so plain substring matching alone rejected too much ordinary
 * figurative Finnish ("hintasota", "iskulause", "sähköpostitulva"). Stems are
 * therefore matched in one of two ways, and a short list of unambiguously
 * non-violent terms is redacted before matching at all.
 */

// Stems are chosen to survive Finnish inflection (e.g. 'hyökkä' matches both
// 'hyökkäys' and 'hyökkäyksestä'); prefer the shortest unambiguous prefix.
//
// These are matched anywhere in the text, compounds included, because the
// stem denotes the banned subject wherever it appears ('ihmisuhri' is as
// much a victim as 'uhri').
const BANNED_STEMS: readonly string[] = [
  // war & armed conflict
  'hyökkä',
  'ohjus',
  'pommi',
  'rintama',
  'miehitys',
  'asevoim',
  'aseelli',
  'kranaat',
  'drooni-isku',
  // weapons & violence
  'terrori',
  'ammuskel',
  'pistooli',
  'kivääri',
  'puukot',
  'väkivalta',
  'murha',
  'surma',
  'tappo',
  'panttivanki',
  'sieppa',
  'raiska',
  'pahoinpitely',
  // death & tragedy
  'kuoli',
  'kuolem',
  'kuollut',
  'kuolonuhr',
  'menehty',
  'hukku',
  'uhri',
  'uhre',
  'hautajais',
  'suruliput',
  // accidents & disasters
  'onnettomuu',
  'turma',
  'kolari',
  'tulipalo',
  'palokuol',
  'räjähd',
  'loukkaantu',
  'maanjäristy',
  'hirmumyrsky',
  'katastrof',
  // illness & health crises
  'syöpä',
  'syövä',
  'sairaus',
  'sairaud',
  'epidemia',
  'pandemia',
  'tehohoito',
  'itsemurha',
  'mielenterveyskriis',
  'yliannostu',
  // crime with victims & vulnerable people
  'hyväksikäyt',
  'ihmiskauppa',
  'lapsiin kohdistu',
  'kaltoinkohtelu',
  'kadonnut',
  'kadonne',
  'etsintäkuulut',
]

// Stems that denote the banned subject only when they *begin* a word. As the
// tail of a compound the same letters are routine metaphor — 'hintasota',
// 'kauppasota', 'sähköpostitulva', 'hintaisku', 'lamppu' — while every real
// use ('sota', 'sodan', 'iskuja', 'ampui', 'tulvat') still starts a word.
// A hyphen counts as a word break, so 'pommi-isku' is matched too.
const WORD_INITIAL_STEMS: readonly string[] = ['sota', 'sodan', 'sodas', 'isku', 'ampu', 'tulva']

// Everyday non-violent terms that would otherwise be caught by a stem above.
// They are blanked out before matching, so the stem inside them cannot fire.
// Keep this list short and unambiguous: each entry must be a term no satire
// about a banned subject could hide behind.
const SAFE_TERMS: readonly string[] = [
  'iskulause', // slogan
  'iskusana', // buzzword
  'räjähdysmäi', // 'räjähdysmäinen kasvu' — explosive growth
  'katastrofaali', // hyperbole, not a disaster
  'murhaava', // 'murhaava katse' — withering
]

/** Splits text into words; any non-letter, non-digit run is a word break. */
function words(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

/** Blanks out the known-safe terms so the stems inside them cannot match. */
function redactSafeTerms(lowercased: string): string {
  return SAFE_TERMS.reduce((text, term) => text.split(term).join(' '), lowercased)
}

/**
 * Returns the banned stem the text trips on, or null when it is safe raw
 * material for satire. Callers report the stem so a false positive is
 * diagnosable from the log instead of guessable.
 */
export function findBannedStem(text: string): string | null {
  const haystack = redactSafeTerms(text.toLowerCase())

  const anywhere = BANNED_STEMS.find((stem) => haystack.includes(stem))
  if (anywhere) return anywhere

  const wordList = words(haystack)
  return WORD_INITIAL_STEMS.find((stem) => wordList.some((word) => word.startsWith(stem))) ?? null
}

/** Returns true when the text is safe raw material for satire. */
export function isTopicSafe(text: string): boolean {
  return findBannedStem(text) === null
}

/** Filters a list of texts down to those safe for satire. */
export function filterSafe<T>(items: T[], toText: (item: T) => string): T[] {
  return items.filter((item) => isTopicSafe(toText(item)))
}
