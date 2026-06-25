# Metronome

A small, latency-honest metronome. Reuses the audio/metronome engine from
[`@fretwork/lib`](https://github.com/jrgtwo/fretwork-lib) and the ads kit
[`adkit`](https://github.com/jrgtwo/adkit), both consumed as **git dependencies** (no npm registry).

## Dependencies (important)

Two deps point at sibling repos that ship their built `dist/` via a `prepare` script:

```jsonc
"@fretwork/lib": "github:jrgtwo/fretwork-lib#v0.1.0",
"adkit":         "github:jrgtwo/adkit#v0.1.0"
```

**`pnpm install` will fail until those two repos exist, are pushed, and the `#v0.1.0` tags exist.**
Create + tag `adkit` and `fretwork-lib` first (see `docs/metronome-suite-extraction.md` in the
original monorepo). Until then, for local development you can point at local checkouts instead:

```bash
pnpm link ../adkit
pnpm link ../fretwork-lib    # or wherever the lib lives locally
```

## Develop

```bash
pnpm install
pnpm dev        # vite dev server
pnpm build      # tsc -b && vite build
pnpm test       # vitest
```

## Deploy (Vercel)

New Vercel project on this repo. Framework **Vite**, build `pnpm build`, output `dist` (auto-detected).
The git-dep repos must be reachable at build time — public repos work out of the box; private repos
need Vercel to have GitHub access.

## Updating a dependency

Bump the tag and reinstall:

```
# in fretwork-lib (or adkit): commit → git tag v0.2.0 → git push --tags
# here: change #v0.1.0 → #v0.2.0 in package.json → pnpm install
```
