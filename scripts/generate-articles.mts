/**
 * Daily satire generation orchestrator (Phase 2 automation).
 *
 * Run by .github/workflows/generate-articles.yml on a schedule:
 *   1. fetch Finnish news RSS headlines (Yle, HS, IS, IL)
 *   2. cluster & rank topics across sources, drop unsafe ones
 *   3. build internal factual summaries
 *   4. generate original satire via the Satire Skill + Claude API
 *   5. validate output, write Markdown into content/articles/
 * The workflow then commits the files, which triggers a Cloudflare deploy.
 *
 * Fail-safe by design: an invalid or declined generation is skipped, never
 * published. Exit code 0 with zero articles is a valid (quiet news day) run.
 *
 * Usage: pnpm generate:articles [--count 2] [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import { feedSources } from '../src/generation/feeds'
import { fetchFeed } from '../src/generation/rss'
import {
  selectTopics,
  topicSummary,
  topicSourceUrls,
  type SourcedItem,
} from '../src/generation/topics'
import { generateSatire } from '../src/generation/client'
import { loadSatireSkill, buildTopicPrompt } from '../src/generation/skill'
import {
  validateSatireOutput,
  toMarkdownFile,
  GenerationValidationError,
} from '../src/generation/article'
import { loadArticles } from '../src/lib/content'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const countIndex = args.indexOf('--count')
const articleCount = countIndex >= 0 ? Number(args[countIndex + 1]) : 2

if (!process.env.ANTHROPIC_API_KEY && !dryRun) {
  console.error('ANTHROPIC_API_KEY is not set; aborting.')
  process.exit(1)
}

const contentDir = path.join(process.cwd(), 'content', 'articles')
const existing = loadArticles(contentDir)
const existingTitles = existing.slice(0, 20).map((a) => a.title)
const existingSlugs = new Set(existing.map((a) => a.slug))

console.log(`Fetching headlines from ${feedSources.length} sources…`)
const items: SourcedItem[] = []
for (const source of feedSources) {
  try {
    const feedItems = await fetchFeed(source.url)
    console.log(`  ${source.name}: ${feedItems.length} items`)
    items.push(
      ...feedItems.map((item) => ({ ...item, sourceId: source.id, sourceName: source.name }))
    )
  } catch (error) {
    // One dead feed must not kill the run; the others still provide topics.
    console.warn(`  ${source.name} failed: ${(error as Error).message}`)
  }
}

if (items.length === 0) {
  console.error('No feed items available from any source; aborting.')
  process.exit(1)
}

// Over-select topics so validation failures can fall through to the next one.
const topics = selectTopics(items, articleCount * 3)
console.log(`Selected ${topics.length} candidate topics (target: ${articleCount} articles).`)

if (dryRun) {
  for (const topic of topics) {
    console.log(`\n--- ${topic.title} (${topic.sourceCount} sources) ---`)
    console.log(topicSummary(topic))
  }
  process.exit(0)
}

const skill = loadSatireSkill()
let published = 0

for (const topic of topics) {
  if (published >= articleCount) break
  console.log(`\nGenerating from topic: ${topic.title}`)
  try {
    const output = await generateSatire(
      skill,
      buildTopicPrompt(topicSummary(topic), existingTitles)
    )
    validateSatireOutput(
      output,
      topic.items.map((item) => item.title)
    )
    const file = toMarkdownFile({
      output,
      date: new Date(),
      originalSources: topicSourceUrls(topic),
    })
    const { slug } = /slug: (?<slug>.*)/.exec(file.content)?.groups ?? {}
    if (slug && existingSlugs.has(slug)) {
      console.warn(`  skipped: slug "${slug}" already exists`)
      continue
    }
    fs.writeFileSync(path.join(contentDir, file.filename), file.content)
    console.log(`  wrote content/articles/${file.filename}`)
    existingTitles.unshift(output.headline)
    if (slug) existingSlugs.add(slug)
    published++
  } catch (error) {
    if (error instanceof GenerationValidationError) {
      console.warn(`  rejected: ${error.message}`)
    } else {
      console.error(`  generation failed: ${(error as Error).message}`)
    }
  }
}

// Verify the new content passes the same validation the site build runs.
loadArticles(contentDir)
console.log(`\nDone: ${published}/${articleCount} article(s) generated.`)
