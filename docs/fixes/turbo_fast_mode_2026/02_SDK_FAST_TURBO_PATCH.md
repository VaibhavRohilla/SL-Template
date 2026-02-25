# SDK Fast Turbo Patch

## Contract (non-negotiable)

**Skip Animations is a branch; Real Turbo is a profile; they must not be coupled.**

- **Skip Animations** (API: `turboMode: true`) = instant snap + applyFinalState, no reel motion, no timeline.
- **Real Turbo** (API: `speedProfile: 'turbo'`) = normal path (onStopReel sequence + onPresentWins) with **shorter durations** from config (duration-based; no time scale).
- Never couple skipAnimations into “fast turbo” timing math. Skip is a branch, not a speed profile.
- Turbo/skip are presentation-only; no backend payload or math changes.

---

## Required structure

- **SpeedProfile** = `'normal' | 'turbo'`.
- **Where it applies (duration-based turbo):**
  - **Reels:** When Real Turbo, `ReelsView.setTurboDurations(config.turbo)` at spin start; `setTurboDurations(null)` in `onSpinEnd`. Time scale is **not** set for turbo (stays 1).
  - **SpinFlow:** No delta scaling. `getMinSpinMs()` returns `config.turbo.minSpinMs` when turbo (if set), else base `minSpinMs`. `getStopDelayForReel()` returns `config.turbo.stopDelayMs` when turbo.
  - **Reel stop/snap:** Reels receive duration getters from ReelsView; when turbo, use `config.turbo.stopMotionDurationMs` / `snapDurationMs` if set.
  - **Cascade:** Drop/fill use `config.turbo.dropDurationMs` / `fillDurationMs` when set via ReelsView getters.

## Rules

- Runtime-safe and revertable per spin (timeScale reset via `onSpinEnd` on every exit: success, error, cancel, skip).
- No global mutation without reset: speedProfile and timeScale applied at spin start, cleared in `onSpinEnd`.
- Defaults to normal when Template does not set profile (`speedProfile` defaults to `'normal'` in SpinFlow and SlotScene).

## Implementation summary

| File | Change |
|------|--------|
| `SpinFlow.ts` | `SpeedProfile` type; `getMinSpinMs()` (turbo uses `config.turbo.minSpinMs` when set); no delta scaling; `getStopDelayForReel()` uses `config.turbo.stopDelayMs` when turbo; snapshot includes speedProfile. |
| `SlotScene.ts` | `speedProfile` state; `setSpeedProfile(profile)`; pass `speedProfile` in `startSpin`; when Real Turbo call `reelsView.setTurboDurations(config.turbo)` (do **not** set time scale); `onSpinEnd` calls `setTurboDurations(null)` and resets time scale to 1. |
| `SlotGameScene.ts` | `setSpeedProfile(profile)` delegating to slotScene. |
| `App.ts` (Game) | `setSpeedProfile(profile)` delegating to slotGameScene. |

## Template integration

- Template calls `game.setSpeedProfile(getTurboFast() ? 'turbo' : 'normal')` before `game.spin(bet, getSkipAnimations())`.
- Skip Animations remains separate: `turboMode === true` always uses onSkipAnimations path regardless of speedProfile.
- When Skip is ON, optional DEV log: `[SKIP] enabled → Turbo speed profile ignored for this spin`.

## DEV proof logs

- **DEV_TURBO_FAST_TRACE:** Real Turbo active at spin start; turbo durations set and reset.
- **DEV_SPIN_TIMING / DEV_SPIN_TIMING_TRACE:** Milestones include `speedProfile`, `durationBasedTurbo`, `stopDelayMode` (base vs turbo config).

---

## Skip Animations parity fixes: final-stage grid + payline draw

- **Final-stage grid:** Skip path now applies `result.stages[result.stages.length - 1].grid` to reels (not base stage), so multi-stage/cascade outcomes show the same final grid as normal flow. Single-stage unchanged.
- **Payline draw:** In `DefaultWinPresenterStrategy.applyFinalState`, when `showPaylines` is true and the outcome contains line wins, the same `LineWinVisualizer.visualizeMultipleLineWins(lineWins)` used in normal flow is called so paylines render identically in Skip mode.
- **DEV logs:** `SKIP_APPLY_GRID_STAGE_INDEX` / `stageCount` and `SKIP_PAYLINES_DRAWN count` / `showPaylines` behind `DEV_TURBO_TRACE` or `DEV_SPIN_TIMING_TRACE`.
