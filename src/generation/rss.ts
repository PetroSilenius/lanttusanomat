/**
 * Minimal, dependency-free RSS 2.0 item parser.
 * We only need title/link/description/pubDate from well-formed feeds of the
 * major Finnish outlets; a full XML parser would be overkill for that.
 */

export interface RssItem {
  title: string
  link: string
  description: string
  pubDate?: Date
}

function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match?.[1]?.trim()
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1').trim()
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function cleanText(raw: string): string {
  return decodeXmlEntities(stripHtml(stripCdata(raw)))
}

/** Parses `<item>` elements out of an RSS 2.0 document. Skips malformed items. */
export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  for (const block of blocks) {
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    if (!title || !link) continue
    const description = extractTag(block, 'description') ?? ''
    const pubDateRaw = extractTag(block, 'pubDate')
    const pubDate = pubDateRaw ? new Date(pubDateRaw) : undefined
    items.push({
      title: cleanText(title),
      link: cleanText(link),
      description: cleanText(description),
      pubDate: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : undefined,
    })
  }
  return items
}

export async function fetchFeed(url: string, timeoutMs = 15000): Promise<RssItem[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Lanttusanomat-bot/1.0 (+satire; topic discovery only)' },
    })
    if (!response.ok) {
      throw new Error(`Feed ${url} responded with HTTP ${response.status}`)
    }
    return parseRssItems(await response.text())
  } finally {
    clearTimeout(timer)
  }
}
