import fs from 'node:fs'
import path from 'node:path'

const SKILL_PATH = path.join('skills', 'satiiri', 'SKILL.md')

/** Loads the versioned Satire Skill (the system prompt) from the repo. */
export function loadSatireSkill(rootDir: string = process.cwd()): string {
  return fs.readFileSync(path.join(rootDir, SKILL_PATH), 'utf8')
}

/**
 * Builds the user prompt for one topic. The model only ever sees this
 * distilled summary — never source article text — which, together with the
 * skill rules, guarantees original writing.
 */
export function buildTopicPrompt(summary: string, existingTitles: string[]): string {
  const existing =
    existingTitles.length > 0
      ? `\n\nÄlä kirjoita aiheista, joista on jo julkaistu artikkeli. Viimeisimmät otsikot:\n${existingTitles
          .slice(0, 15)
          .map((title) => `- ${title}`)
          .join('\n')}`
      : ''
  return (
    'Tässä on sisäinen faktatiivistelmä yhdestä päivän uutisaiheesta ' +
    '(otsikoita ja kuvauksia eri medioista – vain inspiraatioksi, älä kopioi mitään):\n\n' +
    summary +
    '\n\nKirjoita tämän aiheen innoittamana täysin omaperäinen satiiriartikkeli ' +
    'Satiiri-taidon sääntöjen mukaisesti. Jos aihe kuuluu kiellettyihin aiheisiin, ' +
    'palauta declined: true.' +
    existing
  )
}
