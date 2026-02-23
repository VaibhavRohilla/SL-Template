# SL-Template vs SL-Engine: Architecture Analysis

**Role:** Senior Slot SDK Engineer / Architect  
**Purpose:** Confirm the template is correct and aligned with the engine contract.

---

## 1. Engine contract (SL-Engine)

### 1.1 Entry point

- **`Game`** (`src/app/App.ts`): single entry; `new Game(options)` then `await game.start()`.
- **`GameOptions`** requires: `slotConfig`, `spinFeelConfig`, `gameUI` (ISlotUI), `winFormatter` (IWinFormatter).
- Optional: `bootConfig`, `background`, `frame`, `scenes` (SceneFactories), `bootTasks`, `transitionStrategy`, `canvas`, `width`, `height`, `backgroundColor`, `seed`, `logLevel`, etc.

### 1.2 Config types

- **SlotConfig** (Zod-validated): `layout`, `reels`, `symbols` (id, name, displayType, spriteKey/spineKey, isHighValue), `paytable`, `wild`, `betConfig`, `paylines`, etc. Template must pass `validateSlotConfig()`.
- **SpinFeelConfig** (Zod-validated): timing/feel (start delays, stop delays, etc.). Template must pass `validateSpinFeelConfig()`.
- **BootConfig** (Zod-validated): `bootBundle`, `mainBundle`, `loading` (background, logo, loader, labels), `start` (background, logo, ctaText, ctaFontFamily, …), `transitionDurationMs`, `skipStartScreen`.

### 1.3 UI contracts

- **ISlotUI**: optional methods `onSpinStart`, `onSpinComplete`, `onWinUpdate`, `onBalanceUpdate`, `getCurrentBet`, `canAffordBet`, `deductBet`, `addWin`, jackpot hooks. Engine calls these; template implements.
- **IWinFormatter**: `formatWin(amount)`, `formatBalance(amount)`. Required.

### 1.4 Scenes

- **SceneFactories**: `loading?: (ctx) => ILoadingScene`, `start?: (ctx) => IStartScene`, `game?: (ctx) => IScene`. If omitted, engine uses built-in LoadingScene, StartScene, SlotGameScene.
- **ILoadingScene**: extends IScene; must implement `setProgress(progress, status?)`, `isComplete()`.
- **IStartScene**: extends IScene; must implement `setOnStart(callback)`, `hasUserInteracted()`.
- **SceneContext**: provides `assetAPI`, `audioBus`, `tweenService`, `logger`, `eventBus`, `presentationRng`, `bootConfig`, `slotConfig`, `spinFeelConfig`, `viewport`, `spinFlow`, `gameUI`, `winFormatter`, `backgroundConfig`, `frameConfig`, `resolveTexture(key)`.

### 1.5 View layers

- **background**: `BackgroundConfig` (solid/image/gradient, cosmetic only).
- **frame**: `SlotFrameConfig` (imageKey, anchor, scaleMode, etc., cosmetic only).

---

## 2. Template compliance

### 2.1 Bootstrap and options

| Contract | Template | Status |
|----------|----------|--------|
| Single entry | `main.ts` → `bootstrap/bootstrap.ts` → `new Game(gameOptions)` | ✅ |
| slotConfig | `config/slotConfig.ts` exported, passed in options | ✅ |
| spinFeelConfig | `brand/SpinFeel.ts` (uses engine `premiumPreset`), passed in options | ✅ |
| gameUI | `ui/GameUI.ts` implements ISlotUI, passed as `gameUI` | ✅ |
| winFormatter | Same instance (`gameUI`) implements IWinFormatter | ✅ |
| bootConfig | `brand/BrandConfig.ts` → `bootConfig`, partial BootConfig shape | ✅ |
| background | `backgroundConfig` from BrandConfig (game scene) | ✅ |
| frame | `frameConfig` from BrandConfig (game scene; uses AssetMap keys) | ✅ |
| scenes | Not passed; engine uses built-in LoadingScene, StartScene, SlotGameScene | ✅ |
| canvas | `'game-canvas'` | ✅ |
| width/height | `dimensions` from BrandConfig | ✅ |

### 2.2 Config validation

