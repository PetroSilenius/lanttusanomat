/**
 * Daily topic selection for the satire generation workflow.
 *
 *   1. fetch Finnish news RSS headlines (Yle, HS, IS, IL)
 *   2. cluster & rank topics across sources, drop unsafe ones (banned-topic filter)
 *   3. print a briefing per topic (internal summary + source URLs)
 *
 * The briefing is consumed by the Claude Code GitHub Action, which writes the
 * actual articles (see .github/workflows/generate-articles.yml). Only headline-
 * level metadata is ever surfaced — never full source article text.
 *
 * Usage: pnpm select:topics [--count 2]
 */
import { feedSources } from '../src/generation/feeds'
import { fetchFeed } from '../src/generation/rss'
import {
  selectTopics,
  topicSummary,
  topicSourceUrls,
  type SourcedItem,
} from '../src/generation/topics'

const args = process.argv.slice(2)
const countIndex = args.indexOf('--count')
const articleCount = countIndex >= 0 ? Number(args[countIndex + 1]) : 2

console.error(`Fetching headlines from ${feedSources.length} sources…`)
const items: SourcedItem[] = []
for (const source of feedSources) {
  try {
    const feedItems = await fetchFeed(source.url)
    console.error(`  ${source.name}: ${feedItems.length} items`)
    items.push(
      ...feedItems.map((item) => ({ ...item, sourceId: source.id, sourceName: source.name }))
    )
  } catch (error) {
    // One dead feed must not kill the run; the others still provide topics.
    console.error(`  ${source.name} failed: ${(error as Error).message}`)
  }
}

if (items.length === 0) {
  console.error('No feed items available from any source; aborting.')
  process.exit(1)
}

// Offer a few more topics than needed so the writer can pick the best ones.
const topics = selectTopics(items, articleCount + 4)
console.error(`Selected ${topics.length} candidate topics (target: ${articleCount} articles).`)

// The briefing itself goes to stdout so the workflow can capture it.
console.log(`# Päivän aihe-ehdotukset (valitse ${articleCount} parasta)\n`)
for (const topic of topics) {
  console.log(`## ${topic.title} (${topic.sourceCount} lähdettä)`)
  console.log(topicSummary(topic))
  console.log('\nLähteet (originalSources-kenttään):')
  for (const url of topicSourceUrls(topic)) {
    console.log(`- ${url}`)
  }
  console.log('')
}
