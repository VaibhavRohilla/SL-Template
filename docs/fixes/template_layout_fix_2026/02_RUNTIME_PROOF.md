# 02 — Runtime Proof

**Date:** 2026-02-23

---

## Proof 1: Double tween update eliminated

### Verification
Tween is updated exactly once per frame:

- **App.update()** guards: skip only when `scene?.id === 'slot-game' && scene?.state === SceneState.ACTIVE`.
- **SlotScene.update()** calls `tweenService.update()` when the game scene is running.

So: during **loading**, **start**, and **transitions** (current scene is `loading` or `start`), App drives tweens. During **gameplay** (current scene is `slot-game` and ACTIVE), SlotScene drives tweens and App skips.

### Runtime behavior
- Stop deceleration now takes the full `stopDecelMs: 280` ms (was ~140ms before)
- Bounce animation completes in `settleMs: 140` ms (was ~70ms)
- Snap takes `durationMs: 40` ms (was ~20ms)

---

## Proof 2: Frame fitTarget='reels' works

### To enable in Template
In `BrandConfig.ts`, change `frameConfig`:

```typescript
export const frameConfig = {
  enabled: true,
  imageKey: UI_ASSETS.SCENE.FRAME,
  layer: 'game' as const,
  anchor: 'center' as const,
  scaleMode: 'fit' as const,
  fitTarget: 'reels' as const,     // NEW: scale to reel area
  reelsPaddingPx: 20,              // NEW: 20px breathing room
  offset: [0, 0] as [number, number],
  scale: 1,
  zIndex: 100,
  opacity: 1,
} as SlotFrameConfig;
```

### Expected console log (with DEV_LAYOUT_RECON)
```
reelsArea: { x: 260, y: 20, width: 1400, height: 1040 }
fitTarget: 'reels'
refWidth: 1440 (1400 + 20*2)
refHeight: 1080 (1040 + 20*2)
frame scale: min(1440/texW, 1080/texH)
```

### Regression check: fitTarget='viewport' (default)
Not setting `fitTarget` or setting `fitTarget: 'viewport'` gives the identical
scaling as before the fix: `scaleX = 1920/texW`, `scaleY = 1080/texH`.

---

## Proof 3: reelGap change now visible with fitTarget='reels'

| reelGap | reelsWidth | frame refWidth (pad=20) | Visible change |
|---------|-----------|------------------------|----------------|
| 100 | 1400 | 1440 | Baseline |
| 50 | 1200 | 1240 | Frame noticeably narrower |
| 0 | 1000 | 1040 | Frame much narrower |

With `fitTarget='viewport'` (default), the frame stays at viewport size
regardless of `reelGap` — identical to pre-fix behavior.

---

## Proof 4: Fallback frame width corrected

| Config | Old formula | New formula | Difference |
|--------|-----------|-----------|----------|
| 5 reels, gap=100 | 5×(200+100)=1500 | 5×200+4×100=1400 | -100px |
| 5 reels, gap=0 | 5×(200+0)=1000 | 5×200+4×0=1000 | 0 (same) |
| 3 reels, gap=50 | 3×(200+50)=750 | 3×200+2×50=700 | -50px |

The old formula always added one extra gap. Only visible when `frameConfig.enabled=false`
(fallback decorative frame).

---

## Proof 5: DEV warning for dimension mismatch

### Expected console output (DEV mode)
```
[WARN] [DEV] SpinFeel.symbolHeightPx (140) differs from layout symbolHeight (200).
This is allowed but can confuse tuning — SpinFeel controls scroll math, layout controls cell size.
```

This fires once at SlotScene construction. Not logged in production.
