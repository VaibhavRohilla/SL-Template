# Recon: Current Stop Pipeline

## 1. Stop Lifecycle in `ReelMechanicClassic`

The current stop lifecycle for normal (non-turbo, non-quickstop) spins contains distinct phases orchestrated by timeline commands.
- **SPIN**: Reels spin at `spinSpeed` (`ReelState.SPINNING`). When `symbolsSpun >= stopPlan.spinDistance`, `beginStop()` triggers.
- **THRESHOLD REACHED**: `beginStop()` calls `strip.setVisibleSymbols(finalSymbols)` sliding them into view (placed at `visualOffsetY = -slotHeight * 0.8`), and calls `animateStop()`.
- **DECEL**: A tween from `visualOffsetY = -slotHeight * 0.8` to `overshootTarget` (e.g., `bounce.amplitudePx`) using `stopEase` (default `'quadOut'`). Duration = `stopDecelMs`.
- **BOUNCE (Optional but default true)**: An `onComplete` of the deceleration tween enqueues `bounceCommand` if `bounce.enabled`. Tweens from `animState.y` to `0` using `bounceEase` (default `'backOut'`) over `bounce.settleMs`.
- **SNAP To Grid**: After bounce completes, `enqueueSnapAnimation()` sets `visualOffsetY = 0`, calls `strip.snapToGrid()`, and enqueues a short `waitCommand` of `snap.durationMs`.
- **STOPPED / IDLE**: An event command fires `completeStop()`, setting state to `ReelState.IDLE`, triggering `onStopComplete` lifecycle hook, and `onStopped` callback.

### Key Variables Affected
- `yOffset` (on strip): modified by standard spin `scroll()`
- `visualOffset` (on strip): animated by the DECEL and BOUNCE tweens for the stop motion. `visualOffsetY` is the sole source of motion during stop.
- `container.y`: unaffected here.

*File Reference: `src/view/reels/ReelMechanicClassic.ts`, lines 222-421.*

## 2. Proving the Discontinuity (Velocity Boundary)

By instrumenting `ReelMechanicClassic` with `DEV_STOP_PROFILE_PROBE`, we recorded the instantaneous velocity (ΔY/Δt) across the DECEL to BOUNCE phase boundary on reel 0 during a standard spin in `audit.test.ts`.

**Finding:**
```
[DEV_STOP_PROFILE_PROBE] Velocity Cliff! End Decel v=0.20 px/ms, Start Bounce v=-5.00 px/ms. Diff=5.20
```
This confirms a jarring velocity discontinuity. The DECEL curve finishes nearly flat (0.20 px/ms), then the BOUNCE curve kicks in instantly at a high speed (-5.00 px/ms) in the opposite direction, creating the "two motion" or "stop then bounce" feel.

## 3. Configuration Surface 

### Engine Variables (`SpinFeelConfig.ts`)
- `stopDecelMs`: duration of DECEL (default 200).
- `stopEase`: ease curve for DECEL (default `'quadOut'`).
- `bounceEase`: ease curve for BOUNCE (default `'backOut'`).
- `bounce`: Object with `enabled` (default `true`), `amplitudePx` (default `15`), `settleMs` (default `120`), `oscillations` (default `1`).
- `snap`: Object with `thresholdPx` and `durationMs` (default `50`).

### Template Variables (`SpinFeel.ts`)
- `stopDecelMs`: `110`
- `stopEase`: `'cubicOut'`
- `bounceEase`: `'backOut'`
- `bounce`: `enabled: true`, `amplitudePx: 100`, `settleMs: 10`, `oscillations: 1`

## Recon Verdict

1. **Is bounce a separate stage today?**
   Yes. It is explicitly enqueued as a separate timeline tween after the decel tween finishes.
   
2. **Is there a measurable velocity cliff?**
   Yes. Velocity goes from roughly 0 px/ms immediately to -5.00 px/ms at the timeline boundary between decel and bounce.
   
3. **Which variable is safest to animate for unified motion?**
   `visualOffset` on the strip. It is already used exclusively by both decel and bounce, naturally isolated from scroll logic, and safely zeroed out during snap.
