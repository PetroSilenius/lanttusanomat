import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { parseFrontmatter, ContentValidationError, type ParsedArticle } from './schema'

export interface Article extends ParsedArticle {
  /** Site-relative URL of the article page. */
  url: string
}

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), 'content', 'articles')
const DEFAULT_PUBLIC_DIR = path.join(process.cwd(), 'public')

function toArticle(parsed: ParsedArticle): Article {
  return { ...parsed, url: `/artikkeli/${parsed.slug}` }
}

/**
 * Ensures a referenced hero image actually exists as a static asset. A typo in
 * `heroImage` (a category variant or a bespoke `/images/articles/<slug>.svg`)
 * must fail the build loudly rather than ship a broken image.
 */
function assertHeroImageExists(article: ParsedArticle, publicDir: string): void {
  if (!article.heroImage) return
  const assetPath = path.join(publicDir, article.heroImage)
  if (!fs.existsSync(assetPath)) {
    throw new ContentValidationError(
      article.file,
      `heroImage "${article.heroImage}" does not exist under public/`
    )
  }
}

/** Parses a single Markdown document (frontmatter + body) into an Article. */
export function parseArticleSource(source: string, file: string): Article {
  const { data, content } = matter(source)
  return toArticle(parseFrontmatter(data, content, file))
}

/**
 * Loads, validates and sorts all published articles (newest first).
 * Throws on any invalid file or duplicate slug so bad content fails the build.
 */
export function loadArticles(
  contentDir: string = DEFAULT_CONTENT_DIR,
  publicDir: string = DEFAULT_PUBLIC_DIR
): Article[] {
  if (!fs.existsSync(contentDir)) {
    return []
  }
  const checkAssets = fs.existsSync(publicDir)
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  const articles: Article[] = []
  const slugs = new Map<string, string>()

  for (const file of files) {
    const source = fs.readFileSync(path.join(contentDir, file), 'utf8')
    const article = parseArticleSource(source, file)
    const existing = slugs.get(article.slug)
    if (existing) {
      throw new ContentValidationError(
        file,
        `duplicate slug "${article.slug}" (also in ${existing})`
      )
    }
    slugs.set(article.slug, file)
    if (checkAssets) {
      assertHeroImageExists(article, publicDir)
    }
    if (article.published) {
      articles.push(article)
    }
  }

  return articles.sort((a, b) => b.date.getTime() - a.date.getTime())
}

let cache: Article[] | undefined

/** Cached accessor used by pages; content is immutable within a build. */
export function getAllArticles(): Article[] {
  cache ??= loadArticles()
  return cache
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug)
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return getAllArticles().filter((a) => a.category === categorySlug)
}

export function getLatestArticles(limit: number): Article[] {
  return getAllArticles().slice(0, limit)
}

/** Other recent articles from the same category (for "read next"). */
export function getRelatedArticles(article: Article, limit: number): Article[] {
  const sameCategory = getArticlesByCategory(article.category).filter(
    (a) => a.slug !== article.slug
  )
  const others = getAllArticles().filter(
    (a) => a.slug !== article.slug && a.category !== article.category
  )
  return [...sameCategory, ...others].slice(0, limit)
}
