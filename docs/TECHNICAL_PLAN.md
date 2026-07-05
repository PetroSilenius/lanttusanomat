# Lanttusanomat — Technical Plan

> **Lanttusanomat** — a Finnish satire news site. "Suomen luotettavin lähde uutisille, jotka eivät ole totta."
>
> This document is the final technical plan required before implementation. It covers architecture,
> directory structure, content model, testing, SEO, performance, PWA/offline, automation, Cloudflare
> deployment, CI/CD, security headers, and the MVP delivery steps.

---

## 1. Architecture

### Overview

A **fully static site** generated at build time from Markdown files in the repository, deployed to
**Cloudflare Pages**. Article generation runs on a schedule in **GitHub Actions**, calls the
Anthropic API, commits new Markdown files, and the push triggers an automatic Cloudflare Pages
deployment. There is no runtime backend at all — no origin server, no database, no API to secure or
scale.

```
┌──────────────────────────── GitHub repository ────────────────────────────┐
│                                                                           │
│  content/articles/*.md  ◄── committed by humans or by the generation bot  │
│                                                                           │
│  ┌─────────────────────┐        ┌───────────────────────────────────┐     │
│  │  GitHub Actions CI  │        │  GitHub Actions (cron, 2×/day)    │     │
│  │  typecheck · lint   │        │  1. fetch Finnish news RSS feeds  │     │
│  │  unit · integration │        │  2. cluster & select safe topics  │     │
│  │  build · e2e · LHCI │        │  3. internal factual summary      │     │
│  └─────────────────────┘        │  4. Satire Skill → Claude API     │     │
│                                 │  5. validate → Markdown → commit  │     │
│                                 └───────────────────────────────────┘     │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ push to main
                ▼
     Cloudflare Pages build (pnpm build → next export → out/)
                │
                ▼
     Cloudflare global CDN  ──►  Browser (static HTML + tiny JS + Service Worker)
```

### Key decisions & rationale

| Decision         | Choice                                                                                    | Rationale                                                                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 15 (App Router) with `output: 'export'`**                                       | Preferred stack; static export produces pure HTML/CSS with minimal JS — ideal for Core Web Vitals and Cloudflare Pages. No server runtime to maintain.                                                                                             |
| Rendering        | 100 % static generation at build time                                                     | Fastest possible delivery; every page is an immutable file on the CDN.                                                                                                                                                                             |
| Content pipeline | `gray-matter` + `zod` validation + `unified`/`remark` → HTML at build                     | Frontmatter is strictly validated; a bad article fails the build instead of shipping broken pages.                                                                                                                                                 |
| Search           | Build-time JSON index + dependency-free client-side search                                | No backend needed; index is a static asset, cached by the service worker (search even works offline).                                                                                                                                              |
| Automation       | **GitHub Actions scheduled workflow** (not a Cloudflare Worker)                           | The pipeline's output is a _git commit_; Actions has native repo write access, secrets management, logs, and manual dispatch. Cloudflare Pages already redeploys on push, so no extra glue is needed. This is the cleanest of the allowed options. |
| AI generation    | Anthropic API (Claude) driven by a versioned **Satire Skill** (`skills/satiiri/SKILL.md`) | The skill is a reviewable, reusable prompt artifact in the repo — editorial policy is code-reviewed, not hidden in a script.                                                                                                                       |
| Images           | Stylized SVG illustrations (per category + per article)                                   | "Distinctly stylized, never photorealistic, clearly humorous" — SVGs are a few KB, resolution-independent, and need no image pipeline. AI raster illustration pipeline is a Phase 3 enhancement.                                                   |
| Package manager  | pnpm                                                                                      | Preferred stack.                                                                                                                                                                                                                                   |

### Language & routing

The site is Finnish-first. Routes use Finnish slugs:

| Route                         | Page                         |
| ----------------------------- | ---------------------------- |
| `/`                           | Home (etusivu)               |
| `/artikkeli/[slug]`           | Article                      |
| `/kategoria/[slug]`           | Category                     |
| `/haku`                       | Search (client-side)         |
| `/tietoa`                     | About + satire disclosure    |
| `/tietosuoja`                 | Privacy                      |
| `/offline`                    | Offline fallback (precached) |
| `/feed.xml`                   | RSS 2.0 feed                 |
| `/sitemap.xml`, `/robots.txt` | SEO (Next metadata routes)   |
| `/search-index.json`          | Static search index          |

