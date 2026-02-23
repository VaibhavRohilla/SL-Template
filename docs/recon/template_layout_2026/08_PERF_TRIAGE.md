# 08 — Performance Triage

> **Goal:** Identify WHY the game feels laggy, with file:line evidence. No optimization yet.

---

## Suspect 1: DOUBLE TweenService.update() per frame — **HIGH confidence**

### Evidence

**`App.ts:639-646`** (Game update loop):
```typescript
private update = (ticker: Ticker): void => {
  this.sceneManager?.update(ticker.deltaMS);  // → SlotScene.update()

  // Update tweens
  if (this.container) {
    const services = getTypedServices(this.container);
    services.tweenService.update(ticker.deltaMS);  // ← UPDATE #2
  }
};
```

**`SlotScene.ts:475-490`** (Scene update, called via sceneManager.update):
```typescript
update(deltaMs: number): void {
  this.spinFlow.update(deltaMs);
  this.backgroundView?.updateParallax(deltaMs);
  this.reelsView?.update(deltaMs);
  this.tweenService.update(deltaMs);     // ← UPDATE #1
  this._timelinePlanner?.update(deltaMs);
}
```

The TweenService is the **same singleton** (from DI container). It is updated twice per frame:
1. Once inside `SlotScene.update()` at `SlotScene.ts:486`
2. Once inside `App.update()` at `App.ts:645`

### Impact

- All active tweens advance by **2× deltaMs per frame** instead of 1×
- Animations complete in half the expected time
- Stop deceleration, bounce, snap — all happen at 2× speed
- This creates a "jerky" or "too fast" appearance which can be perceived as laggy

### Additional concern at `App.ts:644`

```typescript
const services = getTypedServices(this.container);
```

`getTypedServices()` is called **every frame**. Depending on implementation, this may involve hash lookups or property access on the DI container. While likely cheap, it's unnecessary work in a hot path.

---

## Suspect 2: High-resolution rendering on HiDPI — **MEDIUM confidence**

### Evidence

**`App.ts:264-266`:**
```typescript
resolution: window.devicePixelRatio || 1,
autoDensity: true,
antialias: true,
```

On a 2× HiDPI display:
- Design dimensions: 1920 × 1080
- Backing buffer: **3840 × 2160** (4× pixels)
- With `antialias: true`: additional GPU cost for multisampling

On a 3× display (e.g., high-end mobile):
- Backing buffer: **5760 × 3240** (9× pixels)

### Impact

- GPU fill rate scales quadratically with resolution
- Combined with `antialias: true`, the renderer must resolve MSAA samples
- This is the #1 cause of GPU-bound frame drops on mobile/tablet devices
- On desktop with discrete GPU, likely not an issue

---

## Suspect 3: Background parallax update every frame — **LOW confidence**

### Evidence

**`SlotScene.ts:479-480`:**
```typescript
this.backgroundView?.updateParallax(deltaMs);
```

**`BackgroundView.ts:84-112`** — `updateParallax()`:
- Only runs if `parallax.enabled` is true
- Moves background sprite position each frame
- Very lightweight: two position calculations and one `position.set()`

### Impact

Minimal. The parallax update is trivial unless `parallax.enabled` is true (it's not in current config — `BrandConfig.ts` doesn't set parallax). This is a no-op in the current template.

---

## Suspect 4: Per-frame symbol position updates during spin — **LOW-MEDIUM confidence**

### Evidence

During spin, every frame:

1. **`ReelsView.update()`** — `ReelsView.ts:207-211`:
   - Iterates all 5 reels, calls `reel.update(deltaMs)`

2. **`ReelMechanicClassic.update()`** — `ReelMechanicClassic.ts:160-178`:
   - Calculates scroll distance
   - Calls `strip.scroll(distance)`

