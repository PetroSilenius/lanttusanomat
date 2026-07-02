/**
 * One-shot icon generation: rasterizes public/icons/icon.svg into the PNG
 * sizes required by the PWA manifest and iOS. The generated PNGs are
 * committed to the repo, so this only needs to be re-run when the source
 * SVG changes: `pnpm generate:icons`.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const iconsDir = path.join(process.cwd(), 'public', 'icons')
const svg = await readFile(path.join(iconsDir, 'icon.svg'))

const outputs = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  // Maskable icons keep the artwork inside the ~80% safe zone.
  { file: 'icon-maskable-192.png', size: 192, padding: 0.12 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0.12 },
  { file: 'apple-touch-icon.png', size: 180, padding: 0 },
]

for (const { file, size, padding } of outputs) {
  const inner = Math.round(size * (1 - padding * 2))
  const pad = Math.round(size * padding)
  const image = sharp(svg).resize(inner, inner)
  const buffer =
    pad > 0
      ? await image
          .extend({
            top: pad,
            bottom: size - inner - pad,
            left: pad,
            right: size - inner - pad,
            background: '#4a1d6e',
          })
          .png()
          .toBuffer()
      : await image.png().toBuffer()
  await sharp(buffer).toFile(path.join(iconsDir, file))
  console.log(`wrote public/icons/${file}`)
}