## 2. Directory structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml                    # typecheck, lint, unit, build, e2e, Lighthouse CI
│       └── generate-articles.yml     # cron 2×/day: AI article generation → commit
├── content/
│   └── articles/                     # ALL articles live here as Markdown
│       └── YYYY-MM-DD-slug.md
├── docs/
│   └── TECHNICAL_PLAN.md             # this document
├── public/
│   ├── _headers                      # Cloudflare Pages security & caching headers
│   ├── manifest.webmanifest          # PWA manifest
│   ├── sw.js                        # hand-written service worker (versioned caches)
│   ├── icons/                        # PWA icons (any/maskable, apple-touch)
│   └── images/heroes/                # stylized SVG hero illustrations
├── scripts/
│   ├── select-topics.mts             # daily topic briefing (run by the cron workflow)
│   ├── validate-articles.mts         # editorial gate for newly written articles
│   ├── generate-icons.mjs            # one-shot: rasterize icon.svg → PNGs (sharp)
│   └── serve-static.mjs              # tiny static server for e2e/LHCI (clean URLs)
├── skills/
│   └── satiiri/
│       └── SKILL.md                  # the Satire Skill: editorial + safety policy prompt
├── src/
│   ├── app/                          # Next.js App Router (all routes above)
│   ├── components/                   # reusable UI components
│   ├── generation/                   # topic-discovery library (pure, unit-testable)
│   │   ├── feeds.ts                  # news source registry (Yle, HS, IS, IL)
│   │   ├── rss.ts                    # dependency-free RSS item parser
│   │   ├── topics.ts                 # cross-source topic clustering & selection
│   │   └── safety.ts                 # banned-topic filter (war, tragedy, …)
│   └── lib/                          # content & site library (pure, unit-testable)
│       ├── site.ts                   # site config (name, URL, nav, locale)
│       ├── categories.ts             # category registry (slug ↔ name)
│       ├── schema.ts                 # zod frontmatter schema
│       ├── content.ts                # article loading, sorting, filtering
│       ├── markdown.ts               # remark/rehype pipeline
│       ├── search.ts                 # index builder + query scoring
│       └── seo.ts                    # metadata + JSON-LD builders
├── tests/
│   ├── unit/                         # Vitest: lib + generation units
│   ├── integration/                  # Vitest + RTL: pages, RSS/sitemap/SEO routes
│   ├── e2e/                          # Playwright: home, article, category, search,
│   │                                 #             offline, PWA basics
│   └── fixtures/                     # Markdown & RSS fixtures
├── lighthouserc.json                 # Lighthouse CI budgets (perf 95+, SEO 100, …)
├── next.config.mjs                   # output: 'export'
├── playwright.config.ts
├── vitest.config.ts
├── eslint.config.mjs · .prettierrc.json · tsconfig.json (strict)
└── README.md · LICENSE (MIT)
```

**Layering rule:** `src/lib` and `src/generation` are pure TypeScript with no React/Next imports —
everything testable in isolation. `src/app` and `src/components` consume them. Scripts are thin
orchestrators around `src/generation`.

## 3. Content model

One Markdown file per article: `content/articles/YYYY-MM-DD-slug.md`.

```yaml
---
title: 'Espoolainen löysi parkkipaikan ensimmäisellä yrityksellä – tutkijat ymmällään'
slug: espoolainen-loysi-parkkipaikan # unique, kebab-case, [a-z0-9-]
date: 2026-07-01T06:30:00.000Z # ISO 8601
author: Lanttusanomat AI-toimitus # or a human editor
category: liikenne # one of the category registry slugs
summary: >- # deck/ingress, 1–2 sentences
  Tapaus on herättänyt kansainvälistä huomiota…
tags: [pysäköinti, espoo, tutkimus]
aiGenerated: true # drives AI badge + disclaimer
originalSources: # metadata only — NEVER rendered
  - https://example.fi/uutinen
