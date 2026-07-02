import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Tietosuoja',
  description:
    'Lanttusanomien tietosuojaseloste: emme kerää henkilötietoja, emme käytä seurantaevästeitä emmekä jaa tietoja kolmansille osapuolille.',
  alternates: { canonical: absoluteUrl('/tietosuoja') },
}

export default function PrivacyPage() {
  return (
    <div className="article-body mx-auto max-w-3xl">
      <h1
        className="text-3xl font-black text-brand-dark"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Tietosuoja
      </h1>
      <p>
        Lanttusanomat on staattinen verkkosivusto, joka on suunniteltu keräämään sinusta niin vähän
        tietoa kuin mahdollista – eli ei mitään.
      </p>
      <h2>Mitä tietoja keräämme</h2>
      <ul>
        <li>Emme kerää henkilötietoja.</li>
        <li>Emme käytä seuranta- tai mainosevästeitä.</li>
        <li>Emme käytä kolmannen osapuolen analytiikkaa emmekä mainosverkkoja.</li>
        <li>Hakutoiminto toimii kokonaan selaimessasi; hakusanoja ei lähetetä palvelimelle.</li>
      </ul>
      <h2>Tekninen toteutus</h2>
      <p>
        Sivusto jaellaan Cloudflaren sisällönjakeluverkosta. Cloudflare käsittelee palvelun
        toimittamiseksi välttämättömiä teknisiä tietoja (kuten IP-osoitteita) omien
        tietosuojakäytäntöjensä mukaisesti muun muassa tietoturvahyökkäysten torjumiseksi. Emme itse
        tallenna tai näe näitä tietoja.
      </p>
      <h2>Offline-käyttö ja paikallinen tallennus</h2>
      <p>
        Sovellus tallentaa avaamiasi sivuja selaimesi välimuistiin, jotta ne toimivat myös ilman
        verkkoyhteyttä. Tämä tieto pysyy omalla laitteellasi, ja voit tyhjentää sen selaimen
        asetuksista milloin tahansa.
      </p>
      <h2>Yhteydenotot</h2>
      <p>
        Tietosuojaan liittyvät kysymykset voi jättää projektin GitHub-sivulle. Vastaamme niihin
        nopeammin kuin verottaja, mutta hitaammin kuin haluaisimme.
      </p>
    </div>
  )
}
