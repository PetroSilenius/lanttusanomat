# Lanttusanomat 🥔

> Suomen luotettavin lähde uutisille, jotka eivät ole totta.

**Lanttusanomat** is a Finnish satire news site — think _The Onion_ with the clean
usability of a modern Finnish news outlet. Every article is fiction, and the site
says so loudly: satire badges, AI badges and per-article disclaimers are core
product features, not fine print.

The platform is a fully static, offline-capable **PWA** built with Next.js, with
content managed as Markdown in this repository and an automated AI pipeline that
writes two new satire articles per day.

- **Frontend:** Next.js 15 (App Router, static export) · TypeScript strict · Tailwind CSS 4
- **Content:** Markdown + validated frontmatter in [`content/articles/`](content/articles)
- **AI pipeline:** GitHub Actions (2×/day) → Claude API + [Satire Skill](skills/satiiri/SKILL.md) → git commit
- **Hosting:** Cloudflare Pages (auto-deploy on push)
- **Tests:** Vitest + React Testing Library + Playwright + Lighthouse CI

📐 The full technical plan (architecture, content model, PWA/offline strategy,
automation, security) lives in [`docs/TECHNICAL_PLAN.md`](docs/TECHNICAL_PLAN.md).

---

## Getting started

Requirements: **Node 22+** and **pnpm 10+** (`corepack enable` gives you pnpm).

```bash
pnpm install
pnpm dev          # dev server at http://localhost:3000 (no service worker)
pnpm build        # static export to out/
pnpm start        # serve the production build at http://localhost:3000
```

The service worker only registers in production builds — use `pnpm build && pnpm start`
to test PWA/offline behavior locally.

## Testing

```bash
pnpm typecheck      # TypeScript strict mode
pnpm lint           # ESLint
pnpm format:check   # Prettier
pnpm test           # Vitest unit + integration tests
pnpm test:e2e       # Playwright e2e (builds the site, tests offline mode too)
pnpm lhci           # Lighthouse CI against out/ (perf ≥95, SEO =100, a11y ≥95)
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push and PR.

## Content workflow

Articles are Markdown files in `content/articles/`, named `YYYY-MM-DD-slug.md`:

```yaml
---
title: 'Otsikko tähän'
slug: otsikko-tahan # unique, kebab-case
date: 2026-07-02T06:30:00.000Z
author: Toimitus # or "Lanttusanomat AI-toimitus"
category: politiikka # politiikka | liikenne | ruoka | teknologia | talous | urheilu | suomalainen-elama
summary: >-
  1–2 sentence ingress shown in cards, feeds and social previews.
tags: [avainsana, toinen]
aiGenerated: false # true adds the AI badge + AI disclaimer
originalSources: [] # metadata only — never rendered anywhere
heroImage: /images/heroes/politiikka.svg
published: true # false keeps the file out of the build entirely
---
Article body in Markdown (## subheadings, **bold**, quotes…).
```

Frontmatter is validated with zod at build time — a broken article **fails the
build** instead of shipping a broken page. To publish: commit to `main` (directly
or via PR); Cloudflare Pages deploys automatically. Set a future `date` to keep
an article at the bottom of the feed until that date passes a rebuild.

### Editorial rules

Everything on the site is satire and labeled as such. AI-generated articles
additionally carry a **Tekoäly** badge and an explicit disclaimer. The full
editorial + safety policy (banned topics, punch-up rule, originality
requirements) is versioned in [`skills/satiiri/SKILL.md`](skills/satiiri/SKILL.md)
and enforced three times: topic filtering, the skill prompt, and post-generation
validation.

## AI article generation (Phase 2)

`.github/workflows/generate-articles.yml` runs twice a day (≈08:00 & 15:00
Helsinki time) and:

1. fetches RSS headlines from Yle, HS, Ilta-Sanomat and Iltalehti,
2. clusters them into topics across sources and drops unsafe ones,
3. builds an internal factual summary per topic (never full article text),
4. sends the summary through the Satire Skill to Claude (`claude-opus-4-8`)
   with schema-validated structured output,
5. validates the result (length, category, banned topics, headline originality),
6. writes Markdown and commits — which triggers the Cloudflare deployment.

Invalid or declined generations are skipped, never published.

```bash
pnpm generate:articles --dry-run    # show today's candidate topics, no API calls
pnpm generate:articles --count 2    # generate for real (needs ANTHROPIC_API_KEY)
```

## Deployment (Cloudflare Pages)

1. Create a Cloudflare Pages project connected to this repository.
2. Build command `pnpm build`, output directory `out`, production branch `main`.
3. Environment variables: see below. Every PR automatically gets a preview URL.

Security and caching headers ship in [`public/_headers`](public/_headers)
(CSP, `X-Frame-Options`, immutable caching for hashed assets, `no-cache` for
the service worker).

## Environment variables

| Variable               | Where                      | Purpose                                                                                                          |
| ---------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Cloudflare Pages build env | Canonical origin for metadata, sitemap, RSS (default `https://lanttusanomat.pages.dev`)                          |
| `ANTHROPIC_API_KEY`    | GitHub Actions **secret**  | Claude API key for article generation. Never exposed to the frontend; the generation workflow no-ops without it. |
| `NODE_VERSION`         | Cloudflare Pages build env | Set to `22`                                                                                                      |

There are no runtime secrets — the deployed site is purely static files.

## Project structure

```
content/articles/     all articles (Markdown + frontmatter)
docs/                 technical plan
public/               PWA manifest, service worker, icons, _headers, SVG illustrations
scripts/              generation orchestrator, icon build, static server
skills/satiiri/       the versioned Satire Skill (editorial policy prompt)
src/app/              routes: home, artikkeli, kategoria, haku, feeds, sitemap…
src/components/       UI components (badges, disclaimer, cards, offline indicator…)
src/lib/              content loading, schema, markdown, search, SEO (pure TS)
src/generation/       satire pipeline library (pure TS, fully unit-tested)
tests/                unit / integration / e2e / fixtures
```

## License

[MIT](LICENSE). Article content is fiction; any resemblance to actual events is
satirical commentary.
