/**
 * Editorial safety filter.
 *
 * First line of defense: topics matching these Finnish keyword stems are
 * excluded from satire generation entirely. The Satire Skill prompt repeats
 * the same policy as a second line, and output validation re-checks the
 * result as a third.
 */

// Stems are chosen to survive Finnish inflection (e.g. 'hyökkä' matches both
// 'hyökkäys' and 'hyökkäyksestä'); prefer the shortest unambiguous prefix.
const BANNED_STEMS: readonly string[] = [
  // war & armed conflict
  'sota',
  'sodan',
  'sodas',
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
  'isku',
  'ampu',
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
  'tulva',
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

/** Returns true when the text is safe raw material for satire. */
export function isTopicSafe(text: string): boolean {
  const haystack = text.toLowerCase()
  return !BANNED_STEMS.some((stem) => haystack.includes(stem))
}

/** Filters a list of texts down to those safe for satire. */
export function filterSafe<T>(items: T[], toText: (item: T) => string): T[] {
  return items.filter((item) => isTopicSafe(toText(item)))
}
