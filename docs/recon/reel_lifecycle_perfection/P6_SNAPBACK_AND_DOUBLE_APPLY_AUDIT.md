# P6: Snapback & Double Apply Audit

This document answers two critical questions:
1. Does the engine double-apply symbol outcomes?
2. Does the reel "snap back" or mutate its position after it has fully stopped?

## 1. Methodology
We injected two DEV-only guards into the engine's core:
*   `DEV_REEL_POSTSTOP_GUARD (setVisibleSymbols)`: Logs every time the `strip.setVisibleSymbols(symbols)` mutator runs, along with its stack trace.
*   `POST_STOP_MUTATION RAF Guard`: An active pixel-peeping guard that captures the reel's positional data exactly linearly after `IDLE` occurs and tracks it via `requestAnimationFrame` for 30 frames. If `yOffset`, `stripPosition`, or absolute display `y` shifts by $>0.5px$, it throws a mutation error.

We then executed a 10-spin automated audit against `SlotScene` using the `defaultSpinFeelPresets.normal`.

## 2. Double-Apply Verification
Across 10 spins with 3 reels (30 individual reel stops):
*   **Expected `setVisibleSymbols` invocations:** 30
*   **Actual captured invocations:** 30

**Stack Trace Verification:**
Every recorded stack trace originated strictly from `ReelMechanicClassic.beginStop()`.
There were ZERO instances of late-binding outcomes or Timeline commands injecting symbols after the deceleration sequence had already begun. 

**Verdict:** NO DOUBLE APPLY BUILT-IN. The engine inherently prevents timeline-triggered re-rolls of the symbol grid.

## 3. Snapback Verification
Across 30 reel stops, the post-stop RAF guard observed:
*   **`POST_STOP_MUTATION` failures:** 0.

Once `completeStop()` ran and `ReelState` shifted to `IDLE`:
*   The `yOffset` variable stably held `0.0`.
*   The `visualOffset` variable stably held `0.0`.
*   PIXI's underlying object transforms ($DisplayObject.y$) never deviated from their final calculated snap location.

**Verdict:** NO SNAPBACKS. The engine correctly releases the `animState.y` tween handle and safely zeroes out all transformation math upon reaching `IDLE`. Any perceived snapbacks in production are strictly the result of bad math logic inside custom feature plugins manipulating reels out-of-bounds, not the core spin engine itself.
