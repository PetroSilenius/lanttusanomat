import { describe, expect, it } from 'vitest'
import { parseFrontmatter, ContentValidationError } from '@/lib/schema'

const validFrontmatter = {
  title: 'Testiotsikko satiiriartikkelille',
  slug: 'testiotsikko-satiiriartikkelille',
  date: '2026-07-01T08:00:00.000Z',
  author: 'Toimitus',
  category: 'politiikka',
  summary: 'Tämä on riittävän pitkä tiivistelmä artikkelista.',
  tags: ['testi', 'satiiri'],
  aiGenerated: true,
}

const validBody =
  'Tämä on artikkelin leipäteksti, jossa on selvästi yli viisikymmentä merkkiä sisältöä.'

describe('parseFrontmatter', () => {
  it('accepts a valid article and applies defaults', () => {
    const article = parseFrontmatter(validFrontmatter, validBody, 'test.md')
    expect(article.title).toBe(validFrontmatter.title)
    expect(article.date).toBeInstanceOf(Date)
    expect(article.published).toBe(true)
    expect(article.originalSources).toEqual([])
    expect(article.body).toBe(validBody)
  })

  it('rejects an unknown category', () => {
    expect(() =>
      parseFrontmatter({ ...validFrontmatter, category: 'olematon' }, validBody, 'test.md')
    ).toThrow(ContentValidationError)
  })

  it('rejects a non-kebab-case slug', () => {
    for (const slug of ['Iso-Kirjain', 'ääkkönen', 'kaksi--viivaa', '-alku', 'loppu-']) {
      expect(() => parseFrontmatter({ ...validFrontmatter, slug }, validBody, 'test.md')).toThrow(
        ContentValidationError
      )
    }
  })

  it('rejects missing required fields with a readable message', () => {
    const { title: _title, ...withoutTitle } = validFrontmatter
    expect(() => parseFrontmatter(withoutTitle, validBody, 'broken.md')).toThrow(/broken\.md/)
    expect(() => parseFrontmatter(withoutTitle, validBody, 'broken.md')).toThrow(/title/)
  })

  it('rejects an invalid date', () => {
    expect(() =>
      parseFrontmatter({ ...validFrontmatter, date: 'ei-päivämäärä' }, validBody, 'test.md')
    ).toThrow(ContentValidationError)
  })

  it('rejects unknown extra fields (strict schema)', () => {
    expect(() =>
      parseFrontmatter({ ...validFrontmatter, extraField: true }, validBody, 'test.md')
    ).toThrow(ContentValidationError)
  })

  it('rejects a too-short body', () => {
    expect(() => parseFrontmatter(validFrontmatter, 'lyhyt', 'test.md')).toThrow(
      /body must contain/
    )
  })

  it('rejects non-URL originalSources', () => {
    expect(() =>
      parseFrontmatter({ ...validFrontmatter, originalSources: ['ei-url'] }, validBody, 'test.md')
    ).toThrow(ContentValidationError)
  })
})
