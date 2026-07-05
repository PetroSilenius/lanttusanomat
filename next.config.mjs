/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // Static export cannot run the image optimizer; all site imagery is
  // hand-optimized SVG, so the optimizer is unnecessary anyway.
  images: {
    unoptimized: true,
  },
  // Fail the build on type errors instead of shipping them. (Next 16 no
  // longer runs ESLint during builds; linting is a separate CI step.)
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
