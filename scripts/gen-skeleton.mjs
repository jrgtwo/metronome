// Generates skeleton.html — a snapshot of the REAL rendered app's #root DOM, used as
// the static paint-shell (see the inject-skeleton plugin in vite.config.ts and the
// `.skel` styles in index.html). The app can't be server-rendered (Tone.js/AudioContext
// at import need a browser), so we render the production build in headless Chromium and
// capture #root after React mounts. Run via `pnpm snapshot` (and the pre-commit hook).
import { build, preview } from 'vite';
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const PORT = 4321;
const root = process.cwd();

console.log('[skeleton] building…');
await build({ logLevel: 'warn' });

console.log('[skeleton] starting preview…');
const server = await preview({ preview: { port: PORT, strictPort: true } });
const url = server.resolvedUrls.local[0];

let html = '';
const browser = await chromium.launch();
try {
  // A roomy width so the (capped, max-w-[300px]) beat-arc and everything else render
  // at their stable sizes; the captured DOM is otherwise responsive via CSS.
  const page = await browser.newPage({ viewport: { width: 412, height: 1000 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  // React (createRoot) clears #root and renders the app — wait until the wordmark exists
  // and the injected skeleton (.skel) is gone, then let the rest pose settle.
  await page.waitForFunction(() => {
    const r = document.getElementById('root');
    return !!r && !!r.querySelector('h1') && !r.querySelector('.skel');
  }, { timeout: 20000 });
  await page.waitForTimeout(300);
  html = await page.evaluate(() => document.getElementById('root').innerHTML);
} finally {
  await browser.close();
  server.httpServer?.close();
}

if (!html || html.length < 200) {
  console.error('[skeleton] capture looks empty — aborting, leaving skeleton.html unchanged');
  process.exit(1);
}

writeFileSync(path.join(root, 'skeleton.html'), html.trim() + '\n');
console.log(`[skeleton] wrote skeleton.html (${html.length} chars)`);
process.exit(0);
