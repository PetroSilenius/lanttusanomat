import { describe, expect, it } from 'vitest'
import { buildTopicPrompt, loadSatireSkill } from '@/generation/skill'

describe('loadSatireSkill', () => {
  it('loads the versioned skill from the repo', () => {
    const skill = loadSatireSkill()
    expect(skill).toContain('Satiiri-taito')
    expect(skill).toContain('Kielletyt aiheet')
    expect(skill).toContain('Älä koskaan kopioi')
  })
})

describe('buildTopicPrompt', () => {
  it('embeds the summary and the no-copy instruction', () => {
    const prompt = buildTopicPrompt('- [Yle] Testiotsikko', [])
    expect(prompt).toContain('- [Yle] Testiotsikko')
    expect(prompt).toContain('älä kopioi')
  })

  it('lists recent titles to avoid duplicates', () => {
    const prompt = buildTopicPrompt('- [Yle] Testiotsikko', ['Aiempi juttu kahvista'])
    expect(prompt).toContain('Aiempi juttu kahvista')
  })
})