- Engine runs `validateSlotConfig(slotConfig)` and `validateSpinFeelConfig(spinFeelConfig)` before starting. Template’s configs are shaped to match engine schemas (symbols with spriteKey, paytable, wild, paylines, etc.). **Correct** as long as no extra/unknown fields break Zod (engine uses safeParse).

### 2.3 BootConfig shape

- Engine expects `loading: { background, logo?, loader?, labels? }`, `start: { background, logo?, ctaText, ctaFontFamily, … }`. BrandConfig supplies `loading.logo` with `type: 'image'`, `value: UI_ASSETS.LOADING.LOGO`, `yPositionPct`, `maxWidthPct`; `loader: { type: 'bar' }`; `labels` with font/color. **Compatible** with engine’s BootConfig schema. Loading and start screens are the **engine’s built-in** LoadingScene and StartScene.

### 2.4 Scenes (engine built-in)

- **LoadingScene** and **StartScene**: Template does not pass custom scene factories. The engine uses its own `LoadingScene.fromContext(ctx)` and `StartScene.fromContext(ctx)`, driven by `bootConfig.loading` and `bootConfig.start` (logo asset key, CTA text, colors, etc.). Boot bundle must contain any asset keys referenced in bootConfig (e.g. `UI_ASSETS.LOADING.LOGO`).
- **Game scene**: Engine uses **SlotGameScene.fromContext(ctx)**. It uses `ctx.slotConfig` (symbols’ `spriteKey` for reels), `ctx.backgroundConfig`, and `ctx.frameConfig` (frame `imageKey`). All symbol spriteKeys and the frame imageKey must exist in the manifest (main bundle).

### 2.5 No backend/outcome logic in template

- Template does not import or implement outcome adapters, spin response parsing, or recovery logic. Engine owns spin flow and (via adapters) backend. **Correct.**

---

## 3. Unused folders removed

- **Empty dirs removed:** `src/game`, `src/game/persistence`, `src/dev`, `src/components`, `src/layout`, `src/ui/overlays`, `src/ui/reference/components`, `src/app`, `src/infra`, `src/infra/networking`.
- **Unused docs removed:** `docs/template_audit_2026`, `docs/template_rewrite`, `docs/ui_parity` (audit/legacy only).
- **Unused data removed:** `src/assets/fixtures` (reference_p0/p1 JSON not referenced in code).

---

## 4. Final tree (relevant)

```
src/
  main.ts                 # single entry
  bootstrap/bootstrap.ts  # wires GameOptions, calls Game.start(); no custom scenes
  brand/BrandConfig.ts    # bootConfig, backgroundConfig, frameConfig, dimensions
  brand/SpinFeel.ts       # spinFeelConfig
  config/slotConfig.ts    # SlotConfig (symbols[].spriteKey = game scene assets)
  config/index.ts         # re-exports
  ui/GameUI.ts            # ISlotUI + IWinFormatter
  ui/reference/AssetMap.ts # UI_ASSETS for bootConfig + frameConfig
  Asset.d.ts              # generated
  index.html
```

**Loading and start screens:** Engine built-in (`LoadingScene`, `StartScene`) driven by `bootConfig`. **Game scene:** Engine `SlotGameScene`; assets come from `slotConfig.symbols[].spriteKey` (main bundle) and `frameConfig.imageKey` (main bundle).

---

## 5. Verdict

- **Correctness:** The template matches the engine’s public contract: single `Game` entry, required options, validated configs, correct scene interfaces and factories, and no custom backend/outcome logic.
- **SDK-only:** Template only provides config, branding, and optional custom loading/start scenes; the engine owns spin flow, outcomes, and adapters.
- **Clean structure:** Unused folders and legacy docs have been removed; remaining layout is intent-based (bootstrap, brand, config, scenes, ui) and suitable for a company-grade SDK-only starter.

**Recommendation:** Use as-is for new branded slot integrations. Edit `slotConfig`, `SpinFeel`, and `BrandConfig` only. Ensure all asset keys used in `slotConfig.symbols[].spriteKey`, `bootConfig` (logo, etc.), and `frameConfig.imageKey` exist in the manifest; run `pnpm assets:build` and `pnpm assets:check`.
