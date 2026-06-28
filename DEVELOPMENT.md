# Development guide — metronomnom

Everything you need to run, build, test, and contribute to the app. For what the product
*is*, see the [README](./README.md).

The app is a single-screen **React 19 + Vite 8 (Rolldown) + Tailwind 3.4** SPA (TypeScript 6,
Vitest 4). It's mostly **composition and layout** — the timing engine, audio, design tokens,
and calibration primitives all live in the [`@fretwork/lib`](https://github.com/jrgtwo/fretwork-lib)
git dependency; ads/entitlements live in [`adkit`](https://github.com/jrgtwo/adkit).

---

## Prerequisites

- **Node ≥ 20.19** (or ≥ 22.12) — required by Vite 8.
- **pnpm** (the repo is pnpm-only; a `pnpm-lock.yaml` is committed).
- Network access to the two GitHub git-dependencies at install time (see below).

## Git dependencies (read this before `pnpm install` or debugging install)

Two dependencies point at sibling repos rather than the npm registry:

```jsonc
// package.json
"@fretwork/lib": "github:jrgtwo/fretwork-lib#v0.1.0",  // audio/metronome engine, design tokens, calibration
"adkit":         "github:jrgtwo/adkit#v0.1.0"          // ad slots + entitlement store
```

- Both ship their built `dist/` via a `prepare` script, so they're listed in
  `pnpm.onlyBuiltDependencies`. The `#v0.1.0` tags exist and `pnpm install` works as-is.
- Install only fails if a referenced repo/tag is missing/unpushed, or (on CI/Vercel) the repos
  aren't reachable.
- **Local dev against sibling checkouts:** `pnpm link ../fretwork-lib` / `pnpm link ../adkit`.
- **Bumping a dep:** tag the dep repo (`git tag v0.2.0 && git push --tags`), then change
  `#v0.1.0` → `#v0.2.0` in `package.json` here and reinstall.

## Getting started

```bash
pnpm install
pnpm dev        # Vite dev server (http://localhost:5173)
```

The first time you run `pnpm snapshot` (or your first layout commit, see below), it auto-installs
a headless Chromium shell — no other setup needed.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server with HMR. |
| `pnpm build` | `tsc -b && vite build` — typecheck, then bundle (also injects the paint-shell). |
| `pnpm preview` | Serve the production `dist/` build locally. |
| `pnpm test` | `vitest run` (jsdom). Single file: `pnpm test -- src/path/File.test.tsx`. |
| `pnpm lint` / `pnpm lint:fix` | ESLint 9, **type-checked**. |
| `pnpm snapshot` | Regenerate the paint-shell `skeleton.html` from the real app. |

There is **no separate typecheck script** — typechecking happens in `pnpm build` via `tsc -b`,
and `tsconfig.app.json` enables `noUnusedLocals`/`noUnusedParameters`, so unused vars/params and
dead code are **build-breaking**.

## Project structure

```
src/
  main.tsx                 # entry — import order is load-bearing (see below)
  MetronomeApp.tsx         # the whole screen; calls useMetronome() and spreads into components
  audio-context-init.ts    # forces 48kHz before Tone.js lazily creates the AudioContext
  theme.ts                 # useTheme() — light | dark, persisted, applied as a class on <html>
  ads.config.ts            # house (placeholder) ad provider
  lib/utils.ts             # cn() (shadcn convention)
  components/              # presentational; take engine state as props (so they test in isolation)
    ui/dialog.tsx          # shadcn/ui Dialog (the one shadcn component so far)
    Mascot.tsx + mascotAnim.ts   # the animated metronome mascot (pure anim math is unit-tested)
    BeatDots.tsx, BpmControl.tsx, TimeSignaturePicker.tsx, FeelControl.tsx, VolumeControl.tsx, …
  calibration/             # the app's differentiator — output-latency compensation
    useCalibration.ts      # tap-in state machine + device-change listener
    nativeLatency.ts       # platform seam (web returns null; a future Tauri shell swaps it)
    CalibrationSheet.tsx
  styles/index.css         # Tailwind layers + theme override blocks + the .metro-range slider
tests/setup.ts             # jest-dom matchers + ResizeObserver stub
scripts/gen-skeleton.mjs   # generates skeleton.html (paint-shell) from the real app
skeleton.html              # generated, committed — injected into #root at build
index.html, vite.config.ts, tailwind.config.ts, eslint.config.js, components.json
```

### Load-bearing import order in `src/main.tsx` — do not reorder

1. `import './audio-context-init'` **must be first** — it calls `forceSampleRate(48000)` before
   any module triggers Tone.js's lazy `AudioContext` creation (some systems report 192 kHz and
   quadruple per-sample work).
2. `@fretwork/lib/styles/tokens.css` **must come before** `./styles/index.css` so Tailwind's
   generated layers can reference the lib's CSS variables.

### State

All metronome state comes from the lib: `MetronomeApp.tsx` calls `useMetronome()` (which wires the
shared store to the engine singleton) and spreads the result into presentational components. **To
change timing/state behavior, change the lib — not this app.**

## Theming (two "fun" themes: light + dark)

Themes re-skin the lib's **semantic CSS variables** (not component code) via `:root.theme-light`
(Retro 70s) and `:root.theme-dark` (Warm Dark) override blocks in `src/styles/index.css`. The
variables themselves are defined in `@fretwork/lib`'s `tokens.css`; `tailwind.config.ts` maps
Tailwind color names onto them.

> **Rule:** never invent raw colors in `tailwind.config.ts`. Themed colors are **lib-owned** —
> add/override the CSS variable instead. (Same reason the token CSS import must come first.)

The theme is applied **pre-paint** via an inline script in `index.html` that mirrors `theme.ts`
(avoids a palette flash) — keep the two in sync.

## Calibration (the differentiator)

`src/calibration/` compensates for audio output latency so beats land on time. Two sources, in
priority order: a native OS-reported latency via the `nativeLatency` seam (web always returns
`null`), then the browser's `AudioContext.outputLatency` + a user-saved per-device offset from the
manual tap-in. The engine applies `getEffectiveLatencySec()` = browser outputLatency + saved
offset. `nativeLatency.ts` is the **only** change calibration needs when a native (Tauri) shell lands.

## The paint-shell skeleton

Because the app is client-rendered, `#root` is empty until React runs. To paint instantly, the
**build** injects a gray skeleton into `#root`:

- `pnpm snapshot` (`scripts/gen-skeleton.mjs`) renders the *built* app in headless Chromium
  (`playwright-core`, auto-installs the headless shell on first run) and snapshots the real `#root`
  DOM into the committed **`skeleton.html`** — so the skeleton's layout always matches the app.
- A build-time Vite plugin (`vite.config.ts`, `apply:'build'`) injects `skeleton.html` into `#root`
  wrapped in `.skel`; the `.skel` rules in `index.html` paint it as flat gray placeholders.
- The **Husky pre-commit hook auto-regenerates** it when `src/` or `index.html` change, so it never
  drifts. (Vercel needs no browser — the build just reads the committed file.)

The app can't be server-rendered (Tone.js/AudioContext at import need a browser), which is why the
skeleton is captured with a real headless browser.

## Conventions

- **Path alias** `@` → `src/` (configured in `vite.config.ts` and `tsconfig`).
- **Linting:** ESLint 9 flat config, **type-checked** (`eslint.config.js`: typescript-eslint
  `recommendedTypeChecked` + react-hooks + jsx-a11y + react-refresh). Run on commit by the **Husky
  pre-commit** hook (which also regenerates the skeleton). `reportUnusedDisableDirectives` is on, so
  stale `eslint-disable`s error.
- **Fire-and-forget async:** `void m.toggle()` is the deliberate style (and satisfies
  `no-floating-promises`).
- **Components take engine state as props** (primitives + stable callbacks) and are `React.memo`'d,
  so the per-tick re-render of `MetronomeApp` doesn't re-render the controls. Keep props stable.
- **Tests:** Vitest + jsdom, `globals: true`. `tests/setup.ts` loads jest-dom matchers and stubs
  `ResizeObserver`. `vite.config.ts` inlines `@fretwork/lib` via `test.server.deps.inline` (its
  built `dist/` barrel uses directory imports Node's ESM loader rejects). Presentational components
  test in isolation; pure animation math lives in `mascotAnim.ts` with unit tests.

## Testing

```bash
pnpm test                                  # all tests
pnpm test -- src/components/mascotAnim.test.ts   # one file
```

Current suites: `BeatDots.test.tsx` (presentational) and `mascotAnim.test.ts` (pure phase/geometry
math). Prefer testing pure functions and presentational components over the engine (which lives in
the lib).

## Deployment (Vercel)

- Vercel project on this repo, **Vite** preset: build `pnpm build`, output `dist` (auto-detected).
- The git-dependency repos must be **reachable at build time** — public repos work out of the box;
  private repos need Vercel to have GitHub access.
- No browser is needed at build (the paint-shell is read from the committed `skeleton.html`).

## Troubleshooting

- **`pnpm install` fails** → almost always the git deps: confirm `jrgtwo/fretwork-lib` and
  `jrgtwo/adkit` exist, are pushed, and the `#v0.1.0` tags are present (or `pnpm link` local checkouts).
- **Audio sounds wrong / high CPU** → check the `audio-context-init` import is still first in
  `main.tsx`.
- **A new color renders transparent** → it's not a lib token; add the CSS variable in the lib (and
  the theme override blocks), don't hard-code a hex in `tailwind.config.ts`.
- **Skeleton looks stale / mismatched** → run `pnpm snapshot` (the pre-commit hook does this
  automatically on `src/`/`index.html` changes; skip a commit's hook with `--no-verify` if needed).
