import { z } from 'zod'
import { categorySlugs } from './categories'

/** Kebab-case slug: lowercase latin letters, digits and single hyphens. */
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const articleFrontmatterSchema = z
  .object({
    title: z.string().min(5).max(200),
    slug: z.string().regex(slugPattern, 'slug must be kebab-case ([a-z0-9-])').min(3).max(120),
    date: z.coerce.date(),
    author: z.string().min(2).max(100),
    category: z.string().refine((c) => categorySlugs.includes(c), {
      message: `category must be one of: ${categorySlugs.join(', ')}`,
    }),
    summary: z.string().min(10).max(500),
    tags: z.array(z.string().min(1).max(50)).min(1).max(10),
    aiGenerated: z.boolean(),
    /** Editorial traceability only. Never rendered anywhere on the site. */
    originalSources: z.array(z.string().url()).optional().default([]),
    heroImage: z.string().startsWith('/').optional(),
    published: z.boolean().default(true),
  })
  .strict()

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>

export interface ParsedArticle extends ArticleFrontmatter {
  /** Raw Markdown body (without frontmatter). */
  body: string
  /** Source file name, for error messages. */
  file: string
}

export class ContentValidationError extends Error {
  constructor(file: string, detail: string) {
    super(`Invalid article "${file}": ${detail}`)
    this.name = 'ContentValidationError'
  }
}

/**
 * Validates frontmatter for a single article. Throws ContentValidationError
 * with a readable message so a broken article fails the build loudly.
 */
export function parseFrontmatter(data: unknown, body: string, file: string): ParsedArticle {
  const result = articleFrontmatterSchema.safeParse(data)
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    throw new ContentValidationError(file, detail)
  }
  if (body.trim().length < 50) {
    throw new ContentValidationError(file, 'body must contain at least 50 characters')
  }
  return { ...result.data, body, file }
}
