# P3: Motion Ownership Invariants

This document proves whether movement artifacts (jank, stutter) come from multiple systems fighting for control over coordinates.

## 1. Visual Mappings & Mutators
The core engine relies on a strict split between logical scroll (`yOffset`) and animation juice (`visualOffset`). 
The final symbol position is derived in `ReelSymbolStrip:updatePositions` (line 357) as:
`y = -bufferRows * slotHeight + yOffset + visualOffset`

Here are all the systems that mutate these values:

### A) Continuous Scroll Loop
- **File:** `src/view/reels/ReelSymbolStrip.ts:130` (`scroll()`)
- **Mutates:** `yOffset` (`this.yOffset += deltaY`)
- **When:** Driven by `ReelMechanicClassic.update()` only when state is `SPINNING`.

### B) Deceleration Tween
- **File:** `src/view/reels/ReelMechanicClassic.ts:267-268` (`animateStop()`)
- **Mutates:** `visualOffsetY` via `strip.setVisualOffset()`
- **When:** Driven by TimelinePlanner during `STOPPING`. Tweens `visualOffsetY` from `-0.8 * slotHeight` towards `overshootTarget`.

### C) Bounce Tween
- **File:** `src/view/reels/ReelMechanicClassic.ts:311-312` (`enqueueBounceAnimation()`)
- **Mutates:** `visualOffsetY` via `strip.setVisualOffset()`
- **When:** Driven by TimelinePlanner during `BOUNCING`. Tweens `visualOffsetY` from `overshootTarget` to `0`.

### D) Snap-to-Grid
- **File:** `src/view/reels/ReelSymbolStrip.ts:164-173` (`snapToGrid()`)
- **Mutates:** `yOffset` (snaps to `0` or forces `scroll()`) AND `visualOffset` (forced to `0`).
- **When:** Driven by TimelinePlanner during `SNAPPING` after decel/bounce completes.

### E) setVisibleSymbols (Apply Final State)
- **File:** `src/view/reels/ReelSymbolStrip.ts:120, 363`
- **Mutates:** `yOffset` (forced to `0`) and Symbol local `y` (`symbol.setPosition(0, y)`).
- **When:** Called by `beginStop()` (before decel) and turbo-mode skips.

## 2. Invariant Analysis

**The Intended Invariant:**
1. **During Spin:** ONLY the scroll loop writes `yOffset`. `visualOffset` must be `0`.
2. **During Stop:** ONLY the stop pipeline/timeline writes `visualOffset`. Scroll loop must be frozen. `yOffset` is locked to `0`.

**Proof of Adherence:**
- In `src/view/reels/ReelMechanicClassic.ts:164`, the `update(deltaMs)` loop begins with:
  `if (this.state !== ReelState.SPINNING) return;`
- This guarantees that as soon as `beginStop()` shifts the state to `STOPPING`, the scroll loop is entirely bypassed.
- `setVisibleSymbols` resets `yOffset` to 0, ensuring no leftover fractional scroll contaminates the tween.

**Verdict:** NO DIRECT VIOLATION FOUND in the classic mechanic code.
The separation of concerns between `yOffset` (logic) and `visualOffset` (presentation) safely prevents two systems modifying the exact same variable on the exact same frame.
*(Note: we will test for Timeline double-apply mutations in P6).*
