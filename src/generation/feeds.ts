/**
 * Registry of Finnish news RSS feeds used as topic sources.
 * Only headlines and descriptions are read — never full article text —
 * and none of it is ever reproduced in generated output.
 */
export interface FeedSource {
  id: string
  name: string
  url: string
}

export const feedSources: readonly FeedSource[] = [
  {
    id: 'yle',
    name: 'Yle Uutiset',
    url: 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss',
  },
  {
    id: 'hs',
    name: 'Helsingin Sanomat',
    url: 'https://www.hs.fi/rss/tuoreimmat.xml',
  },
  {
    id: 'is',
    name: 'Ilta-Sanomat',
    url: 'https://www.is.fi/rss/tuoreimmat.xml',
  },
  {
    id: 'il',
    name: 'Iltalehti',
    url: 'https://www.iltalehti.fi/rss/uutiset.xml',
  },
] as const
