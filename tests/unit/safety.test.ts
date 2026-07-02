import { describe, expect, it } from 'vitest'
import { filterSafe, isTopicSafe } from '@/generation/safety'

describe('isTopicSafe', () => {
  it('accepts everyday news topics', () => {
    expect(isTopicSafe('Eduskunta perusti uuden työryhmän budjettineuvotteluihin')).toBe(true)
    expect(isTopicSafe('Kahvin hinta nousee ensi syksynä')).toBe(true)
    expect(isTopicSafe('VR:n junat myöhästelivät ruuhkassa')).toBe(true)
  })

  it('rejects war and violence topics', () => {
    expect(isTopicSafe('Sodan uhka kasvaa raja-alueilla')).toBe(false)
    expect(isTopicSafe('Poliisi tutkii ampumista keskustassa')).toBe(false)
    expect(isTopicSafe('Terrori-iskun uhka nostettiin korkeimmalle tasolle')).toBe(false)
  })

  it('rejects death, accident and illness topics', () => {
    expect(isTopicSafe('Henkilö kuoli kolarissa moottoritiellä')).toBe(false)
    expect(isTopicSafe('Tulipalo tuhosi kerrostalon')).toBe(false)
    expect(isTopicSafe('Uusi pandemia leviää Euroopassa')).toBe(false)
    expect(isTopicSafe('Tutkimus: syöpähoidot kehittyvät')).toBe(false)
  })

  it('rejects topics about vulnerable people and victims', () => {
    expect(isTopicSafe('Lapsiin kohdistuneet rikokset lisääntyivät')).toBe(false)
    expect(isTopicSafe('Ihmiskauppa on kasvava ongelma')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isTopicSafe('SOTA JATKUU')).toBe(false)
  })
})

describe('filterSafe', () => {
  it('filters a list by extracted text', () => {
    const items = [{ t: 'Kahvi kallistuu' }, { t: 'Onnettomuus valtatiellä' }]
    expect(filterSafe(items, (i) => i.t)).toEqual([{ t: 'Kahvi kallistuu' }])
  })
})
