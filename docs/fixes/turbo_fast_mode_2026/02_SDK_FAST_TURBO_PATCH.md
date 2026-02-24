# SDK Fast Turbo Patch

## Contract (non-negotiable)

**Skip Animations is a branch; Real Turbo is a profile; they must not be coupled.**

- **Skip Animations** (API: `turboMode: true`) = instant snap + applyFinalState, no reel motion, no timeline.
- **Real Turbo** (API: `speedProfile: 'turbo'`) = normal path (onStopReel sequence + onPresentWins) with scaled time budgets (reel motion + stop spacing + win timeline).
- Never couple skipAnimations into “fast turbo” timing math. Skip is a branch, not a speed profile.
- Turbo/skip are presentation-only; no backend payload or math changes.

---

## Required structure

- **SpeedProfile** = `'normal' | 'turbo'`.
- **Where it applies:**
  - **Reels:** `ReelsView.setTimeScale(turboTimeScale)` only when `speedProfile === 'turbo'` **and** `!turboMode` (Real Turbo). Config: `SpinFeelConfig.turbo.timeScale` (1–10, default 2). Reset to 1 in `onSpinEnd` (finally-safe).
  - **SpinFlow:** `effectiveDeltaMs = deltaMs * speedMultiplier` where `speedMultiplier = (speedProfile === 'turbo') ? getTurboTimeScale() : 1`. **turboMode must NOT appear in this condition.** `getTurboTimeScale()` reads `config.turbo.timeScale` (clamped 1–10).
  - **Stop delays:** When `speedProfile === 'turbo'` and `!turboMode`, use `config.turbo.stopDelayMs` if present; else `Math.max(0, Math.floor(baseDelay / turboTimeScale))`.
  - **TweenService (optional):** When Real Turbo spin starts, `tweenService.setTimeScale(turboTimeScale)`; reset to 1 in `onSpinEnd`.

## Rules

- Runtime-safe and revertable per spin (timeScale reset via `onSpinEnd` on every exit: success, error, cancel, skip).
- No global mutation without reset: speedProfile and timeScale applied at spin start, cleared in `onSpinEnd`.
- Defaults to normal when Template does not set profile (`speedProfile` defaults to `'normal'` in SpinFlow and SlotScene).

## Implementation summary

| File | Change |
|------|--------|
| `SpinFlow.ts` | `SpeedProfile` type; `StartSpinOptions.speedProfile`; private `speedProfile`; `getTurboTimeScale()` from config (1–10); `effectiveDeltaMs` uses **only** `speedProfile` (not turboMode); `getStopDelayForReel(reelIndex)` uses `config.turbo.stopDelayMs` or scaled base; `onSpinEnd` callback; `releaseLockAndNotify()` used for all lock release paths; snapshot includes speedProfile. |
| `SlotScene.ts` | `speedProfile` state; `setSpeedProfile(profile)`; pass `speedProfile` in `startSpin`; set `reelsView.setTimeScale(turboTimeScale)` and `tweenService.setTimeScale(turboTimeScale)` only when Real Turbo (`speedProfile === 'turbo' && !turboMode`); register `onSpinEnd` to reset both to 1. |
| `SlotGameScene.ts` | `setSpeedProfile(profile)` delegating to slotScene. |
| `App.ts` (Game) | `setSpeedProfile(profile)` delegating to slotGameScene. |

## Template integration

- Template calls `game.setSpeedProfile(getTurboFast() ? 'turbo' : 'normal')` before `game.spin(bet, getSkipAnimations())`.
- Skip Animations remains separate: `turboMode === true` always uses onSkipAnimations path regardless of speedProfile.
- When Skip is ON, optional DEV log: `[SKIP] enabled → Turbo speed profile ignored for this spin`.

## DEV proof logs

- **DEV_TURBO_FAST_TRACE:** Real Turbo active at spin start; reelsView/timeScale set and reset.
- **DEV_SPIN_TIMING / DEV_SPIN_TIMING_TRACE:** Milestones include `speedProfile`, `turboTimeScale`, `stopDelayMode` (base vs turbo config vs turbo scaled).

---

## Skip Animations parity fixes: final-stage grid + payline draw

- **Final-stage grid:** Skip path now applies `result.stages[result.stages.length - 1].grid` to reels (not base stage), so multi-stage/cascade outcomes show the same final grid as normal flow. Single-stage unchanged.
- **Payline draw:** In `DefaultWinPresenterStrategy.applyFinalState`, when `showPaylines` is true and the outcome contains line wins, the same `LineWinVisualizer.visualizeMultipleLineWins(lineWins)` used in normal flow is called so paylines render identically in Skip mode.
- **DEV logs:** `SKIP_APPLY_GRID_STAGE_INDEX` / `stageCount` and `SKIP_PAYLINES_DRAWN count` / `showPaylines` behind `DEV_TURBO_TRACE` or `DEV_SPIN_TIMING_TRACE`.
