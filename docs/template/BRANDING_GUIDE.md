# Branding Guide

Exact files to edit for branding and theme. No backend or outcome logic—purely config and assets.

## Files to edit

### 1. **Slot content: symbols, reels, paytable**

**File:** `src/config/slotConfig.ts`

- `gameId`, `gameName`, `version` — game identity.
- `symbols` — symbol definitions; each has `id`, `name`, `displayType`, `spriteKey` (must match manifest asset keys).
- `reels.strips` — reel strips (symbol IDs per column).
- `paytable` — payouts per symbol and count (e.g. `'3'`, `'4'`, `'5'`).
- `wild`, `betConfig`, `paylines` — wild rules, bet steps, line patterns.

Keep `spriteKey` values in sync with `assets/main` (or boot) and run `pnpm assets:build` so they exist in `manifest.json`.

### 2. **Theme, dimensions, boot (loading/start) and game scene**

**File:** `src/brand/BrandConfig.ts`

- **`colors`** — Primary, accent, background, text (hex numbers).
- **`backgroundConfig`** — Game scene background (e.g. solid color). Used by engine SlotGameScene.
- **`frameConfig`** — Game scene frame overlay; `imageKey` must match manifest (uses `UI_ASSETS.SCENE.FRAME` from AssetMap).
- **`bootConfig`** — Drives the **engine’s built-in** LoadingScene and StartScene: `bootBundle`, `mainBundle`, `loading` (background, logo asset key, loader type, labels), `start` (background, logo, CTA text/font). Logo and any image backgrounds use asset keys from `UI_ASSETS`.
- **`dimensions`** — Viewport width/height for the app.

Asset keys used here come from `src/ui/reference/AssetMap.ts` (`UI_ASSETS`). Ensure those keys exist in the manifest (run `pnpm assets:check`).

### 3. **Spin feel: reel timings and behavior**

**File:** `src/brand/SpinFeel.ts`

- Export **`spinFeelConfig`** — Reel stop delays, bounce, EASING, any timing/audio mapping the engine supports.
- Adjust to match desired “snappiness” and feedback.

### 4. **Asset key mapping (boot + game scene)**

**File:** `src/ui/reference/AssetMap.ts`

- **`UI_ASSETS`** — Logical names to manifest asset keys: loading logo, frame, fonts, etc. Used by `bootConfig` (loading/start logo, CTA font) and `frameConfig` (game scene frame). When you add or rename assets, update AssetMap and run `pnpm assets:build` / `pnpm assets:check`.

### 5. **Game UI (balance, bet, win display)**

**File:** `src/ui/GameUI.ts`

- Implements SDK `ISlotUI` and `IWinFormatter`.
- Edit for initial balance, currency symbol, locale, decimals, and any DOM hooks for balance/bet/win if you use HTML overlays.

## Summary

| What you want to change | File(s) |
|-------------------------|--------|
| Symbols, reels, paytable, paylines | `src/config/slotConfig.ts` |
| Theme, dimensions, boot (loading/start), game background/frame | `src/brand/BrandConfig.ts` |
| Reel timings / spin feel | `src/brand/SpinFeel.ts` |
| Boot + game scene asset keys | `src/ui/reference/AssetMap.ts` |
| Balance, bet, formatting | `src/ui/GameUI.ts` |

Loading and start screens are the **engine’s built-in** scenes, driven by `bootConfig`. Game scene is the engine’s **SlotGameScene**; its assets are `slotConfig.symbols[].spriteKey` and `frameConfig.imageKey`. No custom backend or outcome logic—only config and assets.
