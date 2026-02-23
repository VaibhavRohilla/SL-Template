# 01 — Patch Notes

**Date:** 2026-02-23

---

## Patch A: Fix double TweenService.update() [P0]

**Files:**
- `SL-Engine/src/app/App.ts` — `update()` method (~line 643)
- `SL-Engine/src/view/scene/IScene.ts` — `SceneState` import added

**Before:** `App.update()` unconditionally called `tweenService.update(deltaMS)`
after `sceneManager.update(deltaMS)`. Since `sceneManager.update()` calls
`SlotScene.update()` which also calls `tweenService.update(deltaMs)`, tweens
advanced by 2× per frame during gameplay.

**After:** `App.update()` skips tween only when the **game** scene is active (that scene updates tweens itself). Loading and start scenes do not, so App must always drive tweens for them:

```typescript
const scene = this.sceneManager?.currentScene;
const isGameSceneActive = scene?.id === 'slot-game' && scene?.state === SceneState.ACTIVE;
if (!isGameSceneActive && this.container) {
  const services = getTypedServices(this.container);
  services.tweenService.update(ticker.deltaMS);
}
```

- **Loading / start / transition:** Current scene is `loading` or `start` (or none) → App calls `tweenService.update()` → fade transitions complete.
- **Gameplay (scene id `slot-game` and ACTIVE):** `SlotScene.update()` is the sole tween driver; App skips. No double-tick.
- **Test harness:** Tests call `slotScene.update()` directly — tweens work without an `App` wrapper.

`SlotScene.update()` retains `this.tweenService.update(deltaMs)` unchanged.

---

## Patch B: Add fitTarget frame scaling mode [P0]

### B1 — ViewLayerConfig.ts (Zod schema)
**File:** `SL-Engine/src/view/layers/ViewLayerConfig.ts`
**Lines:** after `scaleMode` field in `SlotFrameConfigSchema`

Added two new optional fields:
- `fitTarget: z.enum(['viewport', 'reels']).default('viewport')`
- `reelsPaddingPx: z.number().min(0).default(0)`

### B2 — SlotFrameView.ts (scaling logic)
**File:** `SL-Engine/src/view/layers/SlotFrameView.ts`
**Method:** `applyScaleAndPosition()`

When `fitTarget === 'reels'` and `reelsArea` is provided, the reference
rectangle for `'fit'` / `'fill'` scaling uses `reelsArea.width + 2*padding` ×
`reelsArea.height + 2*padding` instead of `viewportWidth` × `viewportHeight`.

Default `fitTarget='viewport'` preserves all existing behavior.

---

## Patch C: Fix fallback frame width formula [P1]

**File:** `SL-Engine/src/view/scene/SlotScene.ts`
**Method:** `createBackground()` (~line 522)

**Before:**
```typescript
const reelAreaWidth = this.slotConfig.layout.reelCount * (this.sceneConfig.symbolWidth + (this.sceneConfig.reelGap ?? 0));
const maxRows = Math.max(...this.slotConfig.layout.rowsPerReel);
const reelAreaHeight = maxRows * (this.sceneConfig.symbolHeight + (this.sceneConfig.symbolGap ?? 0));
```

**After:**
```typescript
const reelAreaWidth = this.calculateReelsWidth();
const reelAreaHeight = this.calculateReelsHeight();
```

`calculateReelsWidth()` uses the correct formula:
`reelCount * symbolWidth + (reelCount - 1) * reelGap`

Old inline formula added one extra `reelGap` (100 px wider than reels with 5
reels and gap=100).

---

## Patch D: Config ambiguity clarity [P1]

### D1 — SpinFeel.ts (Template)
**File:** `SL-Template/src/brand/SpinFeel.ts`
**Lines:** 20–22

Updated comment from `// Symbol dimensions (match layout)` to clarify these are
scroll-math units, intentionally independent of BrandConfig layout cell sizes.

### D2 — SlotScene.ts DEV warning (Engine)
**File:** `SL-Engine/src/view/scene/SlotScene.ts`
**Location:** Constructor, after leak detector init

Added DEV-only check: if `|layout.symbolHeight - spinFeel.symbolHeightPx| > 20`,
logs a warning explaining the dual-dimension design.

---

## Patch E: Perf configuration knobs [P1]

**File:** `SL-Engine/src/app/App.ts`

### E1 — GameOptions interface
Added optional fields:
- `maxDpr?: number` — caps `devicePixelRatio` for the Pixi renderer
- `antialias?: boolean` — makes canvas antialiasing configurable (default `true`)

### E2 — Pixi init
```typescript
resolution: Math.min(window.devicePixelRatio || 1, this.options.maxDpr ?? Infinity),
antialias: this.options.antialias ?? true,
```

Templates on low-end devices can now set `maxDpr: 2, antialias: false` without
engine changes.
