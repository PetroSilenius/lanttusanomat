/**
 * Editorial gate for a single pipeline-generated article.
 *
 * This is the third line of the safety policy (after the topic filter and the
 * Satire Skill prompt): it re-checks the article the Claude Code action wrote
 * before anything is committed. Pure and unit-tested — the workflow wrapper
 * (scripts/validate-articles.mts) supplies the file source and handles the
 * git/fs side effects.
 */
import { parseArticleSource } from '../lib/content'
import { wordCount } from '../lib/markdown'
import { isTopicSafe } from './safety'

export const MIN_WORDS = 300
export const MAX_WORDS = 1000

export type ArticleValidation =
  { ok: true; words: number; category: string } | { ok: false; reason: string }

/**
 * Applies the editorial gates to a raw article file:
 *   - frontmatter schema (via parseArticleSource; the build re-checks this)
 *   - aiGenerated must be true for pipeline-produced articles
 *   - body word count within [MIN_WORDS, MAX_WORDS]
 *   - banned-topic filter over title + summary + body
 *
 * Returns a verdict instead of throwing so the caller can quarantine a single
 * bad article while still shipping the valid ones in the same batch.
 */
export function validateGeneratedArticle(source: string, filename: string): ArticleValidation {
  let article
  try {
    article = parseArticleSource(source, filename)
  } catch (error) {
    return { ok: false, reason: (error as Error).message }
  }

  if (!article.aiGenerated) {
    return { ok: false, reason: 'pipeline-generated articles must set aiGenerated: true' }
  }

  const words = wordCount(article.body)
  if (words < MIN_WORDS || words > MAX_WORDS) {
    return {
      ok: false,
      reason: `body word count ${words} out of range (${MIN_WORDS}–${MAX_WORDS})`,
    }
  }

  if (!isTopicSafe(`${article.title} ${article.summary} ${article.body}`)) {
    return { ok: false, reason: 'content trips the banned-topic filter' }
  }

  return { ok: true, words, category: article.category }
}
