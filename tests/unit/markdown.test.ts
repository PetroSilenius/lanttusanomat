import { describe, expect, it } from 'vitest'
import { markdownToHtml, markdownToPlainText, readingTimeMinutes, wordCount } from '@/lib/markdown'

describe('markdownToHtml', () => {
  it('renders headings, emphasis and paragraphs', async () => {
    const html = await markdownToHtml('## Väliotsikko\n\nTeksti **lihavoituna** ja *kursiivilla*.')
    expect(html).toContain('<h2>Väliotsikko</h2>')
    expect(html).toContain('<strong>lihavoituna</strong>')
    expect(html).toContain('<em>kursiivilla</em>')
  })

  it('does not pass raw HTML through', async () => {
    const html = await markdownToHtml('Teksti <script>alert(1)</script>')
    expect(html).not.toContain('<script>')
  })
})

describe('markdownToPlainText', () => {
  it('strips markdown syntax', () => {
    const text = markdownToPlainText(
      '## Otsikko\n\n**Lihava** [linkki](https://example.com) `koodi`'
    )
    expect(text).toBe('Otsikko Lihava linkki koodi')
  })
})

describe('wordCount & readingTimeMinutes', () => {
  it('counts words of markdown body', () => {
    expect(wordCount('yksi kaksi **kolme**')).toBe(3)
    expect(wordCount('')).toBe(0)
  })

  it('estimates reading time with a 1 minute floor', () => {
    expect(readingTimeMinutes('lyhyt teksti')).toBe(1)
    const longText = Array.from({ length: 450 }, (_, i) => `sana${i}`).join(' ')
    expect(readingTimeMinutes(longText)).toBe(2)
  })
})
