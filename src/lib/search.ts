/**
 * Dependency-free client-side search.
 *
 * The index is built at build time (see /search-index.json route) and queried
 * in the browser. Scoring is simple weighted token matching with prefix
 * support — plenty for a few hundred articles, and it works offline because
 * the service worker caches the index.
 */

export interface SearchDoc {
  slug: string
  url: string
  title: string
  summary: string
  category: string
  categoryName: string
  tags: string[]
  date: string
  aiGenerated: boolean
  /** Plain-text body (truncated) for full-text matching. */
  body: string
}

const FIELD_WEIGHTS: Record<'title' | 'summary' | 'tags' | 'category' | 'body', number> = {
  title: 10,
  summary: 5,
  tags: 6,
  category: 4,
  body: 1,
}

/** Lowercases and splits text into searchable tokens (Finnish letters kept). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9äöåé]+/i)
    .filter((t) => t.length >= 2)
}

function fieldScore(fieldTokens: string[], queryToken: string, weight: number): number {
  let score = 0
  for (const token of fieldTokens) {
    if (token === queryToken) {
      score += weight
    } else if (token.startsWith(queryToken) && queryToken.length >= 3) {
      score += weight / 2
    }
  }
  return score
}

export interface SearchResult {
  doc: SearchDoc
  score: number
}

/**
 * Returns matching documents sorted by score (desc), then date (desc).
 * Every query token must match at least one field (AND semantics).
 */
export function searchArticles(docs: SearchDoc[], query: string, limit = 20): SearchResult[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const results: SearchResult[] = []
  for (const doc of docs) {
    const fields = {
      title: tokenize(doc.title),
      summary: tokenize(doc.summary),
      tags: tokenize(doc.tags.join(' ')),
      category: tokenize(`${doc.category} ${doc.categoryName}`),
      body: tokenize(doc.body),
    }
    let total = 0
    let allMatched = true
    for (const queryToken of queryTokens) {
      let tokenScore = 0
      for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [
        keyof typeof FIELD_WEIGHTS,
        number,
      ][]) {
        tokenScore += fieldScore(fields[field], queryToken, weight)
      }
      if (tokenScore === 0) {
        allMatched = false
        break
      }
      total += tokenScore
    }
    if (allMatched && total > 0) {
      results.push({ doc, score: total })
    }
  }

  return results
    .sort((a, b) => b.score - a.score || b.doc.date.localeCompare(a.doc.date))
    .slice(0, limit)
}
