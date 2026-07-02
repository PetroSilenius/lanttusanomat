/**
 * Minimal static file server for the exported site (out/), used by e2e tests,
 * Lighthouse CI and local production preview. Mirrors Cloudflare Pages
 * behavior for the parts the app relies on:
 *  - clean URLs: /artikkeli/foo -> artikkeli/foo.html
 *  - / -> index.html, custom 404 page
 *  - a subset of the _headers file (security headers on HTML, sw.js no-cache)
 *
 * Usage: node scripts/serve-static.mjs [dir=out] [port=4173]
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const dir = path.resolve(process.argv[2] ?? 'out')
const port = Number(process.argv[3] ?? 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/'
  const candidates =
    clean === '/'
      ? ['index.html']
      : [clean.slice(1), `${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`]
  for (const candidate of candidates) {
    const filePath = path.join(dir, candidate)
    if (!filePath.startsWith(dir)) continue // path traversal guard
    if (existsSync(filePath) && statSync(filePath).isFile()) return filePath
  }
  return null
}

const server = http.createServer((req, res) => {
  const filePath = resolveFile(req.url ?? '/')
  const notFoundPage = path.join(dir, '404.html')
  const target = filePath ?? (existsSync(notFoundPage) ? notFoundPage : null)

  if (!target) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }

  const ext = path.extname(target)
  const headers = {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    ...SECURITY_HEADERS,
  }
  if (ext === '.html') {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate'
  } else if (target.includes(`${path.sep}_next${path.sep}static${path.sep}`)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  } else if (path.basename(target) === 'sw.js') {
    headers['Cache-Control'] = 'no-cache'
  }

  res.writeHead(filePath ? 200 : 404, headers)
  createReadStream(target).pipe(res)
})

server.listen(port, () => {
  console.log(`Serving ${dir} at http://localhost:${port}`)
})
