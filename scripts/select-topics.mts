/**
 * Daily topic selection for the satire generation workflow.
 *
 *   1. fetch Finnish news RSS headlines (Yle, HS, IS, IL)
 *   2. cluster & rank topics across sources, drop unsafe ones (banned-topic filter)
 *   3. print a briefing per topic (internal summary + source URLs)
 *   4. append a repetition report over recently published articles, so the
 *      writer knows which satirical devices are already worn out
 *
 * The briefing is consumed by the Claude Code GitHub Action, which writes the
 * actual articles (see .github/workflows/generate-articles.yml). Only headline-
 * level metadata is ever surfaced — never full source article text.
 *
 * Usage: pnpm select:topics [--count 2] [--window 14]
 */
import { categorySlugs } from '../src/lib/categories'
import { loadArticles } from '../src/lib/content'
import { feedSources } from '../src/generation/feeds'
import { analyzeMotifs, formatMotifBriefing, DEFAULT_WINDOW_DAYS } from '../src/generation/motifs'
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
const windowIndex = args.indexOf('--window')
const windowDays = windowIndex >= 0 ? Number(args[windowIndex + 1]) : DEFAULT_WINDOW_DAYS

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

// The anti-repetition report. Reading published content can't fail the run:
// a briefing without it is still usable, one that aborts the workflow is not.
try {
  const report = analyzeMotifs(loadArticles(), categorySlugs, windowDays)
  console.error(
    `Analysed ${report.articleCount} recent article(s); ${report.overused.length} overused motif(s).`
  )
  console.log(formatMotifBriefing(report))
} catch (error) {
  console.error(`Motif analysis failed: ${(error as Error).message}`)
}
