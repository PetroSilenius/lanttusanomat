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
 *
 * With --dry-run nothing is deleted: every article is reported with the reason
 * it would be rejected, and the exit code is 1 if *any* article is invalid.
 * That is the mode the article writer runs inside the workflow, so it can see
 * the gate it will be judged by and rewrite before the real pass deletes
 * anything.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { validateGeneratedArticle } from '../src/generation/editorial'

const dryRun = process.argv.includes('--dry-run')

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
let invalid = 0

for (const file of newFiles) {
  const result = validateGeneratedArticle(fs.readFileSync(file, 'utf8'), path.basename(file))
  if (result.ok) {
    console.log(`OK   ${file} (${result.words} words, ${result.category})`)
    kept++
  } else {
    console.error(`FAIL ${file}: ${result.reason}${dryRun ? '' : ' — removing it'}`)
    if (!dryRun) fs.rmSync(file)
    invalid++
  }
}

if (dryRun) {
  if (invalid > 0) {
    console.error(
      `\n${invalid} of ${newFiles.length} new article(s) would be rejected. ` +
        'Rewrite them and run this again — the workflow deletes what does not pass.'
    )
    process.exit(1)
  }
  console.log(`\nAll ${kept} new article(s) pass the editorial gate.`)
  process.exit(0)
}

if (invalid > 0) {
  console.error(`\nRemoved ${invalid} invalid article(s); kept ${kept} valid one(s).`)
}

if (kept === 0) {
  console.error('No valid new articles remain; failing the run.')
  process.exit(1)
}

console.log(`\n${kept} of ${newFiles.length} new article(s) passed validation.`)
