import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // The git-dependency ships a built `dist/` barrel that uses directory
    // imports (`export * from './foo'`). Node's ESM loader rejects those, so
    // inline the package and let Vite resolve it for any test that imports it.
    server: { deps: { inline: [/@fretwork\/lib/] } },
  },
} as any);
