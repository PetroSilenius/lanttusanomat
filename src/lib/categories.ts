/**
 * Fixed category registry. Frontmatter `category` must be one of these slugs;
 * anything else fails content validation at build time.
 */
export interface Category {
  slug: string
  name: string
  description: string
}

export const categories: readonly Category[] = [
  {
    slug: 'politiikka',
    name: 'Politiikka',
    description: 'Satiiria päätöksenteosta, puolueista ja byrokratian ihmeellisestä maailmasta.',
  },
  {
    slug: 'liikenne',
    name: 'Liikenne',
    description: 'Satiiria ruuhkista, pysäköinnistä ja suomalaisesta liikennekulttuurista.',
  },
  {
    slug: 'ruoka',
    name: 'Ruoka',
    description: 'Satiiria ruokatrendeistä, kahvista ja kansallisherkkujen tilasta.',
  },
  {
    slug: 'teknologia',
    name: 'Teknologia',
    description: 'Satiiria sovelluksista, tekoälystä ja digitalisaation lupauksista.',
  },
  {
    slug: 'talous',
    name: 'Talous',
    description: 'Satiiria yrityksistä, kuluttamisesta ja talouspuheen kiemuroista.',
  },
  {
    slug: 'urheilu',
    name: 'Urheilu',
    description: 'Satiiria penkkiurheilusta, tuloksista ja kansallisesta itsetunnosta.',
  },
  {
    slug: 'suomalainen-elama',
    name: 'Suomalainen elämä',
    description: 'Satiiria saunasta, säästä, hiljaisuudesta ja muista kansallisaarteista.',
  },
] as const

export const categorySlugs: readonly string[] = categories.map((c) => c.slug)

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function isCategorySlug(slug: string): boolean {
  return categorySlugs.includes(slug)
}
