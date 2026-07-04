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
Helsinki time). Topic discovery always runs in deterministic, unit-tested code:

1. fetch RSS headlines from Yle, HS, Ilta-Sanomat and Iltalehti,
2. cluster them into topics across sources and drop unsafe ones,
3. build an internal factual summary per topic (never full article text).

The articles themselves are then written by one of two engines, depending on
which secret is configured:

- **`CLAUDE_CODE_OAUTH_TOKEN`** (Claude subscription, via `claude setup-token`):
  the [Claude Code GitHub Action](https://code.claude.com/docs/en/github-actions)
  reads the topic briefing and `skills/satiiri/SKILL.md` and writes the article
  files. A separate validation script (`scripts/validate-articles.mts`) then
  re-applies the editorial gates (schema, word count, banned topics) before
  anything is committed.
- **`ANTHROPIC_API_KEY`** (Console API key): the SDK pipeline calls Claude with
  schema-validated structured output and validates in-process (length, category,
  banned topics, headline originality).

Either way, a final `pnpm build` re-validates all content, and invalid output
fails the run instead of being published. The commit to `main` triggers the
Cloudflare deployment.

```bash
pnpm generate:articles --dry-run    # show today's candidate topics, no API calls
pnpm generate:articles --count 2    # SDK pipeline (needs ANTHROPIC_API_KEY)
```

## Deployment (Cloudflare)

The site is a pure static export — deploy it as static files, **not** through a
Next.js server adapter (OpenNext does not apply and will fail on `output: 'export'`).

**Option A — Workers with static assets (Workers Builds):**

1. Create a Worker connected to this repository (Workers & Pages → Create → import repo).
2. Build command `pnpm build`, deploy command `npx wrangler deploy`.
3. [`wrangler.jsonc`](wrangler.jsonc) in the repo does the rest: it deploys `out/`
   as static assets only, with clean URLs and the 404 page wired up. Its presence
   also stops wrangler's auto-configuration from installing the OpenNext adapter.

**Option B — classic Cloudflare Pages:**

1. Create a Pages project connected to this repository.
2. Build command `pnpm build`, output directory `out`, production branch `main`.
3. No deploy command is needed — Pages uploads `out/` itself.

Environment variables: see below. Security and caching headers ship in
[`public/_headers`](public/_headers) (CSP, `X-Frame-Options`, immutable caching
for hashed assets, `no-cache` for the service worker); both Workers static
assets and Pages honor the `_headers` file.

## Environment variables

| Variable                  | Where                      | Purpose                                                                                                                                                                  |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`    | Cloudflare Pages build env | Canonical origin for metadata, sitemap, RSS (default `https://lanttusanomat.pages.dev`)                                                                                  |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub Actions **secret**  | Claude subscription token from `claude setup-token` — articles are then written by the Claude Code GitHub Action. Preferred when you have a Claude Pro/Max subscription. |
| `ANTHROPIC_API_KEY`       | GitHub Actions **secret**  | Alternative: Claude Console API key (`sk-ant-api…`) — articles are then written by the deterministic SDK pipeline. The workflow no-ops when neither secret is set.       |
| `NODE_VERSION`            | Cloudflare Pages build env | Set to `22`                                                                                                                                                              |

There are no runtime secrets — the deployed site is purely static files.

## Dependency updates

Dependency updates are automated with [Renovate](https://docs.renovatebot.com/)
([`renovate.json`](renovate.json)): weekly grouped update PRs, monthly lockfile
maintenance, pinned GitHub Action digests, and automerge for dev-dependency
minors once CI is green. Majors always wait for review, and `zod` majors are
blocked on purpose (see `AGENTS.md` for the v3/v4 split). To activate it,
install the [Renovate GitHub App](https://github.com/apps/renovate) and grant
it access to this repository.

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
