# Spin Feel: Symbols Vanishing & Stop Not Smooth

## Summary

Two issues were fixed:

1. **Symbols vanishing during/after spin** – Root cause: pooled symbols were reused without reapplying their texture.
2. **Stopping not smooth** – Spin feel was tuned with explicit deceleration, easing, and timing.
3. **Symbols vanishing after stop** – Root cause: symbols were released at spin complete, clearing the reels; release now happens only when symbols are replaced (see §3 below).

---

## 1. Symbols vanishing – root cause and fix

### Cause

When a symbol is **released** back to the pool, `SymbolPool.release()` calls `symbol.reset()`.  
In `SpriteSymbolDisplay.reset()` the texture is set to `Texture.EMPTY` so the sprite is cleared for reuse.

When that same instance is **acquired** again from the pool (reuse path), the code did **not** set the texture again. Only newly created symbols got their texture via `SymbolFactory.create(symbolId)`. So:

- **During spin:** Scrolling symbols are recycled (release top, acquire new at bottom). Reused symbols had `Texture.EMPTY` → **invisible**.
- **At stop:** `setVisibleSymbols(finalSymbols)` releases all and acquires new; many are reused → again **invisible**.

So symbols appeared to “vanish” whenever the pool reused an instance that had been reset.

### Fix (SL-Engine)

- **SymbolFactory**
  - Added `applyDisplay(display, symbolId)` to (re)apply the symbol definition (texture) to any display instance.
- **SymbolPool.acquire(symbolId)**
  - After getting a symbol (from pool or newly created), always call `this.factory.applyDisplay(symbol, symbolId)` so:
    - Reused symbols get the correct texture again.
    - New symbols stay as they are (same definition applied).

Files:

- `src/view/symbols/SymbolFactory.ts` – `applyDisplay()`
- `src/view/symbols/SymbolPool.ts` – call `applyDisplay()` in `acquire()`

---

## 2. Stopping not smooth – configuration

### Cause

Stop feel is driven by **SpinFeelConfig**: deceleration duration, easing, bounce, and snap. The template only overrode some fields (e.g. `stopDelayMs`, `bounce`) and relied on the rest from the premium preset. That left:

- No explicit **stopDecelMs** / **stopEase** in the template, so behaviour was less predictable and harder to tune.
- Spin speed and min spin time not clearly set for “readable symbols + smooth stop”.

### Fix (SL-Template)

In **`src/brand/SpinFeel.ts`** the template’s spin feel is now explicitly tuned:

- **spinSpeedPxPerSec**: 2200 (readable symbols while spinning).
- **stopDelayMs**: [0, 120, 240, 360, 480] – staggered reel stops.
- **minSpinMs** / **maxSpinMs**: 600 / 10000 so reels don’t stop too early.
- **stopDecelMs**: 280 – duration of the slide-in deceleration.
- **stopEase**: `'cubicOut'` – smooth deceleration at the end.
- **bounce**: enabled, amplitude 10px, settle 140ms, **bounceEase**: `'backOut'`.
- **snap**: threshold 4px, duration 40ms for a clean final snap.

You can adjust these values to match your desired “weight” and smoothness (e.g. increase `stopDecelMs` for a slower, smoother stop).

---

## 3. Symbols vanishing after stop (reels go empty)

### Cause

`SlotScene.onSpinComplete()` was calling `this.reelsView.releaseAllSymbols()` as soon as the spin finished. That cleared the reels so the result disappeared right after the stop. If completion ran more than once you could see "strips stopping again" and "vanishing again".

### Fix (SL-Engine)

Do not release symbols when the spin completes. Reels keep showing the result until the next spin. Symbols are released only when replaced: when a reel stops, `setVisibleSymbols(finalSymbols)` releases current and acquires final; during the next spin, recycling releases symbols that scroll off. Removed `reelsView.releaseAllSymbols()` from `SlotScene.onSpinComplete()`; updated comment in `ReelsView.startAllSpinning()`.

---

## 4. Optional: further tuning

- **Softer stop:** Increase `stopDecelMs` (e.g. 320–400) and/or use `'quadOut'` or `'expoOut'`.
- **Faster stop:** Decrease `stopDecelMs` and/or use `'quadOut'`.
- **More bounce:** Increase `bounce.amplitudePx` and/or `bounce.settleMs`.
- **Symbol visibility during spin:** Slightly lower `spinSpeedPxPerSec` if symbols still feel too blurry.

All of these are in **`src/brand/SpinFeel.ts`** (and the engine’s `SpinFeelConfig` type).
