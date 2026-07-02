import type { RssItem } from './rss'
import { isTopicSafe } from './safety'

/**
 * Cross-source topic selection.
 *
 * Items from different outlets are clustered by significant-token overlap;
 * a topic covered by several outlets is "today's major news". Only the
 * distilled internal summary (titles + descriptions of the cluster) is ever
 * passed onward — never article text.
 */

export interface SourcedItem extends RssItem {
  sourceId: string
  sourceName: string
}

export interface Topic {
  /** Representative title (from the largest-source item). */
  title: string
  items: SourcedItem[]
  /** Number of distinct sources covering the topic. */
  sourceCount: number
}

/** Finnish-ish stopwords that carry no topical signal. */
const STOPWORDS = new Set([
  'ja',
  'on',
  'ei',
  'se',
  'että',
  'kun',
  'nyt',
  'yle',
  'hs',
  'oli',
  'ovat',
  'tämä',
  'joka',
  'mutta',
  'myös',
  'jo',
  'vielä',
  'voi',
  'saa',
  'yli',
  'noin',
  'uusi',
  'suuri',
  'suomen',
  'suomi',
  'suomessa',
  'vuoden',
  'vuotta',
  'euroa',
  'miljoonaa',
  'prosenttia',
  'kello',
  'tänään',
  'eilen',
  'huomenna',
])

export function significantTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-zäöå0-9]+/)
      .filter((token) => token.length >= 4 && !STOPWORDS.has(token))
      // crude stemming: compare the first 6 chars so Finnish case endings match
      .map((token) => token.slice(0, 6))
  )
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0
  for (const token of a) if (b.has(token)) count++
  return count
}

/** Clusters items across sources; requires >=2 shared significant tokens. */
export function clusterTopics(items: SourcedItem[]): Topic[] {
  const clusters: { tokens: Set<string>; items: SourcedItem[] }[] = []

  for (const item of items) {
    const tokens = significantTokens(`${item.title} ${item.description}`)
    const match = clusters.find((cluster) => overlap(cluster.tokens, tokens) >= 2)
    if (match) {
      match.items.push(item)
      for (const token of tokens) match.tokens.add(token)
    } else {
      clusters.push({ tokens, items: [item] })
    }
  }

  return clusters
    .map((cluster) => {
      const sources = new Set(cluster.items.map((i) => i.sourceId))
      return {
        title: cluster.items[0]!.title,
        items: cluster.items,
        sourceCount: sources.size,
      }
    })
    .sort((a, b) => b.sourceCount - a.sourceCount || b.items.length - a.items.length)
}

/**
 * Picks the top safe topics: safety-filtered, multi-source coverage ranked
 * first. Topics whose combined text trips the safety filter are dropped.
 */
export function selectTopics(items: SourcedItem[], count: number): Topic[] {
  const safeItems = items.filter((item) => isTopicSafe(`${item.title} ${item.description}`))
  return clusterTopics(safeItems)
    .filter((topic) => isTopicSafe(topicSummary(topic)))
    .slice(0, count)
}

/**
 * Builds the internal factual summary handed to the Satire Skill.
 * Metadata only — headlines and RSS descriptions, clearly labeled as
 * inspiration that must not be reproduced.
 */
export function topicSummary(topic: Topic): string {
  const lines = topic.items
    .slice(0, 5)
    .map(
      (item) =>
        `- [${item.sourceName}] ${item.title}${item.description ? ` — ${item.description}` : ''}`
    )
  return lines.join('\n')
}

/** Source URLs for frontmatter traceability (never rendered on the site). */
export function topicSourceUrls(topic: Topic): string[] {
  return [...new Set(topic.items.map((item) => item.link))].slice(0, 5)
}
