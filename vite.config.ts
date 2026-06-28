// `vitest/config`'s defineConfig is a superset of Vite's that types the `test` key
// natively — so no `as any` cast is needed (was CQ-6).
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// Injects the committed skeleton.html (a snapshot of the real rendered #root, made by
// `pnpm snapshot`) into #root at BUILD time, as the gray paint-shell (.skel). Build-only
// so Vercel needs no browser. See scripts/gen-skeleton.mjs and the `.skel` CSS in index.html.
function injectSkeleton() {
  return {
    name: 'inject-skeleton',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      let skel = '';
      try {
        skel = readFileSync(path.resolve(__dirname, 'skeleton.html'), 'utf8').trim();
      } catch {
        return html; // no snapshot yet — leave #root empty
      }
      if (!skel) return html;
      return html.replace(
        '<div id="root"></div>',
        `<div id="root"><div class="skel" aria-hidden="true">${skel}</div></div>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), injectSkeleton()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heavy, rarely-changing vendors (Tone.js audio engine, React)
        // into their own chunks: parallel download + long-term caching. (Still
        // loaded eagerly — meaningfully shrinking the critical JS needs the lib to
        // defer Tone until first Play; that's a @fretwork/lib change, out of scope.)
        // Vite 8 / Rolldown chunk grouping (replaces the manualChunks function form).
        codeSplitting: {
          groups: [
            { name: 'tone', test: /[\\/]node_modules[\\/]tone[\\/]/ },
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
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
});
