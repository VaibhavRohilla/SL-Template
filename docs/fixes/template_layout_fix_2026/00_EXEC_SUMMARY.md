# 00 — Executive Summary: Template Layout Fix 2026

**Date:** 2026-02-23
**Scope:** SL-Engine 1.5.2 + SL-Template 1.0.0

---

## What Was Fixed

### Issue 1 — Double TweenService.update() per frame [P0]
`TweenService.update(deltaMs)` was called twice per animation frame: once in
`SlotScene.update()` and again in `App.update()`. Both calls operated on the
same DI singleton, advancing all tweens by 2× the real delta per frame.

**Effect:** Animations (stop deceleration, bounce, snap, win highlights) ran at
double speed, creating a jerky, "too-fast" feel perceived as lag.

**Fix:** `SlotScene.update()` retains the `tweenService.update()` call (for
gameplay + test-harness compatibility). `App.update()` now conditionally calls
`tweenService.update()` only when no scene is `ACTIVE` — i.e. during scene
transitions, loading, and start screens. This eliminates the double-call during
gameplay while keeping transitions alive.

### Issue 2 — Frame scales to viewport instead of reel area [P0]
`SlotFrameView.applyScaleAndPosition()` always scaled the frame texture against
the full viewport (1920×1080), but the reel area is 1400×1040. When the frame
asset's transparent window was designed for the reel area, the mismatch caused
the "out-of-frame" appearance. Changing `reelGap` moved reel positions but the
frame stayed viewport-sized, making the gap change appear to have no effect.

**Fix:** Added `frameConfig.fitTarget` (`'viewport'` | `'reels'`). Default is
`'viewport'` to preserve existing behavior. When set to `'reels'`, the frame
scales against the computed reel area plus optional `reelsPaddingPx`.

### Issue 3 — Fallback frame width formula off by one gap [P1]
When no custom frame was configured, the fallback decorative frame used
`reelCount * (symbolWidth + reelGap)` — adding one extra `reelGap`. Correct
formula is `reelCount * symbolWidth + (reelCount - 1) * reelGap`.

**Fix:** Replaced the inline formula with a call to `calculateReelsWidth()`.

### Issue 4 — Config ambiguity: BrandConfig vs SpinFeel dimensions [P1]
`BrandConfig.dimensions.symbolHeight` (200) and `SpinFeel.symbolHeightPx` (140)
are consumed by different subsystems (layout vs scroll math) with no
documentation or guardrail explaining why they differ.

**Fix:** Added clarifying comments in `SpinFeel.ts`. Added a DEV-only warning
in `SlotScene` constructor that fires when the values differ significantly.

---

## Why It Was Broken (Recon Facts)

| Root Cause | Evidence | Recon Doc |
|---|---|---|
| Double tween update | `App.ts:645` + `SlotScene.ts:486` both call `tweenService.update(deltaMs)` on same singleton | 08_PERF_TRIAGE §1 |
| Frame scales to viewport | `SlotFrameView.ts:123-124` uses `viewportWidth/Height`, ignores `reelsArea` for scaling | 05_FRAME_AND_UI_BOUNDS §C |
| Fallback width bug | `SlotScene.ts:522` used `n*(w+gap)` instead of `n*w+(n-1)*gap` | 05_FRAME_AND_UI_BOUNDS §F |
| Config confusion | `symbolHeight=200` (layout) vs `symbolHeightPx=140` (scroll) — independent, undocumented | 01_CONFIG_SURFACE_MAP §C |

---

## Config Knobs Added & Defaults

| Knob | Location | Type | Default | Purpose |
|---|---|---|---|---|
| `frameConfig.fitTarget` | Engine `ViewLayerConfig` | `'viewport' \| 'reels'` | `'viewport'` | What rectangle the frame scales against |
| `frameConfig.reelsPaddingPx` | Engine `ViewLayerConfig` | `number` | `0` | Extra padding around reel area when `fitTarget='reels'` |
| `GameOptions.maxDpr` | Engine `App.ts` | `number` | no cap | Cap devicePixelRatio for GPU savings on HiDPI |
| `GameOptions.antialias` | Engine `App.ts` | `boolean` | `true` | Toggle canvas antialiasing |

All defaults preserve existing behavior — no breaking changes.
