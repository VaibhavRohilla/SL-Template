# Template Layout Recon — February 2026

## Executive Summary

Layout values flow correctly from Template config (`BrandConfig.dimensions`) through the entire pipeline to Engine views — **no values are dropped or overridden**. The three reported issues have distinct root causes:

1. **"Out of frame"**: The frame sprite scales to the viewport (1920×1080) via `scaleMode: 'fit'`, but the reel area is only 1400×1040. The frame's transparent window doesn't match the computed reel area. Fix requires Engine changes to `SlotFrameView` (scale to reel area, not viewport).
2. **"reelGap not adjustable"**: `reelGap` IS applied to reel positions, but the frame doesn't adapt when the reel area changes size, making the change appear invisible. Same root cause as #1.
3. **"Laggy"**: `TweenService.update()` is called **twice per frame** (once in `App.ts:645`, once in `SlotScene.ts:486`), causing all animations to run at 2× speed and feel jerky.

A secondary concern is that `SpinFeel.symbolHeightPx` (140) and `BrandConfig.symbolHeight` (200) are different values consumed by different subsystems, creating confusion about "the" source of truth.

---

## Document Index

| # | Document | Phase | Content |
|---|----------|-------|---------|
| **01** | [01_CONFIG_SURFACE_MAP.md](./01_CONFIG_SURFACE_MAP.md) | 0 | All Template config fields, locations, defaults, consumers, ownership. Config duplication analysis (BrandConfig vs SpinFeel). |
| **02** | [02_BOOTSTRAP_PIPELINE_TRACE.md](./02_BOOTSTRAP_PIPELINE_TRACE.md) | 1 | Complete trace from `BrandConfig.dimensions` → `GameOptions.layout` → `getSceneLayout()` → `SceneContext` → `SlotGameScene` → `SlotScene` → `ReelsView` → `ReelView`. Every hop with file:line. |
| **03** | [03_SCENELAYOUT_FINAL_VALUES.md](./03_SCENELAYOUT_FINAL_VALUES.md) | 1 | Final runtime values at each pipeline stage. Computed reel area dimensions (1400×1040). Centering offsets (260, 20). Per-reel positions and mask sizes. SpinFeel scroll dimension mismatch. |
| **04** | [04_REEL_GEOMETRY_MATH.md](./04_REEL_GEOMETRY_MATH.md) | 2 | Exact formulas for `reelsTotalWidth`, `reelsTotalHeight`, per-reel masks, buffer rows, reel gap visual analysis. Formula comparison between `SlotScene` and `ReelsView`. |
| **05** | [05_FRAME_AND_UI_BOUNDS.md](./05_FRAME_AND_UI_BOUNDS.md) | 3 | Frame parenting (same coordinate space as reels). Frame scaling logic (scales to viewport, positions at reel center). Why `reelsArea` is used for positioning but NOT for scaling. Fallback frame width bug. |
| **06** | [06_OVERRIDE_POINTS.md](./06_OVERRIDE_POINTS.md) | 4 | Full search for every `reelGap`, `symbolWidth`, `symbolHeight`, `symbolGap` reference. Classification table (definition/mapping/override/derived). Proof that no values are dropped. Root cause of perceived "not adjustable." |
| **07** | [07_RESIZE_PIPELINE.md](./07_RESIZE_PIPELINE.md) | 5 | Resize handler analysis. Uniform stage scaling (no differential frame/reel scaling). No per-component resize calls. Resize is NOT the root cause. HiDPI resolution concerns. |
| **08** | [08_PERF_TRIAGE.md](./08_PERF_TRIAGE.md) | 6 | Top 5 perf suspects ranked. #1: Double `TweenService.update()` per frame. #2: HiDPI + antialias GPU cost. DEV debug safety confirmed off. |
| **09** | [09_ROOT_CAUSE_RANKING.md](./09_ROOT_CAUSE_RANKING.md) | 7 | Per-issue ranked causes with evidence. Fix direction for each (Template vs Engine). Summary matrix with severity. |

---

## Key Files Referenced

### Template (SL-Template)
- `src/brand/BrandConfig.ts` — dimensions, frame config, background config
- `src/brand/SpinFeel.ts` — scroll animation dimensions (symbolHeightPx, symbolGapPx)
- `src/config/slotConfig.ts` — reelCount, rowsPerReel, symbols
- `src/bootstrap/bootstrap.ts` — GameOptions assembly

### Engine (SL-Engine)
- `src/app/App.ts` — Game class, getSceneLayout(), resize handler, update loop
- `src/view/scene/SlotScene.ts` — Scene construction, createReels(), calculateReelsWidth/Height()
- `src/view/scene/SlotGameScene.ts` — Scene factory (fromContext)
- `src/view/scene/IScene.ts` — SceneContext interface (sceneLayout)
- `src/view/reels/ReelsView.ts` — Reel view management, totalWidth/Height
- `src/view/reels/ReelView.ts` — Per-reel mask, positioning
- `src/view/reels/ReelSymbolStrip.ts` — Symbol strip, slotHeight, scroll
- `src/view/reels/ReelMechanicClassic.ts` — Spin update, stop mechanics
- `src/view/layers/SlotFrameView.ts` — Frame scaling and positioning
- `src/view/layers/BackgroundView.ts` — Background layer
- `src/view/reels/reelDebug.ts` — DEV_REEL_DEBUG flag (currently false)
