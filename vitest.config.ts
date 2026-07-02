import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.{ts,tsx}'],
    // Unit tests run in node; component tests opt into jsdom per-file
    // via the `// @vitest-environment jsdom` docblock.
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/generation/**'],
      reporter: ['text', 'lcov'],
    },
  },
})
