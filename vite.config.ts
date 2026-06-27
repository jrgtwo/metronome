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
  build: {
    rollupOptions: {
      output: {
        // Split the heavy, rarely-changing vendors (Tone.js audio engine, React)
        // into their own chunks: parallel download + long-term caching, and it
        // keeps any single chunk under the 500 kB warning. (These are still loaded
        // eagerly — meaningfully shrinking the critical JS needs the lib to defer
        // Tone until first Play; that's a @fretwork/lib change, out of scope here.)
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/]tone[\\/]/.test(id)) return 'tone';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
        },
      },
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
