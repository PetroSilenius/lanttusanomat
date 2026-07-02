// zod/v4 subpath: the Anthropic SDK's zodOutputFormat helper requires a v4 schema.
import { z } from 'zod/v4'
import { categorySlugs } from '../lib/categories'
import { isTopicSafe } from './safety'
import { significantTokens } from './topics'

/** Structured output schema the model must produce (see skills/satiiri/SKILL.md). */
export const satireOutputSchema = z.object({
  declined: z
    .boolean()
    .describe('true jos aihe kuuluu kiellettyihin aiheisiin eikä artikkelia voi kirjoittaa'),
  headline: z.string().describe('Uutismainen otsikko, max 120 merkkiä'),
  ingress: z.string().describe('1–2 virkkeen kärki (deck), max 300 merkkiä'),
  body: z.string().describe('Leipäteksti Markdownina, 400–800 sanaa, ##-väliotsikot'),
  category: z.string().describe('Yksi kategorioista: ' + categorySlugs.join(', ')),
  tags: z.array(z.string()).describe('3–6 suomenkielistä avainsanaa pienillä kirjaimilla'),
  seoDescription: z.string().describe('Hakukonekuvaus, max 155 merkkiä'),
})

export type SatireOutput = z.infer<typeof satireOutputSchema>

export class GenerationValidationError extends Error {
  override name = 'GenerationValidationError'
}

function bodyWordCount(body: string): number {
  return body.split(/\s+/).filter(Boolean).length
}

/**
 * Post-generation validation, the third safety line:
 * structural limits, category whitelist, banned-topic re-check, and an
 * originality check that rejects headlines overlapping source headlines.
 */
export function validateSatireOutput(output: SatireOutput, sourceTitles: string[]): void {
  if (output.declined) {
    throw new GenerationValidationError('model declined the topic (banned subject matter)')
  }
  if (output.headline.length < 15 || output.headline.length > 140) {
    throw new GenerationValidationError(`headline length ${output.headline.length} out of range`)
  }
  if (output.ingress.length < 20 || output.ingress.length > 400) {
    throw new GenerationValidationError(`ingress length ${output.ingress.length} out of range`)
  }
  const words = bodyWordCount(output.body)
  if (words < 300 || words > 1000) {
    throw new GenerationValidationError(`body word count ${words} out of range (300–1000)`)
  }
  if (!categorySlugs.includes(output.category)) {
    throw new GenerationValidationError(`unknown category "${output.category}"`)
  }
  if (output.tags.length < 1 || output.tags.length > 10) {
    throw new GenerationValidationError('tags count out of range')
  }
  if (output.seoDescription.length < 20 || output.seoDescription.length > 200) {
    throw new GenerationValidationError('seoDescription length out of range')
  }
  const fullText = `${output.headline} ${output.ingress} ${output.body}`
  if (!isTopicSafe(fullText)) {
    throw new GenerationValidationError('generated content tripped the banned-topic filter')
  }
  for (const sourceTitle of sourceTitles) {
    const sourceTokens = significantTokens(sourceTitle)
    if (sourceTokens.size < 3) continue
    const headlineTokens = significantTokens(output.headline)
    let shared = 0
    for (const token of sourceTokens) if (headlineTokens.has(token)) shared++
    if (shared / sourceTokens.size > 0.6) {
      throw new GenerationValidationError(
        `headline overlaps a source headline too closely: "${sourceTitle}"`
      )
    }
  }
}

/** Derives a URL slug from a Finnish headline. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äå]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 8)
    .join('-')
}

function yamlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

export interface ArticleFileInput {
  output: SatireOutput
  date: Date
  originalSources: string[]
}

/** Serializes a validated satire output into a content/articles Markdown file. */
export function toMarkdownFile({ output, date, originalSources }: ArticleFileInput): {
  filename: string
  content: string
} {
  const slug = slugify(output.headline)
  const isoDate = date.toISOString()
  const dayStamp = isoDate.slice(0, 10)
  const lines = [
    '---',
    `title: ${yamlString(output.headline)}`,
    `slug: ${slug}`,
    `date: ${isoDate}`,
    'author: Lanttusanomat AI-toimitus',
    `category: ${output.category}`,
    'summary: >-',
    `  ${output.ingress.replace(/\s+/g, ' ').trim()}`,
    `tags: [${output.tags.map((tag) => tag.toLowerCase()).join(', ')}]`,
    'aiGenerated: true',
    'originalSources:',
    ...(originalSources.length > 0
      ? originalSources.map((url) => `  - ${yamlString(url)}`)
      : ['  []'].map(() => '  []')),
    `heroImage: /images/heroes/${output.category}.svg`,
    'published: true',
    '---',
    '',
    output.body.trim(),
    '',
  ]
  // YAML edge case: an empty list can't follow a `key:` line item-style
  const content = lines.join('\n').replace('originalSources:\n  []', 'originalSources: []')
  return { filename: `${dayStamp}-${slug}.md`, content }
}
