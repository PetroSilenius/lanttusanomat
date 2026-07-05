/**
 * Editorial gate for the generation workflow. For each newly added (untracked)
 * article in content/articles it applies validateGeneratedArticle() (schema,
 * aiGenerated, word count, banned-topic filter).
 *
 * Invalid articles are *removed* rather than aborting the whole batch, so one
 * bad article no longer discards the valid ones written alongside it — the
 * workflow goes on to build and commit whatever passed. The run only fails
 * (exit 1) when none of the new articles are valid, so an empty or all-garbage
 * batch still surfaces as a red run.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { validateGeneratedArticle } from '../src/generation/editorial'

const newFiles = execSync('git ls-files --others --exclude-standard content/articles', {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)

if (newFiles.length === 0) {
  console.log('No new articles to validate.')
  process.exit(0)
}

let kept = 0
let removed = 0

for (const file of newFiles) {
  const result = validateGeneratedArticle(fs.readFileSync(file, 'utf8'), path.basename(file))
  if (result.ok) {
    console.log(`OK   ${file} (${result.words} words, ${result.category})`)
    kept++
  } else {
    console.error(`FAIL ${file}: ${result.reason} — removing it`)
    fs.rmSync(file)
    removed++
  }
}

if (removed > 0) {
  console.error(`\nRemoved ${removed} invalid article(s); kept ${kept} valid one(s).`)
}

if (kept === 0) {
  console.error('No valid new articles remain; failing the run.')
  process.exit(1)
}

console.log(`\n${kept} of ${newFiles.length} new article(s) passed validation.`)
