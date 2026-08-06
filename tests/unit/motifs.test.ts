import { describe, expect, it } from 'vitest'
import {
  analyzeMotifs,
  articleUsesMotif,
  formatMotifBriefing,
  recentArticles,
  type MotifArticle,
} from '@/generation/motifs'

const NOW = new Date('2026-08-06T12:00:00Z')

function article(overrides: Partial<MotifArticle> = {}): MotifArticle {
  return {
    slug: 'testijuttu',
    date: new Date('2026-08-05T09:00:00Z'),
    title: 'Kahvin hinta nousi',
    summary: 'Kahvilat kertovat sopeutuvansa uuteen hintatasoon.',
    body: 'Kahvin hinta nousi taas.\n\nAsiakkaat joivat sen silti.',
    category: 'ruoka',
    ...overrides,
  }
}

/** N distinct articles that all carry the same body text. */
function repeated(count: number, body: string, extra: Partial<MotifArticle> = {}): MotifArticle[] {
  return Array.from({ length: count }, (_, i) => article({ slug: `juttu-${i}`, body, ...extra }))
}

describe('recentArticles', () => {
  it('keeps only articles inside the window, newest first', () => {
    const articles = [
      article({ slug: 'vanha', date: new Date('2026-07-01T09:00:00Z') }),
      article({ slug: 'uusi', date: new Date('2026-08-05T09:00:00Z') }),
      article({ slug: 'keskimmainen', date: new Date('2026-07-30T09:00:00Z') }),
    ]
    expect(recentArticles(articles, 14, NOW).map((a) => a.slug)).toEqual(['uusi', 'keskimmainen'])
  })

  it('excludes future-dated articles', () => {
    const articles = [article({ slug: 'huominen', date: new Date('2026-08-09T09:00:00Z') })]
    expect(recentArticles(articles, 14, NOW)).toHaveLength(0)
  })
})

describe('articleUsesMotif', () => {
  it('matches bureaucratic-body stems through Finnish inflection', () => {
    const cases: [string, string][] = [
      ['tyoryhma', 'Ministeriö perusti työryhmän asiaa varten.'],
      ['tyoryhma', 'Työryhmässä on kuusi jäsentä.'],
      // lautakunta -> lautakunnan: consonant gradation must not break the stem
      ['lautakunta', 'Lautakunnan puheenjohtaja kommentoi asiaa.'],
      ['selvitys', 'Selvityksen on määrä valmistua keväällä.'],
      ['selvitys', 'Virasto käynnisti kartoituksen.'],
      // yksikkö -> yksikön
      ['yksikko', 'Yksikön johtaja aloitti tehtävässään.'],
      ['mittari', 'Uusi kiitollisuusindeksi otetaan käyttöön.'],
      ['koulutus', 'Liitto järjestää koulutusta jäsenilleen.'],
    ]
    for (const [motif, body] of cases) {
      expect(articleUsesMotif(article({ body }), motif), `${motif}: ${body}`).toBe(true)
    }
  })

  it('detects the motif from the slug and title too', () => {
    expect(
      articleUsesMotif(
        article({ slug: 'kahvin-hinnan-tyoryhma', body: 'Ei mitään erityistä.' }),
        'tyoryhma'
      )
    ).toBe(true)
  })

  it('scopes the founding construction to the opening', () => {
    const opening = article({
      body: 'Ministeriö perusti tänään uuden elimen.\n\nMuuta ei tapahtunut.',
    })
    const ending = article({ body: 'Kahvin hinta nousi.\n\nMyöhemmin perustettiin jotain.' })
    expect(articleUsesMotif(opening, 'perustaminen')).toBe(true)
    expect(articleUsesMotif(ending, 'perustaminen')).toBe(false)
  })

  it('scopes the deferral kicker to the last paragraph', () => {
    const kicker = article({
      body: 'Jotain tapahtui.\n\nTyöryhmä kokoontuu seuraavan kerran syksyllä.',
    })
    const mention = article({
      body: 'Työryhmä kokoontuu seuraavan kerran syksyllä.\n\nAsiakkaat joivat kahvinsa.',
    })
    expect(articleUsesMotif(kicker, 'lykkaysloppu')).toBe(true)
    expect(articleUsesMotif(mention, 'lykkaysloppu')).toBe(false)
  })

  it('does not fire on unrelated everyday prose', () => {
    const plain = article()
    for (const motif of ['tyoryhma', 'lautakunta', 'selvitys', 'yksikko', 'mittari']) {
      expect(articleUsesMotif(plain, motif), motif).toBe(false)
    }
  })

  it('returns false for an unknown motif id', () => {
    expect(articleUsesMotif(article(), 'ei-olemassa')).toBe(false)
  })
})

