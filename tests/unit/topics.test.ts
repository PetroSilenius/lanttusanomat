import { describe, expect, it } from 'vitest'
import {
  clusterTopics,
  selectTopics,
  significantTokens,
  topicSummary,
  topicSourceUrls,
  type SourcedItem,
} from '@/generation/topics'

function item(overrides: Partial<SourcedItem>): SourcedItem {
  return {
    title: 'Otsikko',
    link: 'https://example.fi/1',
    description: '',
    sourceId: 'yle',
    sourceName: 'Yle Uutiset',
    ...overrides,
  }
}

describe('significantTokens', () => {
  it('drops stopwords and short tokens', () => {
    const tokens = significantTokens('Eduskunta ja hallitus päättivät nyt asiasta')
    expect(tokens.has('edusku')).toBe(true)
    expect(tokens.has('ja')).toBe(false)
    expect(tokens.has('nyt')).toBe(false)
  })

  it('matches Finnish case endings via prefix stemming', () => {
    const a = significantTokens('parkkipaikka löytyi')
    const b = significantTokens('parkkipaikan etsintä')
    expect([...a].some((token) => b.has(token))).toBe(true)
  })
})

describe('clusterTopics', () => {
  it('groups the same story from different sources', () => {
    const items = [
      item({ title: 'Eduskunta hyväksyi liikennelain uudistuksen', sourceId: 'yle' }),
      item({
        title: 'Liikennelain uudistus hyväksyttiin eduskunnassa',
        sourceId: 'hs',
        sourceName: 'HS',
        link: 'https://example.fi/2',
      }),
      item({ title: 'Kahvin hinta jatkaa nousuaan', sourceId: 'il', link: 'https://example.fi/3' }),
    ]
    const topics = clusterTopics(items)
    expect(topics).toHaveLength(2)
    expect(topics[0]!.sourceCount).toBe(2)
    expect(topics[0]!.items).toHaveLength(2)
  })

  it('ranks multi-source topics first', () => {
    const items = [
      item({ title: 'Yksittäinen pikku-uutinen kissoista puistossa' }),
      item({ title: 'Sähkön hinta laski ennätystasolle', sourceId: 'yle' }),
      item({
        title: 'Sähkön hinta painui ennätyksellisen alas',
        sourceId: 'is',
        sourceName: 'IS',
        link: 'https://example.fi/4',
      }),
    ]
    const topics = clusterTopics(items)
    expect(topics[0]!.title).toContain('Sähkön')
  })
})

describe('selectTopics', () => {
  it('drops unsafe topics before clustering', () => {
    const items = [
      item({ title: 'Onnettomuus moottoritiellä vaati uhreja' }),
      item({ title: 'Uusi ruokatrendi valtaa ravintolat' }),
    ]
    const topics = selectTopics(items, 5)
    expect(topics).toHaveLength(1)
    expect(topics[0]!.title).toContain('ruokatrendi')
  })

  it('limits the number of returned topics', () => {
    const titles = [
      'Kahvin hinta nousee paahtimoiden mukaan',
      'Junaliikenteen täsmällisyys parani keväällä',
      'Sieniretkien suosio kasvaa merkittävästi',
      'Pörssiyhtiöiden osingot yllättivät analyytikot',
      'Jääkiekkoliiga uudisti sarjajärjestelmänsä',
    ]
    const items = titles.map((title, i) => item({ title, link: `https://example.fi/${i}` }))
    expect(selectTopics(items, 3)).toHaveLength(3)
  })
})

describe('topicSummary & topicSourceUrls', () => {
  it('builds a labeled summary and deduplicates source urls', () => {
    const topic = {
      title: 'Testi',
      sourceCount: 2,
      items: [
        item({ title: 'Otsikko A', description: 'Kuvaus A' }),
        item({ title: 'Otsikko B', sourceName: 'HS', link: 'https://example.fi/1' }),
      ],
    }
    const summary = topicSummary(topic)
    expect(summary).toContain('[Yle Uutiset] Otsikko A — Kuvaus A')
    expect(summary).toContain('[HS] Otsikko B')
    expect(topicSourceUrls(topic)).toEqual(['https://example.fi/1'])
  })
})
