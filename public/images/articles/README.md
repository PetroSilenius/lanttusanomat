# Article-specific hero images

Drop a bespoke hero illustration for a single article here as
`<slug>.svg`, then set the article's `heroImage` frontmatter to
`/images/articles/<slug>.svg`.

This overrides the shared per-category illustration (see
`src/lib/heroes.ts`). Follow the same house style as the category heroes:
flat, bold, distinctly stylized SVG on a `1200 × 630` canvas, system-font
text only, no external references. The referenced file must exist under
`public/` or the build fails (`loadArticles` in `src/lib/content.ts`).