describe('analyzeMotifs', () => {
  it('flags a motif that dominates the window', () => {
    const report = analyzeMotifs(
      [...repeated(4, 'Ministeriö perusti työryhmän.'), ...repeated(4, 'Kahvi maistui hyvältä.')],
      [],
      14,
      NOW
    )
    expect(report.articleCount).toBe(8)
    const tyoryhma = report.overused.find((m) => m.id === 'tyoryhma')
    expect(tyoryhma?.count).toBe(4)
    expect(tyoryhma?.share).toBeCloseTo(0.5)
  })

  it('does not flag a motif below the count threshold', () => {
    // 2 of 4 is above the 25 % share but below the 3-occurrence minimum.
    const report = analyzeMotifs(
      [...repeated(2, 'Ministeriö perusti työryhmän.'), ...repeated(2, 'Kahvi maistui.')],
      [],
      14,
      NOW
    )
    expect(report.overused).toHaveLength(0)
    expect(report.all.find((m) => m.id === 'tyoryhma')?.count).toBe(2)
  })

  it('does not flag a motif below the share threshold', () => {
    const report = analyzeMotifs(
      [...repeated(3, 'Ministeriö perusti työryhmän.'), ...repeated(20, 'Kahvi maistui.')],
      [],
      14,
      NOW
    )
    expect(report.overused).toHaveLength(0)
  })

  it('reports category distribution and unused registry categories', () => {
    const report = analyzeMotifs(
      [
        ...repeated(3, 'Kahvi maistui.', { category: 'talous' }),
        ...repeated(1, 'Kahvi maistui.', { category: 'ruoka' }),
      ],
      ['talous', 'ruoka', 'urheilu', 'liikenne'],
      14,
      NOW
    )
    expect(report.categories[0]).toMatchObject({ category: 'talous', count: 3 })
    expect(report.unusedCategories).toEqual(['urheilu', 'liikenne'])
  })

  it('ignores articles outside the window', () => {
    const report = analyzeMotifs(
      [
        ...repeated(5, 'Ministeriö perusti työryhmän.', { date: new Date('2026-06-01T09:00:00Z') }),
        article(),
      ],
      [],
      14,
      NOW
    )
    expect(report.articleCount).toBe(1)
    expect(report.overused).toHaveLength(0)
  })

  it('handles an empty window without dividing by zero', () => {
    const report = analyzeMotifs([], ['talous'], 14, NOW)
    expect(report).toMatchObject({ articleCount: 0, overused: [], all: [] })
    expect(report.unusedCategories).toEqual(['talous'])
  })
})

describe('formatMotifBriefing', () => {
  it('lists overused motifs with counts and examples', () => {
    const briefing = formatMotifBriefing(
      analyzeMotifs(repeated(4, 'Ministeriö perusti työryhmän.'), ['urheilu'], 14, NOW)
    )
    expect(briefing).toContain('Viime aikoina käytetyt keinot')
    expect(briefing).toContain('työryhmä')
    expect(briefing).toContain('4/4')
    expect(briefing).toContain('juttu-0')
    expect(briefing).toContain('urheilu')
  })

  it('says so when nothing is overused', () => {
    const briefing = formatMotifBriefing(analyzeMotifs(repeated(4, 'Kahvi maistui.'), [], 14, NOW))
    expect(briefing).toContain('ei tällä hetkellä ylitä toistorajaa')
  })

  it('handles an empty window', () => {
    expect(formatMotifBriefing(analyzeMotifs([], [], 14, NOW))).toContain(
      'ei löytynyt julkaistuja artikkeleita'
    )
  })
})
