# P4: Stop Pipeline Breakdown

This document covers the exact configuration hooks and execution timeline for the Classic Reel Stop sequence.

## 1. Stop Plan Creation & Consumption
*   **Creation:** `src/view/reels/ReelMechanicClassic.ts:127` (`requestStop()`)
*   **Trigger:** When `spinFlow` instructs `onStopReel()`, the mechanic creates a `ReelStopPlan`.
*   **Distance calculation:** `src/view/reels/ReelStopPlanner.ts:101`. Generates exactly how many remaining slots must spin to sync up with the target symbols before reaching the deceleration threshold.
*   **Consumption Trigger:** `src/view/reels/ReelMechanicClassic.ts:197` checks every frame: `if (this.symbolsSpun >= this.stopPlan.spinDistance) { this.beginStop(); }`

## 2. Deceleration Phase (Start)
*   **Config Source:** `src/view/reels/ReelMechanicClassic.ts:253` reads `config.stopDecelMs` for duration, scaled by `this.timeScale` (turbo).
*   **Initial Final-Symbol Injection:** `src/view/reels/ReelMechanicClassic.ts:232` executes `this.strip.setVisibleSymbols(this.stopPlan.finalSymbols);`.
    *   *NOTE EXPLICIT TIMING:* The final result grid is spawned **exactly** when deceleration starts, while visually shifted offscreen.
*   **Execution:** A Timeline tween modifies `visualOffsetY` starting from `-slotHeight * 0.8`.

## 3. Bounce Configuration (If Enabled)
*   **Config Read:** `src/view/reels/ReelMechanicClassic.ts:240` reads `const bounce = config.bounce;`.
*   **Overshoot Target Calculation:** `src/view/reels/ReelMechanicClassic.ts:251` uses `bounce.enabled ? bounce.amplitudePx : 0`. 
    *   If enabled, the decel tween intentionally overshoots $y=0$ by `amplitudePx`.
*   **Settle Phase Read:** `src/view/reels/ReelMechanicClassic.ts:311` reads `bounce.settleMs` and `config.bounceEase`.

## 4. Snap-To-Grid Phase
*   **Trigger:** Executed as the ultimate fallback or bounce settlement via `this.enqueueSnapAnimation()` (`src/view/reels/ReelMechanicClassic.ts:273`, `314`).
*   **Execution Timing:** 
    *   Immediately invokes `this.strip.snapToGrid()` (`src/view/reels/ReelMechanicClassic.ts:333`).
    *   Reads `snap.durationMs` from config to create a Timeline pause `createWait()`. This enforces a hard minimum delay between snap visual alignment and `onStopped()`.

## 5. Final `setVisibleSymbols` Verification
The contract ensures `setVisibleSymbols` is invoked strictly ONCE per stop cycle, precisely at `beginStop()`. 
**There are no post-facto timeline injections or late-stage modifications** to the `stripPosition`.

## Timeline Breakdown (Chronological)
1. `update()`: `slotsScrolled` hits threshold `this.stopPlan.spinDistance`.
2. `beginStop()` replaces off-screen buffers with target symbols (forced `yOffset = 0`).
3. Deceleration Tween drops `visualOffsetY` from negative offset to overshoot.
4. *[If Enabled]* Bounce Tween raises `visualOffsetY` from overshoot back to `0`.
5. Snap hard-locks `visualOffsetY` and `yOffset` to 0. Small Wait Tween occurs.
6. `completeStop` emits `onStopped`. Reel goes `IDLE`.
