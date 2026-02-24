# Runtime Timing Proofs (DEV-only)

## DEV trace flags (removable)

Add the following flags in `SL-Engine/src/view/reels/reelDebug.ts` (or keep existing and add new):

| Flag | Purpose |
|------|---------|
| **DEV_SPIN_TIMING_TRACE** | When true, log performance.now() at: SPIN_REQUESTED, SPIN_STARTED, RESULT_RECEIVED, STOP_SEQUENCE_START, FIRST_REEL_STOPPED, ALL_REELS_STOPPED, WIN_PRESENTATION_STARTED, WIN_PRESENTATION_DONE, SPIN_COMPLETE / INPUT_UNLOCKED. |
| **DEV_TURBO_FAST_TRACE** | When true, log when speedProfile is 'turbo' and when reelsView.timeScale / SpinFlow effectiveDeltaMs are applied. |

Existing flag **DEV_SPIN_TIMING** already logs at SpinFlow emit milestones (`SpinFlow.ts:1465–1496`). Existing **DEV_TURBO_TRACE** logs TURBO_STATE, BRANCH_SELECTED, REELS_STOPPED, PRESENTATION_*, SPIN_INPUT_UNLOCKED (`reelDebug.ts:18`; used in SpinFlow and SlotScene).

For 04 proofs we use **DEV_SPIN_TIMING** (already emits at SPIN_REQUESTED, SPIN_STARTED, RESULT_RECEIVED, REEL_STOP_REQUESTED, REEL_STOPPED, ALL_REELS_STOPPED, WIN_PRESENTATION_STARTED, WIN_PRESENTATION_COMPLETE, SPIN_COMPLETE) with `event` and `elapsedMs` from spin start. So we can run 10 spins (5 normal, 5 Skip Animations) and record:

- **SPIN_REQUESTED** → **ALL_REELS_STOPPED**: reel phase duration.
- **ALL_REELS_STOPPED** → **WIN_PRESENTATION_COMPLETE** or **SPIN_COMPLETE**: presentation phase.
- **SPIN_REQUESTED** → **SPIN_COMPLETE**: total.

## How to run

1. Set `DEV_SPIN_TIMING = true` and `DEV_TURBO_TRACE = true` in `reelDebug.ts` (DEV only; revert for production).
2. Open game; run 5 spins with Skip Animations OFF (normal).
3. Turn Skip Animations ON; run 5 spins.
4. Capture console output; compute deltas from `elapsedMs` and `event` for each run.

## Expected deltas (example targets)

- **Normal:** FIRST_REEL_STOPPED ~500–800 ms; ALL_REELS_STOPPED ~1200–2500 ms (depends on reel count and stopDelayMs); WIN_PRESENTATION_* ~400–2000 ms.
- **Skip Animations:** SPIN_REQUESTED → SPIN_COMPLETE typically &lt;200 ms (instant path).

## Stop condition

If no safe runtime knobs can be found for Real Turbo, stop recon here. Per 02_TIME_OWNERSHIP_MAP and 03_TURBO_KNOB_TABLE, safe knobs exist: ReelsView.timeScale, SpinFlow effectiveDeltaMs (with speedProfile), optional turbo.stopDelayMs, TweenService.setTimeScale. Proceed to implementation.
