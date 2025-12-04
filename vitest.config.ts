/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    poolOptions: {
        threads: {
          maxThreads: 16,
          minThreads: 8,
          useAtomics: true
        },
      },
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/main.ts',
        'src/main.server.ts',
        'src/server.ts'
      ]
    }
  }
});
