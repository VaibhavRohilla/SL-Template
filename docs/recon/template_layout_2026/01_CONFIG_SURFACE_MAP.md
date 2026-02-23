# 01 — Config Surface Map

> **Goal:** Identify every Template config field that SHOULD control layout, where it's defined, its default, where it's consumed, and who owns it.

---

## A. Layout Config Fields

| # | Field | File | Line(s) | Default Value | Consumed At (Engine) | Ownership |
|---|-------|------|---------|---------------|---------------------|-----------|
| 1 | `dimensions.width` | `SL-Template/src/brand/BrandConfig.ts` | 107 | `1920` | `App.ts:217` → `designWidth` | Template-only |
| 2 | `dimensions.height` | `SL-Template/src/brand/BrandConfig.ts` | 108 | `1080` | `App.ts:218` → `designHeight` | Template-only |
| 3 | `dimensions.symbolWidth` | `SL-Template/src/brand/BrandConfig.ts` | 109 | `200` | `App.ts:375` → `sceneLayout.symbolWidth` | **Shared** (Template defines, Engine consumes) |
| 4 | `dimensions.symbolHeight` | `SL-Template/src/brand/BrandConfig.ts` | 110 | `200` | `App.ts:376` → `sceneLayout.symbolHeight` | **Shared** |
| 5 | `dimensions.symbolGap` | `SL-Template/src/brand/BrandConfig.ts` | 111 | `60` | `App.ts:377` → `sceneLayout.symbolGap` | **Shared** |
| 6 | `dimensions.reelGap` | `SL-Template/src/brand/BrandConfig.ts` | 112 | `100` | `App.ts:378` → `sceneLayout.reelGap` | **Shared** |
| 7 | `slotConfig.layout.reelCount` | `SL-Template/src/config/slotConfig.ts` | 45 | `5` | `ReelsView.ts:590` (reel loop), `SlotScene.ts:1155` | Template-only |
| 8 | `slotConfig.layout.rowsPerReel` | `SL-Template/src/config/slotConfig.ts` | 46 | `[4,4,4,4,4]` | `ReelsView.ts:591`, `ReelView.ts:71` (mask), `SlotScene.ts:1162` | Template-only |
| 9 | `spinFeelConfig.symbolHeightPx` | `SL-Template/src/brand/SpinFeel.ts` | 21 | `140` | `ReelMechanicClassic.ts:78` via `config.spinSpeedPxPerSec`, `SpinFeelConfig.ts:294` | **SpinFeel-only** (scroll math) |
| 10 | `spinFeelConfig.symbolGapPx` | `SL-Template/src/brand/SpinFeel.ts` | 22 | `4` | `SpinFeelConfig.ts:294` (`getSpinCycleHeight`) | **SpinFeel-only** (scroll math) |

## B. Frame & Background Config Fields

| # | Field | File | Line(s) | Default Value | Consumed At | Ownership |
|---|-------|------|---------|---------------|-------------|-----------|
| 11 | `frameConfig.enabled` | `BrandConfig.ts` | 48 | `true` | `SlotScene.ts:382,395,520` | Template-only |
| 12 | `frameConfig.scaleMode` | `BrandConfig.ts` | 52 | `'fit'` | `SlotFrameView.ts:120-142` | Template-only |
| 13 | `frameConfig.anchor` | `BrandConfig.ts` | 51 | `'center'` | `SlotFrameView.ts:145,157` | Template-only |
| 14 | `frameConfig.offset` | `BrandConfig.ts` | 53 | `[0, 0]` | `SlotFrameView.ts:146,184` | Template-only |
| 15 | `frameConfig.scale` | `BrandConfig.ts` | 54 | `1` | `SlotFrameView.ts:139` (only when scaleMode='none') | Template-only |
| 16 | `frameConfig.layer` | `BrandConfig.ts` | 50 | `'game'` | `SlotScene.ts:382,395` | Template-only |
| 17 | `backgroundConfig.scaleMode` | `BrandConfig.ts` | 37 | `'cover'` | `BackgroundView.ts` | Template-only |

## C. Config Duplication Analysis

### CRITICAL DUPLICATION: `symbolHeight` / `symbolGap` exist in TWO places with DIFFERENT values

| Concept | BrandConfig `dimensions` | SpinFeel `spinFeelConfig` | Who wins? |
|---------|--------------------------|---------------------------|-----------|
| Symbol height | `symbolHeight: 200` (line 110) | `symbolHeightPx: 140` (line 21) | **BOTH are used independently** — layout uses 200, scroll animation uses 140 |
| Symbol gap | `symbolGap: 60` (line 111) | `symbolGapPx: 4` (line 22) | **BOTH are used independently** — layout uses 60, scroll animation uses 4 |

### What this means:

1. **Layout path** (`dimensions` → `gameOptions.layout` → `sceneLayout` → `SlotScene.sceneConfig` → `ReelsView.viewConfig`):
   - Uses `symbolHeight: 200`, `symbolGap: 60`
   - Controls: symbol factory cell size, mask height, reel positioning, frame positioning

2. **Scroll/animation path** (`spinFeelConfig` → `ReelMechanicClassic` → `ReelSymbolStrip`):
   - Uses `symbolHeightPx: 140`, `symbolGapPx: 4`
   - Controls: scroll speed (`slotHeight = 140 + 4 = 144px`), cycle height, stop planning

3. **No code enforces consistency.** The two values are consumed by different subsystems and never cross-checked.

### Other configs with NO duplication:

| Config | Source | Notes |
|--------|--------|-------|
| `SlotConfig` (`slotConfig.ts`) | Template only | `reelCount`, `rowsPerReel`, symbols, paytable |
| `BootConfig` (`BrandConfig.ts`) | Template only | Loading/start screen |
| `BackgroundConfig` (`BrandConfig.ts`) | Template only | Background layer |
| `FrameConfig` (`BrandConfig.ts`) | Template only | Frame overlay |

### Missing from Template config (no way to control):

- `visibleRows` — derived from `slotConfig.layout.rowsPerReel` (correct)
- `reelArea` padding/margins — not configurable
- Frame window dimensions — frame scales to viewport, not to reel area specifically
- Overall game scaling mode — hardcoded as aspect-ratio-fit in `App.ts:609-634`
