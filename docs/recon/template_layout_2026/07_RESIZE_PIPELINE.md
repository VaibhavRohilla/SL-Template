# 07 — Resize Pipeline

> **Goal:** Determine if resize causes reels to scale but frame not to scale (or vice versa), and whether layout is recomputed on resize.

---

## A. Resize Handler: App.ts

### setupResizeHandler() — `App.ts:580-604`

Two listeners:
1. `window.addEventListener('resize', this.resizeHandler)` — immediate
2. `window.addEventListener('orientationchange', this.orientationHandler)` — debounced (100ms via ticker)

### handleResize() — `App.ts:609-634`

```typescript
private handleResize(): void {
  if (!this.app) return;

  const parent = this.app.canvas.parentElement ?? document.body;
  const parentWidth = parent.clientWidth || window.innerWidth;
  const parentHeight = parent.clientHeight || window.innerHeight;

  const designAspect = this.designWidth / this.designHeight;  // 1920/1080 = 1.778
  const screenAspect = parentWidth / parentHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (screenAspect >= designAspect) {
    // Landscape wider than design → fit height
    scale = parentHeight / this.designHeight;
    offsetX = (parentWidth - this.designWidth * scale) / 2;
  } else {
    // Portrait or narrower → fit width
    scale = parentWidth / this.designWidth;
    offsetY = (parentHeight - this.designHeight * scale) / 2;
  }

  this.app.renderer.resize(parentWidth, parentHeight);
  this.app.stage.scale.set(scale);           // ← UNIFORM SCALE on entire stage
  this.app.stage.position.set(offsetX, offsetY);  // ← CENTERING offset
}
```

**Behavior:**
- Renderer canvas is resized to fill the parent element
- The **entire stage** is uniformly scaled to maintain the 1920×1080 design aspect ratio
- Stage is repositioned to center within the available space
- **No layout recomputation** — `symbolWidth`, `symbolHeight`, `reelGap`, etc. are NOT recalculated
- **No per-component resize calls** — neither `slotFrameView.resize()` nor `backgroundView.resize()` are called

---

## B. What Gets Scaled

Since `this.app.stage.scale.set(scale)` applies to the entire stage, ALL children scale uniformly:

```
Stage (scale=S, position=(offsetX, offsetY))
  └── SceneManager.currentScene.container
        └── SlotScene.container
              ├── BackgroundView.container  ← scaled by S
              ├── GameLayer                 ← scaled by S
              │     ├── SlotFrameView       ← scaled by S
              │     └── ReelsView           ← scaled by S
              ├── OverlayLayer              ← scaled by S
              └── UILayer                   ← scaled by S
```

**Frame and reels BOTH scale uniformly.** There is no differential scaling.

---

## C. Does Resize Cause "Out of Frame"?

### Short answer: NO — resize is not the cause.

Since uniform stage scaling is applied, the spatial relationship between frame and reels is preserved at all sizes. If they're misaligned at design resolution (1920×1080), they'll be misaligned at every resolution.

The "out of frame" issue is established at **initialization time**, not at resize time.

---

## D. BackgroundView.resize() — Never Called from Scene

`BackgroundView` has a `resize()` method (`BackgroundView.ts:117-144`) that recreates graphics or rescales images. But:

- `SlotScene` never calls `backgroundView.resize()`
- `App.handleResize()` doesn't call it either
- Background relies entirely on stage-level scaling

Since the background is initialized at viewport dimensions (1920×1080) and scaled with the stage, this works correctly.

---

## E. SlotFrameView.resize() — Never Called

`SlotFrameView` has both:
- `resize(newWidth, newHeight)` — `SlotFrameView.ts:78-85`
- `updateReelsArea(reelsArea)` — `SlotFrameView.ts:90-95`

**Neither is ever called.** No code in `SlotScene`, `SlotGameScene`, or `App` invokes them.

This is fine for the current architecture (uniform stage scaling), but means the frame CANNOT adapt to layout changes at runtime (e.g., Megaways reel height changes). The frame stays fixed at its initialization-time size/position.

---

## F. Renderer Resolution

`App.ts:264`:
```typescript
resolution: window.devicePixelRatio || 1,
autoDensity: true,
```

Combined with `autoDensity: true`, Pixi automatically adjusts the canvas backing store for HiDPI displays. This is correct and doesn't cause layout issues.

However, on HiDPI displays (e.g., `devicePixelRatio: 2`), the renderer creates a **3840×2160 backing buffer** for a 1920×1080 design. Combined with `antialias: true` (line 266), this is a significant GPU workload. See `08_PERF_TRIAGE.md`.

---

## G. Orientation Change Debounce

The orientation change handler uses a ticker-based debounce (`App.ts:584-601`):
```typescript
debounceElapsedMs += ticker.deltaMS;
if (debounceElapsedMs >= 100) {
  this.handleResize();
}
```

This is deterministic (uses ticker delta, not setTimeout) and only fires once after 100ms. **No performance concern here.**

---

## H. Summary

| Question | Answer | Evidence |
|----------|--------|----------|
| Are reels scaled via stage scale? | **Yes** | `App.ts:632` |
| Is frame scaled independently? | **No** — same stage scale | Same parent container |
| Is layout recomputed on resize? | **No** — only stage scale changes | No recalculation code exists |
| Does any code reposition UI after resize? | **No** | No per-component resize calls |
| Is `slotFrameView.resize()` called? | **Never** | Grep confirms zero calls |
| Is `backgroundView.resize()` called? | **Never** from scene code | Grep confirms zero calls |
| Could resize cause differential frame/reel scaling? | **No** | Uniform stage scale |

**Resize is NOT the root cause of "out of frame."** The issue is in the initial layout math and frame sizing at construction time.
