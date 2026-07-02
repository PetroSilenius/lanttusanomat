import type { Metadata } from 'next'
import { absoluteUrl, siteConfig } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Tietoa meistä',
  description:
    'Lanttusanomat on satiirijulkaisu. Kaikki artikkelimme ovat fiktiota, ja tekoälyllä tuotetut jutut on merkitty selkeästi.',
  alternates: { canonical: absoluteUrl('/tietoa') },
}

export default function AboutPage() {
  return (
    <div className="article-body mx-auto max-w-3xl">
      <h1
        className="text-3xl font-black text-brand-dark"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Tietoa meistä
      </h1>
      <p>
        <strong>{siteConfig.name}</strong> on suomalainen satiirijulkaisu. Nimemme mukaisesti
        suhtaudumme uutisiin kuin lanttuun: kotimaisena raaka-aineena, josta saa keittämällä irti
        enemmän kuin arvaisi.
      </p>
      <h2>Kaikki on fiktiota</h2>
      <p>
        Jokainen artikkelimme on satiiria. Jutuissa esiintyvät henkilöt, organisaatiot, lainaukset,
        tutkimukset ja tapahtumat ovat keksittyjä, elleivät ne ole julkisuudesta tunnettuja
        instituutioita, joita satiiri kommentoi. Mitään sivustolla julkaistua ei tule tulkita
        uutisraportoinniksi, tosiasioiden kuvaukseksi tai kannanotoksi todellisten henkilöiden
        toimintaan.
      </p>
      <h2>Tekoäly toimituksessa</h2>
      <p>
        Osa artikkeleistamme on tuotettu tekoälyn avulla. Nämä jutut tunnistaa jokaisen artikkelin
        yläosassa olevasta <strong>Tekoäly</strong>-merkinnästä ja artikkelin alussa olevasta
        huomautuksesta. Tekoälyartikkelit syntyvät automaattisessa prosessissa, joka poimii päivän
        uutisaiheita ja kirjoittaa niistä täysin omaperäisen satiiriartikkelin. Prosessi ei koskaan
        kopioi tai mukaile alkuperäisten uutisten tekstiä.
      </p>
      <h2>Toimitusperiaatteet</h2>
      <ul>
        <li>
          Satiirimme kohdistuu instituutioihin, ilmiöihin ja valtaan – ei yksityishenkilöihin.
        </li>
        <li>
          Emme käsittele aiheita, joihin liittyy todellista inhimillistä kärsimystä, kuten sotaa,
          onnettomuuksia, sairauksia tai kuolemantapauksia.
        </li>
        <li>Emme julkaise sisältöä, joka voitaisiin kohtuudella erehtyä luulemaan tosiasiaksi.</li>
        <li>Merkitsemme satiirin ja tekoälyn käytön aina näkyvästi.</li>
      </ul>
      <h2>Avoin lähdekoodi</h2>
      <p>
        Sivusto on avointa lähdekoodia: sekä julkaisualusta että artikkelien tuotantoputki ovat
        luettavissa GitHubissa. Palaute ja korjausehdotukset ovat tervetulleita.
      </p>
    </div>
  )
}
