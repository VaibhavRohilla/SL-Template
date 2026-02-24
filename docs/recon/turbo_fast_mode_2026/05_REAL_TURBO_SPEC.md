# Real Turbo — Production Spec

## Definition

- **Turbo (Real Turbo)** = animated but faster. Reels spin and stop in normal order; win presentation plays but is shortened (or optionally shortened).
- **Skip Animations** = instant snap + applyFinalState (no reel motion, no win timeline). Unchanged; separate mode.

## What Turbo modifies (presentation only)

1. **Reel spin speed and/or time budgets** — e.g. ReelsView.timeScale &gt; 1 so reel scroll is faster.
2. **Stop spacing** — inter-reel delay reduced (e.g. use config.turbo.stopDelayMs or scale base stopDelayMs).
3. **Win presentation sequencing time** — optional: TweenService timeScale &gt; 1 or shorter durations so win timeline runs faster.

## What Turbo must NOT do

- Change symbol outcomes.
- Change stop order.
- Change stage selection.
- Bypass alignment/snap.
- Bypass payline/ways/cluster visualizers.

## Acceptance targets (example; tune to engine)

| Metric | Target range |
|--------|----------------|
| FIRST_REEL_STOPPED | 300–700 ms |
| ALL_REELS_STOPPED | 1200–2500 ms (configurable by reel count) |
| WIN_PRESENTATION_DONE | 400–1200 ms (or “instant per win” if condensed mode) |
| No post-stop mutation logs | Same final grid as normal |
| Same final grid as normal | No outcome or grid changes |

## Contract

- **SpeedProfile** = `'normal' | 'turbo'`. Set before spin; applies for that spin only; resettable.
- When **speedProfile === 'turbo'** and **skipAnimations === false**: use normal path (onStopReel sequence, onPresentWins), with scaled delta and optionally reduced stop delays and win timing.
- When **skipAnimations === true**: use onSkipAnimations path regardless of speedProfile (instant).
