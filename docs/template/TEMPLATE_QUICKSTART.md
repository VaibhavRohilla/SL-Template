# Template Quickstart (10 min)

Get the SDK-only slot template running locally in about 10 minutes.

## Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) or npm

## 1. Install dependencies

```bash
pnpm install
```

If the engine is provided as a local tarball:

```bash
pnpm sdk:install
```

## 2. Build assets (manifest + typings)

```bash
pnpm assets:build
```

This generates `assets/manifest.json` and `src/Asset.d.ts` from your `assets/boot` and `assets/main` folders.

## 3. Run the game

```bash
pnpm dev
```

Open **http://localhost:3000**. You should see the loading screen, then the start screen, then the game canvas.

## 4. Validate setup

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

All four should pass. Optional: `pnpm assets:check` runs the doctor and asset-key validation.

## Project layout (what matters)

| Path | Purpose |
|------|---------|
| `src/main.ts` | Single entrypoint; calls bootstrap |
| `src/bootstrap/bootstrap.ts` | Wires Engine, config, UI; uses engine LoadingScene, StartScene, SlotGameScene |
| `src/config/slotConfig.ts` | Symbols, reels, paytable, paylines (symbol spriteKeys = game scene assets) |
| `src/brand/BrandConfig.ts` | Theme, dimensions, bootConfig (loading/start), game background/frame |
| `src/brand/SpinFeel.ts` | Reel timings and spin feel |
| `src/ui/GameUI.ts` | Balance, bet, win display (implements SDK interfaces) |

Loading and start screens are the **engine’s built-in** scenes. The game scene is the engine’s **SlotGameScene**; ensure `slotConfig` symbol spriteKeys and `frameConfig.imageKey` exist in the manifest.

## Next steps

- **Rebrand:** See [BRANDING_GUIDE.md](./BRANDING_GUIDE.md).
- **Assets:** See [ASSET_PIPELINE.md](./ASSET_PIPELINE.md).
- **SDK-only rules:** See [SDK_ONLY_TEMPLATE.md](./SDK_ONLY_TEMPLATE.md).
