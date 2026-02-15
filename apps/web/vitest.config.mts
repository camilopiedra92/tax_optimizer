
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'test/audit-fixes.test.ts'],
    // Use 'node' environment by default for pure unit tests (tax engine)
    // React component tests can override with // @vitest-environment jsdom
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['lib/tax-engine/**/*.ts'],
      exclude: [
        'lib/tax-engine/types.ts',       // Pure type definitions, no runtime code
        'lib/tax-engine/__tests__/**',    // Test files themselves
      ],
    },
  },
})
