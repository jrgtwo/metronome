// MUST be the very first import — forces the Tone.js AudioContext sample rate
// before any other module triggers Tone's lazy context creation. See
// audio-context-init.ts.
import './audio-context-init';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { AdsProvider, entitlementStore } from 'adkit';
import { MetronomeApp } from './MetronomeApp';
import { adsConfig } from './ads.config';

// App-owned design tokens + Tailwind layers. The app owns its entire design
// system (see src/styles/index.css); nothing stylistic is imported from
// @fretwork/lib, which is consumed only for logic (the useMetronome engine).
import './styles/index.css';

// Dev-only: expose the entitlement store so you can test the ad-hide seam from
// the console — `entitlementStore.grant('removeAds')` hides the footer ad,
// `entitlementStore.revoke('removeAds')` brings it back.
if (import.meta.env.DEV) {
  (window as unknown as { entitlementStore: typeof entitlementStore }).entitlementStore =
    entitlementStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdsProvider config={adsConfig}>
      <MetronomeApp />
      <Analytics />
    </AdsProvider>
  </StrictMode>,
);