heroImage: /images/heroes/liikenne.svg
published: true # false = excluded from build entirely
---
Article body in Markdown (400–800 words for AI articles)…
```

Validation: a `zod` schema (`src/lib/schema.ts`) parses every file at build time. Unknown category,
duplicate slug, missing field, or malformed date ⇒ **build fails**. `originalSources` exists only
for editorial traceability and is verifiably absent from all rendered output (asserted by tests).

**Categories** (fixed registry, Finnish slugs): `politiikka` (Politiikka), `liikenne` (Liikenne),
`ruoka` (Ruoka), `teknologia` (Teknologia), `talous` (Talous), `urheilu` (Urheilu),
`kotimaa` (Kotimaa).

**Transparency rendering rules:**

- Every article shows a **SATIIRI** badge and a disclaimer box stating the content is fictional.
- `aiGenerated: true` additionally shows a **TEKOÄLY** badge and an explicit "written with AI, not
  factual reporting" disclaimer, visually prominent at the top of the article.
- The site header/footer and the About page state that everything is satire.

## 4. Testing strategy

| Layer         | Tool                                                                                       | Coverage                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | **Vitest**                                                                                 | frontmatter schema, content parsing/sorting, markdown rendering, search index + scoring, slug/date utils, RSS parser, topic selection, safety filter, satire-output validation & Markdown serialization   |
| Integration   | **Vitest + React Testing Library** (jsdom)                                                 | article page rendering (badges, disclaimer, no `originalSources` leakage), category pages, homepage composition, RSS/sitemap/robots/search-index route output validity, JSON-LD builders                  |
| E2E           | **Playwright** against the real static build (`out/` served by `scripts/serve-static.mjs`) | homepage, article page, category navigation, search flow, **offline mode** (visit → go offline → still readable, offline indicator, offline fallback page), PWA basics (manifest, SW registration, icons) |
| Quality gates | **Lighthouse CI**                                                                          | Performance ≥ 95, SEO = 100, Accessibility ≥ 95, Best Practices ≥ 95 on home + article pages                                                                                                              |
| Static        | TypeScript `strict`, ESLint (next/core-web-vitals + next/typescript), Prettier             | whole repo                                                                                                                                                                                                |

Conventions: tests live in `tests/{unit,integration,e2e}`, fixtures in `tests/fixtures`. Integration
tests render real components with real fixture content — no snapshot-only tests. E2E runs against
the production build, not the dev server, so the service worker and headers behave as in production.

## 5. SEO strategy

- **Per-page metadata** via Next's Metadata API: title template (`%s | Lanttusanomat`), meta
  description, canonical URL, Open Graph (type `article` with `publishedTime`, `section`, `tags`),
  Twitter/X `summary_large_image` cards.
- **JSON-LD**: `NewsArticle` (with `isBasedOn` omitted; `author` as `Organization`) per article +
  `WebSite` with `SearchAction` on the home page. Built by `src/lib/seo.ts` (unit-tested).
- **`sitemap.xml` / `robots.txt`** via Next metadata routes, generated from the content graph.
- **RSS 2.0** at `/feed.xml` with correct `lang`, GUIDs, categories and RFC-822 dates.
- Clean, stable, human-readable Finnish slugs; one canonical URL per page; no query-param duplicates
  (search uses a param but is `noindex`-safe via robots rules on `/haku`).
- Social preview image per article (`heroImage`, absolute URL).
- `<html lang="fi">`, semantic landmarks, skip link, correct heading hierarchy.

## 6. Performance strategy

- **Static export**: every route is prebuilt HTML — TTFB is CDN-fast, FCP well under 1.5 s.
- **Minimal JavaScript**: server components everywhere; the only client components are the offline
  indicator, the SW registrar, and the search page. No analytics, no third-party scripts.
- **System font stack** — zero font downloads, zero CLS from font swap.
- **SVG illustrations** (~1–3 KB each), explicit dimensions to avoid CLS, `loading="lazy"` below the
  fold.
- **Immutable caching** for `/_next/static/*` (content-hashed) via `_headers`; HTML served with
  revalidation; `sw.js` with `no-cache` so updates roll out immediately.
- Budgets enforced in CI by Lighthouse CI assertions — regressions fail the pipeline.

## 7. PWA / offline strategy

- **Manifest** (`manifest.webmanifest`): name, short_name, Finnish description, `display:
standalone`, theme/background colors, `any` + `maskable` icons (192/512), `apple-touch-icon` +
  iOS meta for installability and splash on iOS.
- **Hand-written service worker** (`public/sw.js`, no framework plugin — auditable and testable):
  - **Precache** on install: `/`, `/offline`, manifest, icons, brand CSS-critical assets.
  - **Navigations (HTML)**: network-first → cache fallback → `/offline` fallback. Every
    successfully fetched page is cached, so _recently opened articles remain readable offline_ and
    the homepage serves its last cached version.
  - **`/_next/static/*` & images**: cache-first (immutable).
  - **`/search-index.json`**: stale-while-revalidate (search works offline).
  - Versioned cache names + activation cleanup; article cache capped (LRU trim) to bound storage.
- **Offline indicator**: a client component listening to `online`/`offline` events shows a visible
  "Ei verkkoyhteyttä" banner.
- **Background sync**: the MVP is read-only, so there is nothing user-generated to sync. The SW
  refreshes stale pages on next load (SWR pattern) which covers the "fresh after reconnect" need;
  a Periodic Background Sync feed refresh is noted as a Phase 3 enhancement (limited iOS support).

## 8. Automation workflow (AI article generation)

Runs in `.github/workflows/generate-articles.yml` on cron (**2×/day**, ~08:00 & ~15:00 Helsinki
time) + manual `workflow_dispatch`.

Two-stage pipeline — deterministic topic discovery, then Claude Code writing:

1. **Topic discovery** (`scripts/select-topics.mts` over `src/generation/*`, pure + unit-tested):
   1. **Fetch** RSS headlines from Yle, HS, Ilta-Sanomat, Iltalehti (public RSS feeds; titles +
      descriptions only).
   2. **Cluster** items across sources by token overlap → topics covered by multiple outlets rank
      higher (that's "today's major news").
   3. **Safety-filter** topics against the banned list (war, terrorism, death, illness, tragedies,
      private individuals, …) — keyword-based, and reiterated in the Skill prompt.
   4. **Print a briefing**: a short _internal factual summary_ per topic (source titles +
      descriptions distilled) plus source URLs. Never full source article text.
2. **Writing** (the [Claude Code GitHub Action](https://code.claude.com/docs/en/github-actions)):
   Claude Code reads the briefing and the versioned skill (`skills/satiiri/SKILL.md`) and writes one
   original 400–800-word Finnish satire article per chosen topic straight into `content/articles/`
   with full frontmatter (`aiGenerated: true`, `originalSources` filled).
3. **Editorial gate** (`scripts/validate-articles.mts`): re-checks the new files against the zod
   frontmatter schema, `aiGenerated`, word count and the banned-topic filter; a final `pnpm build`
   re-validates all content. Any failure fails the run — publishing nothing beats publishing garbage.
4. **Commit & push** to `main` → Cloudflare auto-deploys.

Originality guarantees: the writer only ever sees a distilled topic briefing (not article text) and
the skill forbids reusing wording/structure. Secret: `CLAUDE_CODE_OAUTH_TOKEN` (a Claude
subscription token) as a GitHub Actions secret, plus the Claude GitHub App installed on the repo;
nothing reaches the frontend.

## 9. Cloudflare deployment

- **Cloudflare Pages** connected to the GitHub repo.
  - Build command: `pnpm build` · Output directory: `out` · Env: `NODE_VERSION=22`,
    `NEXT_PUBLIC_SITE_URL=https://<domain>`.
  - Production branch `main`; every PR gets a preview deployment automatically.
- `public/_headers` ships security + caching headers (see §11) — Pages applies them at the edge.
- Cloudflare provides TLS, HTTP/3, Brotli, global caching and DDoS protection out of the box. There
  are no APIs in the MVP, so no rate limiting is needed; if APIs appear later they'll be Workers
  behind Cloudflare rate-limiting rules.
- Custom domain later: add to Pages, set `NEXT_PUBLIC_SITE_URL`, redeploy (canonicals/sitemap/RSS
  all derive from that variable).

## 10. CI/CD pipeline

`.github/workflows/ci.yml`, on push/PR:

```
check   → pnpm typecheck · pnpm lint · pnpm format:check · pnpm test (unit + integration, coverage)
build   → pnpm build (static export; content validation runs here) → upload out/ artifact
e2e     → (needs build) Playwright against served out/
lhci    → (needs build) Lighthouse CI with budget assertions
```

All four gates must pass to merge. The generation workflow is separate and never blocks CI.
Deployment itself is Cloudflare Pages' GitHub integration (build-on-push), so there is no deploy
step (or secret) in Actions.

## 11. Security headers

Delivered via `public/_headers` (Cloudflare Pages):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
/images/*  · /icons/*
  Cache-Control: public, max-age=86400
/sw.js
  Cache-Control: no-cache
```

Notes: `'unsafe-inline'` for scripts is required by Next.js static export (hydration bootstrap);
there is no user input rendered as HTML and no third-party origin in the policy, keeping the
practical XSS surface minimal. No secrets exist in the frontend at all; the only secret in the
system (`CLAUDE_CODE_OAUTH_TOKEN`) lives in GitHub Actions.

## 12. MVP delivery steps

**Phase 1 — this implementation**

1. Project scaffold: Next.js 15 + TS strict + Tailwind 4 + pnpm + ESLint/Prettier.
2. Content library: schema, loader, markdown pipeline, categories (+ unit tests).
3. Pages: home, article, category, search, about, privacy, 404, offline.
4. SEO: metadata, JSON-LD, sitemap, robots, RSS, canonical URLs.
5. PWA: manifest, icons, service worker, offline indicator, offline fallback.
6. Search: build-time index + client search page.
7. Example articles (8, all categories, AI & manual mix) with SVG illustrations.
8. Tests: unit + integration + Playwright e2e (incl. offline) + Lighthouse CI config.
9. CI workflow; Cloudflare `_headers`; README; MIT license.

**Phase 2 — included in this implementation (dormant until the API key secret is set)**

10. Generation library (`src/generation`) + Satire Skill + orchestrator script (+ unit tests).
11. Scheduled GitHub Actions workflow (2 articles/day, auto-commit → auto-deploy).

**Phase 3 — future**

AI raster illustration pipeline · trending section · newsletter · social sharing · editorial
dashboard · privacy-friendly analytics · scheduled publishing (frontmatter `date` in the future +
daily rebuild cron is the planned mechanism).
