# Agent instructions — Lanttusanomat

Lanttusanomat is a Finnish satire news site: a fully static Next.js 15 (App
Router, `output: 'export'`) PWA whose content is Markdown in this repo, plus an
AI pipeline that generates satire articles on a schedule. The full design is in
`docs/TECHNICAL_PLAN.md`; the human-facing overview is `README.md`.

## Commands

```bash
pnpm install          # pnpm only — do not use npm/yarn
pnpm dev              # dev server (no service worker in dev)
pnpm build            # static export to out/ — also validates all content
pnpm start            # serve out/ at :3000 (needed to test PWA/offline)
pnpm typecheck        # tsc --noEmit (strict mode)
pnpm lint             # ESLint
pnpm format           # Prettier write; format:check must pass in CI
pnpm test             # Vitest unit + integration (tests/unit, tests/integration)
pnpm test:e2e         # Playwright against the real static build (tests/e2e)
pnpm lhci             # Lighthouse CI budgets: perf ≥95, a11y ≥95, bp ≥95, SEO =100
pnpm generate:articles --dry-run   # AI pipeline topic selection, no API calls
```

Run a single Vitest file with `pnpm test tests/unit/search.test.ts`; a single
Playwright spec with `pnpm test:e2e tests/e2e/offline.spec.ts`.

Before committing: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`.
CI (`.github/workflows/ci.yml`) additionally runs build, e2e and Lighthouse; all
gates must stay green.

## Architecture map

- `src/lib/` — content loading, zod frontmatter schema, markdown pipeline,
  search, SEO builders. **Pure TypeScript, no React/Next imports.** Unit-tested.
- `src/generation/` — AI satire pipeline (feeds, RSS parsing, topic clustering,
  safety filter, Claude client, output validation, Markdown serialization).
  Same purity rule. Orchestrated by `scripts/generate-articles.mts`.
- `src/app/` + `src/components/` — the UI. Server components by default; the
  only client components are `OfflineIndicator`, `ServiceWorkerRegistrar` and
  `haku/SearchClient`. Keep it that way — minimal JS is a core requirement.
- `content/articles/*.md` — all articles. Frontmatter is validated at build
  time by `src/lib/schema.ts`; invalid content must fail the build.
- `skills/satiiri/SKILL.md` — the versioned editorial policy prompt for AI
  generation. Treat changes as editorial decisions, not refactoring.
- `public/sw.js` — hand-written service worker (intentionally no framework
  plugin). Bump the `VERSION` constant when changing caching behavior.
- `wrangler.jsonc` — deploys `out/` as **Cloudflare static assets only**. Never
  add a server adapter (OpenNext etc.); the site must stay a static export.

## Hard constraints

- **Static export only.** No server components with dynamic data fetching at
  request time, no route handlers without `dynamic = 'force-static'`, no
  middleware, no `next/image` optimization (images are `unoptimized`).
- **No new runtime dependencies without good reason.** Search, RSS parsing and
  the service worker are deliberately dependency-free.
- **No secrets in the frontend.** The only secret anywhere is
  `ANTHROPIC_API_KEY`, and it lives exclusively in GitHub Actions.
- **System font stack, no external requests.** The CSP in `public/_headers`
  allows same-origin only; anything loading from a third-party origin will be
  blocked in production.
- `src/generation/article.ts` imports zod from **`zod/v4`** (required by the
  Anthropic SDK's `zodOutputFormat`); `src/lib/schema.ts` uses zod v3 API from
  `zod`. Don't "unify" these.

## Editorial & safety rules (load-bearing, tested)

- Every article surface shows the **Satiiri** badge; `aiGenerated: true`
  additionally shows the **Tekoäly** badge and the AI disclaimer
  (`SatireDisclaimer`). Never remove or weaken these — tests assert them.
- `originalSources` frontmatter is metadata for traceability only. It must
  never appear in any rendered output, feed, or index — tests assert this too.
- The banned-topic list in `src/generation/safety.ts` uses Finnish inflection-
  surviving stems (e.g. `hyökkä`, not `hyökkäys`). When adding stems, prefer the
  shortest unambiguous prefix and add a unit test.
- Satire punches up (institutions, power, phenomena) — never at private
  individuals or vulnerable groups. This policy lives in
  `skills/satiiri/SKILL.md` and is enforced three times: topic filter, skill
  prompt, post-generation validation. Keep all three in sync.

## Content conventions

- Files are `content/articles/YYYY-MM-DD-slug.md`; slugs kebab-case, unique.
- Categories are the fixed registry in `src/lib/categories.ts`
  (politiikka, liikenne, ruoka, teknologia, talous, urheilu, kotimaa).
  Adding a category means updating the registry + a hero SVG in
  `public/images/heroes/` — the schema and generation whitelist follow from it.
- Site copy and content are Finnish; code, comments, commits and docs are English.

## Testing conventions

- Tests live in `tests/{unit,integration,e2e}` with fixtures in `tests/fixtures`
  — not next to source files.
- Integration tests render real server components by awaiting the page function
  (`await ArticlePage({ params: Promise.resolve({ slug }) })`) and use the
  `// @vitest-environment jsdom` docblock; the default Vitest env is node.
- E2E runs against the built `out/` served by `scripts/serve-static.mjs`, so the
  service worker behaves as in production. In sandboxes with a pre-installed
  Chromium at `/opt/pw-browsers/chromium`, `playwright.config.ts` picks it up
  automatically (never in CI).
- New features need tests at the same standard: unit for lib/generation logic,
  integration for rendering, e2e for user-visible flows.

## Deployment notes

- Cloudflare builds run `pnpm build` and `npx wrangler deploy`; `wrangler.jsonc`
  makes that a static-assets upload of `out/`. Its presence also prevents
  wrangler's auto-config from installing the OpenNext adapter — do not delete it.
- `NEXT_PUBLIC_SITE_URL` (build env) is the canonical origin for metadata,
  sitemap and RSS. `.env.example` documents all environment variables.
