import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify)

/**
 * Renders trusted repository Markdown to HTML at build time.
 * Content only ever comes from reviewed files in `content/articles`
 * (raw HTML in Markdown is not enabled), never from user input.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await processor.process(markdown)
  return String(file)
}

/** Strips Markdown syntax to plain text (for search indexing and excerpts). */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Rough word count of a Markdown body. */
export function wordCount(markdown: string): number {
  const text = markdownToPlainText(markdown)
  return text.length === 0 ? 0 : text.split(/\s+/).length
}

/** Reading time in whole minutes (Finnish average ~200 wpm), minimum 1. */
export function readingTimeMinutes(markdown: string): number {
  return Math.max(1, Math.round(wordCount(markdown) / 200))
}