3. **`ReelSymbolStrip.scroll()`** — `ReelSymbolStrip.ts:129-151`:
   - Accumulates offset
   - Recycles symbols when crossing threshold
   - Calls `updatePositions()` every frame

4. **`ReelSymbolStrip.updatePositions()`** — updates Y position of every displayed symbol:
   - 8 symbols per reel × 5 reels = 40 `setPosition()` calls per frame

### Impact

40 position updates per frame is lightweight for Pixi.js. This is not likely the performance bottleneck unless the symbol display objects are heavyweight (e.g., Spine animations with many bones).

---

## Suspect 5: Symbol pool acquire/release during scroll — **LOW confidence**

### Evidence

**`ReelSymbolStrip.ts:324-354`** — `recycleTopSymbol()` / `recycleBottomSymbol()`:
- During spin, symbols are released back to pool and new ones acquired as they scroll past
- Each recycle: one `pool.release()` + one `pool.acquire()` + one `attachTo()` + one `detach()`
- Happens approximately `spinSpeed / slotHeight` times per second per reel = `2200 / 260 ≈ 8.5` times/sec/reel

### Impact

~42 pool operations per second across all reels during spin. This is lightweight. Pool operations are O(1) array push/pop.

---

## Suspect 6: No per-frame Graphics redraw in production path — **NOT a concern**

Searched for `Graphics.clear()` patterns called per frame:

- `ReelView.ts:258-260` — mask clear+redraw only happens in `updateVisibleRows()`, which is called for Megaways layout changes (not per frame)
- `BackgroundView.ts:124-133` — Graphics recreated only in `resize()`, not per frame
- `LineWinVisualizer.ts:81,99` — Graphics cleared only when win lines change, not per frame

**No per-frame Graphics redraw found.** This is not a concern.

---

## Suspect 7: `getBounds()` calls — **LOW confidence**

Found in:
- `IEffect.ts:449,493` — overlay sizing (called when effects are shown, not per frame)
- `HybridSymbolDisplay.ts:284` — Spine symbol bounds (called during setup, not per frame)
- `SpineSymbolDisplay.ts:212` — Spine symbol bounds (called during setup)

**None are per-frame.** Not a concern.

---

## Suspect 8: Filters — **NOT a concern**

Searched for `.filters =`, `addFilter`, `dropShadow`, `blur`, `glow`:

- Found in config files and theme definitions, but no active per-frame filter application
- `SpriteSymbolDisplay.ts` — filter setup for win highlights (one-time, not per-frame)
- No glow/blur filters applied to containers during spin

---

## DEV Debug Safety Check

**`reelDebug.ts:10`:**
```typescript
export const DEV_REEL_DEBUG = false;
```

DEV debug is OFF. No debug logging overhead in production path.

---

## Top 5 Suspects Ranked

| Rank | Suspect | Confidence | File:Line | Impact |
|------|---------|------------|-----------|--------|
| **1** | **Double TweenService.update()** | HIGH | `App.ts:645` + `SlotScene.ts:486` | Animations run at 2× speed, jerky feel |
| **2** | **HiDPI resolution × antialias** | MEDIUM | `App.ts:264-266` | GPU-bound frame drops on mobile |
| **3** | **getTypedServices() every frame** | LOW-MEDIUM | `App.ts:644` | Unnecessary DI lookup per frame |
| **4** | **40 symbol position updates/frame** | LOW | `ReelSymbolStrip updatePositions` | Acceptable for Pixi.js |
| **5** | **Symbol pool churn during spin** | LOW | `ReelSymbolStrip recycle*` | ~42 ops/sec, O(1) each |

### Assessment

The **dominant performance issue** is the double tween update (#1). This directly affects animation quality — all tween-based animations (stop deceleration, bounce, snap, win highlights) advance at 2× speed, making them feel "too fast" or "choppy." Users perceive fast, jerky animations as "laggy" even though frame rate may be fine.

HiDPI rendering (#2) is a secondary concern primarily for mobile devices.
