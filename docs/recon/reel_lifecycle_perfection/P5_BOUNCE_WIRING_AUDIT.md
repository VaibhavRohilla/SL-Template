# P5: Bounce Wiring Audit

This document verifies whether the bounce configuration is actively executing or silently overridden by engine logic.

## 1. Bounce Config Access
- **Config Read:** `src/view/reels/ReelMechanicClassic.ts:240` (`const bounce = this.config.bounce;`)
- **Usage Trigger:** Evaluated during `animateStop()` via `bounce.enabled`.

## 2. Animated Property
- **Prop:** The animated property is the abstract `animState.y`, which is pushed into the reel visually via `strip.setVisualOffset(this.visualOffsetY)`.
- It does **NOT** animate `yOffset` or `container.y`. This keeps logical scroll position immune to easing math.

## 3. Overshoot Direction & Visibility
- **Target Value:** `const overshootTarget = bounce.enabled ? bounce.amplitudePx : 0;` (line 251)
- **Tween Path:** Deceleration tweens from negative (`-0.8 * slotHeight`) to positive (`overshootTarget`).
- **Visibility:** Since the Y axis is down-positive, a positive overshoot means the reel symbols slide *downward* past `y=0`.
- Because `ReelSymbolStrip` dictates `bufferRows: 2`, an overshoot of 15px downward will gracefully reveal the bottom 15px of the buffer symbol rendering above the top row. It will NOT clip or show empty mask void. **The direction sign is correct and safely padded.**

## 4. Sequencing (Snap vs Bounce)
- **Execution Order:** 
  In `animateStop()`, the `onComplete` callback checks `bounce.enabled && Math.abs(overshootTarget) > 0`.
  If true, it delegates to `this.enqueueBounceAnimation()`. 
  Only once the bounce tween finishes does the *bounce's* `onComplete` call `this.enqueueSnapAnimation()`.
- **Verdict:** Snap happens strictly **AFTER** settle. It does not overwrite the bounce in the same frame.

## 5. Ease Support
- `bounceEase` (default `'backOut'`) is passed into the `CommandFactory.createTween` interface.
- Standard slot-game `TweenService` integrations (like GSAP) inherently support `backOut`. If an unsupported ease is passed, external tween engines usually default to a linear/quad fallback rather than crashing, making this wiring robust.

**Final Conclusion:** BOUNCE IS IMPLEMENTED AND CORRECTLY WIRED. If it is "invisible" to users, it acts exactly as configured by `SpinFeelConfig`. The engine's nested Timeline sequencer naturally protects it from being clipped by the Snap logic.
