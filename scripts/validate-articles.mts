/**
 * Validates newly added (untracked) articles in content/articles before the
 * generation workflow commits them. This re-applies the editorial gates for
 * articles written by the Claude Code action path, where the in-process
 * validateSatireOutput() never ran:
 *   - frontmatter schema (via parseArticleSource; the build re-checks this)
 *   - aiGenerated must be true for pipeline-produced articles
 *   - body word count 300–1000
 *   - banned-topic filter over title + summary + body
 *
 * Exits 1 on any violation so the workflow fails before committing.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseArticleSource } from '../src/lib/content'
import { isTopicSafe } from '../src/generation/safety'
import { wordCount } from '../src/lib/markdown'

const newFiles = execSync('git ls-files --others --exclude-standard content/articles', {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)

if (newFiles.length === 0) {
  console.log('No new articles to validate.')
  process.exit(0)
}

let failures = 0

for (const file of newFiles) {
  try {
    const article = parseArticleSource(fs.readFileSync(file, 'utf8'), path.basename(file))
    if (!article.aiGenerated) {
      throw new Error('pipeline-generated articles must set aiGenerated: true')
    }
    const words = wordCount(article.body)
    if (words < 300 || words > 1000) {
      throw new Error(`body word count ${words} out of range (300–1000)`)
    }
    if (!isTopicSafe(`${article.title} ${article.summary} ${article.body}`)) {
      throw new Error('content trips the banned-topic filter')
    }
    console.log(`OK   ${file} (${words} words, ${article.category})`)
  } catch (error) {
    console.error(`FAIL ${file}: ${(error as Error).message}`)
    failures++
  }
}

if (failures > 0) {
  console.error(`\n${failures} of ${newFiles.length} new article(s) failed validation.`)
  process.exit(1)
}
console.log(`\nAll ${newFiles.length} new article(s) passed validation.`)
