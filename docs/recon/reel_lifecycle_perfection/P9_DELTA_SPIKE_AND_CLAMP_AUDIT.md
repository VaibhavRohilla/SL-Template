# P9: Delta Spikes & Clamp Audit

This document investigates engine resilience to massive frame-time jumps (e.g., when the browser tab goes to sleep or GC pauses the thread) to ensure the reels don't teleport, visually break, or crash the state machine.

## 1. The Threat Model
Because the `ReelMechanicClassic` update loop scrolls symbols at velocity:
`rawDistance = (this.spinSpeed * deltaMs) / 1000`

If `deltaMs` suddenly spikes to 5000ms, `rawDistance` would jump by hundreds of slots in a single frame tick. This could bypass distance thresholds incorrectly or cause array-out-of-bound errors when swapping symbol buffers.

## 2. Global Ticker Clamping
The engine relies on PixiJS's `Ticker` underlying the `engine.ticker.add()` loop. By default, `PIXI.Ticker` strictly caps `deltaMS` passed to subscribers via `maxElapsedMS` (usually capping at 100ms equivalent). Even if 5 seconds of real-world time pass, the engine artificially passes at most `~100` into `deltaMs`, safely stretching out the timeline without jumping logic ticks.

## 3. Local Hardware Clamping (maxScrollPerFrame)
While PIXI handles the massive spikes, smaller spikes (like dropping from 60fps to 15fps) still result in larger `deltaMs` (16ms -> 66ms). 
*   **The Guard:** `src/view/reels/ReelMechanicClassic.ts:189`
    `const distance = Math.min(rawDistance, this.strip.slotHeight * this.config.maxScrollPerFrame);`
*   **The Config:** `maxScrollPerFrame` defaults to strictly `0.95`.
*   **The Result:** A reel is mathematically forbidden from scrolling more than 95% of a single symbol's height in any single frame, **regardless of the spin speed or the timeframe**. 

## 4. Why 0.95?
The `ReelSymbolStrip.ts:scroll()` logic shifts the symbol buffer arrays. If a reel scrolled perfectly 1.0 slot heights or more in a single frame, the array shift logic would need a `while` loop that replaces multiple symbols instantly. 
By capping movement at 95% of a slot, the engine guarantees that the `scroll()` array mutations hit exactly one cell boundary at a time, preventing stutters, teleporting symbols, or logical skips during evaluation thresholds.

## Verdict
The logic is inherently safe from delta spikes. Both global time-dilation caps (PIXI) and local mathematical velocity caps (0.95 slot distance limit) are actively guarding the loop.
