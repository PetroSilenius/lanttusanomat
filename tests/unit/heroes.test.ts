import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { categorySlugs } from '@/lib/categories'
import { allHeroPaths, categoryHeroes, defaultHeroImage, heroVariants } from '@/lib/heroes'

const publicDir = path.join(__dirname, '..', '..', 'public')

describe('hero registry', () => {
  it('offers exactly three variants for every category', () => {
    for (const slug of categorySlugs) {
      expect(heroVariants(slug), slug).toHaveLength(3)
    }
  })

  it('registers heroes only for known categories', () => {
    expect(Object.keys(categoryHeroes).sort()).toEqual([...categorySlugs].sort())
  })

  it('points every variant at an existing SVG under public/ with a description', () => {
    for (const [slug, variants] of Object.entries(categoryHeroes)) {
      for (const variant of variants) {
        expect(variant.path, slug).toMatch(/^\/images\/heroes\/[a-z0-9-]+\.svg$/)
        expect(variant.description.trim().length, variant.path).toBeGreaterThan(0)
        expect(fs.existsSync(path.join(publicDir, variant.path)), variant.path).toBe(true)
      }
    }
  })

  it('has a unique path for every variant', () => {
    const paths = allHeroPaths()
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toHaveLength(categorySlugs.length * 3)
  })

  it('defaults to the first variant of a category', () => {
    expect(defaultHeroImage('politiikka')).toBe('/images/heroes/politiikka.svg')
    expect(defaultHeroImage('kotimaa')).toBe('/images/heroes/kotimaa.svg')
  })

  it('returns nothing for an unknown category', () => {
    expect(heroVariants('ei-ole')).toEqual([])
    expect(defaultHeroImage('ei-ole')).toBeUndefined()
  })
})
