import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeXmlEntities, parseRssItems } from '@/generation/rss'

const feedXml = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'feed.xml'), 'utf8')

describe('parseRssItems', () => {
  const items = parseRssItems(feedXml)

  it('parses well-formed items and skips items without a link', () => {
    expect(items).toHaveLength(2)
  })

  it('unwraps CDATA and decodes entities in titles', () => {
    expect(items[0]!.title).toBe('Eduskunta äänesti uudesta laista & hyväksyi sen')
  })

  it('strips HTML from descriptions', () => {
    expect(items[0]!.description).toBe(
      'Laki hyväksyttiin äänin 100–99. Oppositio vaati lisäselvityksiä.'
    )
  })

  it('decodes numeric entities', () => {
    expect(items[1]!.description).toContain('syksyllä')
  })

  it('parses publication dates', () => {
    expect(items[0]!.pubDate?.toISOString()).toBe('2026-07-01T06:00:00.000Z')
  })

  it('returns an empty list for non-RSS input', () => {
    expect(parseRssItems('<html><body>ei rss</body></html>')).toEqual([])
  })
})

describe('decodeXmlEntities', () => {
  it('decodes named, decimal and hex entities', () => {
    expect(decodeXmlEntities('&lt;b&gt; &amp; &#228; &#xE4; &quot;x&quot;')).toBe('<b> & ä ä "x"')
  })
})
