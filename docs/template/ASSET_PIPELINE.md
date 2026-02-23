# Asset Pipeline

Drop assets → build → validate. The template does not own backend spins/outcomes; it only wires assets and config.

## Overview

1. **Drop assets** into `assets/boot` and `assets/main` (and optionally audio sources for sprites).
2. **Build** manifest and typings: `pnpm assets:build`.
3. **Validate** references: `pnpm assets:check`.

## Commands

| Command | Purpose |
|--------|----------|
| `pnpm assets:build` | Full pipeline: audio sprite (if configured) + manifest + `src/Asset.d.ts`. |
| `pnpm assets:check` | Doctor (env, manifest, engine) + asset-key validation (slotConfig + brand vs manifest). |
| `pnpm assets:manifest` | Generate only manifest + typings (no audio sprite). |
| `pnpm assets:audio` | Build only audio sprite. |

## What gets generated

- **`assets/manifest.json`** — Bundles (e.g. `boot`, `main`) and asset entries (key, type, url). The engine loads assets by these keys.
- **`src/Asset.d.ts`** — TypeScript types and helpers for asset keys (textures, spritesheets, fonts, audio, etc.).

Asset keys are derived from file paths under each bundle directory (e.g. `main/symbols/9.png` → key `symbols/9`). Normalization (e.g. case, aliases) is applied per `tools` config.

## Referenced keys

The template references asset keys from:

- **`src/config/slotConfig.ts`** — `symbols[].spriteKey` for the **game scene** reels (engine SlotGameScene). Must exist in the main bundle.
- **`src/brand/BrandConfig.ts`** — Uses `UI_ASSETS` from `src/ui/reference/AssetMap.ts` for:
  - **bootConfig** (loading/start): logo image key, font key for labels/CTA. Must exist in boot or main as specified.
  - **frameConfig**: game scene frame image key. Must exist in the main bundle.

## Validation (`pnpm assets:check`)

- **Doctor** — Engine dependency, asset folders, manifest exists, Node version, etc.
- **Asset-key check** — Collects keys from slotConfig and AssetMap (UI_ASSETS); ensures they exist in `manifest.json`. If any are missing, the check prints an **actionable list of missing keys**. Add those assets to the right bundle (boot/main) or fix key names and run `pnpm assets:build` again.

Errors are designed to be actionable: you get a clear list of missing keys so you can add or rename files and rebuild.

## Drop assets → build → validate

1. Add or replace files in `assets/boot` and `assets/main`.
2. Run **`pnpm assets:build`** to refresh manifest and `Asset.d.ts`.
3. Run **`pnpm assets:check`** to ensure every key referenced by slotConfig and brand (bootConfig, frameConfig) exists in the manifest.
4. Fix any missing keys reported, then repeat build/check until clean.

No custom backend or outcome logic—only asset keys and config.
