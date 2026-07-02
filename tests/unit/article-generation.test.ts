import { describe, expect, it } from 'vitest'
import {
  GenerationValidationError,
  slugify,
  toMarkdownFile,
  validateSatireOutput,
  type SatireOutput,
} from '@/generation/article'
import { parseArticleSource } from '@/lib/content'

function validOutput(overrides: Partial<SatireOutput> = {}): SatireOutput {
  const body = [
    'Lanttusanomien testiartikkelin leipäteksti alkaa tästä ja jatkuu riittävän pitkänä.',
    '',
    '## Ensimmäinen väliotsikko',
    '',
    Array.from({ length: 200 }, (_, i) => `sana${i}`).join(' '),
    '',
    '## Toinen väliotsikko',
    '',
    Array.from({ length: 200 }, (_, i) => `lisäsana${i}`).join(' '),
  ].join('\n')
  return {
    declined: false,
    headline: 'Virasto perusti työryhmän selvittämään jonotuskulttuurin tilaa',
    ingress: 'Työryhmän ensimmäinen kokous alkaa heti, kun kaikki ovat ehtineet jonottaa kahvia.',
    body,
    category: 'politiikka',
    tags: ['byrokratia', 'jonottaminen', 'työryhmät'],
    seoDescription: 'Satiiri: virasto selvittää jonotuskulttuurin tilaa uudella työryhmällä.',
    ...overrides,
  }
}

describe('validateSatireOutput', () => {
  it('accepts a valid output', () => {
    expect(() => validateSatireOutput(validOutput(), [])).not.toThrow()
  })

  it('rejects declined outputs', () => {
    expect(() => validateSatireOutput(validOutput({ declined: true }), [])).toThrow(
      GenerationValidationError
    )
  })

  it('rejects out-of-range word counts', () => {
    expect(() => validateSatireOutput(validOutput({ body: 'liian lyhyt teksti' }), [])).toThrow(
      /word count/
    )
  })

  it('rejects unknown categories', () => {
    expect(() => validateSatireOutput(validOutput({ category: 'sekalaista' }), [])).toThrow(
      /unknown category/
    )
  })

  it('rejects content that trips the banned-topic filter', () => {
    const output = validOutput()
    expect(() =>
      validateSatireOutput({ ...output, body: `${output.body}\n\nSitten alkoi sota.` }, [])
    ).toThrow(/banned-topic/)
  })

  it('rejects headlines that overlap a source headline too closely', () => {
    const sourceTitle = 'Virasto perusti työryhmän selvittämään jonotuskulttuurin tilaa'
    expect(() => validateSatireOutput(validOutput(), [sourceTitle])).toThrow(/overlaps/)
  })

  it('allows headlines on the same theme with different wording', () => {
    expect(() =>
      validateSatireOutput(validOutput(), ['Jonot kasvavat virastoissa ympäri maan tänä vuonna'])
    ).not.toThrow()
  })
})

describe('slugify', () => {
  it('transliterates Finnish characters and limits length', () => {
    expect(slugify('Äänekosken öljylämmitys päättyi')).toBe('aanekosken-oljylammitys-paattyi')
    expect(slugify('Yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän')).toBe(
      'yksi-kaksi-kolme-nelja-viisi-kuusi-seitseman-kahdeksan'
    )
  })

  it('strips punctuation', () => {
    expect(slugify('Otsikko: "erikoismerkit" pois!')).toBe('otsikko-erikoismerkit-pois')
  })
})

describe('toMarkdownFile', () => {
  it('produces a file that round-trips through content validation', () => {
    const { filename, content } = toMarkdownFile({
      output: validOutput(),
      date: new Date('2026-07-02T10:00:00.000Z'),
      originalSources: ['https://example.fi/uutinen'],
    })
    expect(filename).toBe(
      '2026-07-02-virasto-perusti-tyoryhman-selvittamaan-jonotuskulttuurin-tilaa.md'
    )

    const article = parseArticleSource(content, filename)
    expect(article.aiGenerated).toBe(true)
    expect(article.category).toBe('politiikka')
    expect(article.originalSources).toEqual(['https://example.fi/uutinen'])
    expect(article.heroImage).toBe('/images/heroes/politiikka.svg')
    expect(article.published).toBe(true)
  })

  it('handles titles containing quotes', () => {
    const output = validOutput({
      headline: "Ministeri lupasi 'täyden selvityksen' kahvitauoista",
    })
    const { content } = toMarkdownFile({ output, date: new Date(), originalSources: [] })
    const article = parseArticleSource(content, 'quote-test.md')
    expect(article.title).toBe("Ministeri lupasi 'täyden selvityksen' kahvitauoista")
    expect(article.originalSources).toEqual([])
  })
})
