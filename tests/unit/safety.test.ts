import { describe, expect, it } from 'vitest'
import { filterSafe, findBannedStem, isTopicSafe } from '@/generation/safety'

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

  // The output gate runs over a whole article, where these stems turn up as
  // the tail of an ordinary compound far more often than as the real thing.
  it('allows word-initial-only stems inside compounds', () => {
    expect(isTopicSafe('Kaupan hintasota kiristyi')).toBe(true)
    expect(isTopicSafe('Tullikiista laajeni kauppasodaksi')).toBe(true)
    expect(isTopicSafe('Viraston sähköpostitulva kaatoi palvelimen')).toBe(true)
    expect(isTopicSafe('Marketin hintaisku kesti viikon')).toBe(true)
    expect(isTopicSafe('Hehkulamppu vaihdettiin ledivalaisimeen')).toBe(true)
  })

  it('still rejects word-initial-only stems that start a word', () => {
    expect(isTopicSafe('Sota jatkuu kolmatta vuotta')).toBe(false)
    expect(isTopicSafe('Sodassa tuhoutui kokonainen kaupunginosa')).toBe(false)
    expect(isTopicSafe('Iskuja tehtiin useisiin kohteisiin')).toBe(false)
    expect(isTopicSafe('Mies ampui ilmaan')).toBe(false)
    expect(isTopicSafe('Tulvat katkaisivat tien')).toBe(false)
    // A hyphen is a word break, so compounds of a real attack still match.
    expect(isTopicSafe('Pommi-isku kaupungissa')).toBe(false)
  })

  it('allows the listed non-violent terms but not the stems inside them', () => {
    expect(isTopicSafe('Puolueen uusi iskulause julkistettiin')).toBe(true)
    expect(isTopicSafe('Yhtiön kasvu oli räjähdysmäistä')).toBe(true)
    expect(isTopicSafe('Kokousmuistio oli katastrofaalinen')).toBe(true)
    expect(isTopicSafe('Esimies loi murhaavan katseen')).toBe(true)

    expect(isTopicSafe('Räjähdys tuhosi hallin')).toBe(false)
    expect(isTopicSafe('Katastrofi kohtasi aluetta')).toBe(false)
    expect(isTopicSafe('Poliisi tutkii murhaa')).toBe(false)
  })
})

describe('findBannedStem', () => {
  it('names the stem the text tripped on', () => {
    expect(findBannedStem('Tulipalo tuhosi kerrostalon')).toBe('tulipalo')
    expect(findBannedStem('Sota jatkuu')).toBe('sota')
  })

  it('returns null for safe text', () => {
    expect(findBannedStem('Kahvin hinta nousee ensi syksynä')).toBeNull()
  })
})

describe('filterSafe', () => {
  it('filters a list by extracted text', () => {
    const items = [{ t: 'Kahvi kallistuu' }, { t: 'Onnettomuus valtatiellä' }]
    expect(filterSafe(items, (i) => i.t)).toEqual([{ t: 'Kahvi kallistuu' }])
  })
})
