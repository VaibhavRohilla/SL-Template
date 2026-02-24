# Code Changes

## Engine Changes (`@fnx/sl-engine`)

### `src/core/types/SpinFeelConfig.ts`
- Added `StopMotionConfigSchema` allowing configuration of `style` (`'smooth'` or `'spring'`), `durationMs`, `overshootStrength`, and `ease`.
- Made `stopMotion` an optional top-level property on `SpinFeelConfigSchema` to avoid breaking downstream tests while providing a preferred unified path.
- Deprecated `bounce` and `bounceEase` with XML-doc annotations explaining their parameters (like `amplitudePx`) are maintained for proportional overshoot intent but no longer map directly to absolute pixel translation stages.

### `src/view/reels/ReelMechanicClassic.ts`
- Removed `enqueueBounceAnimation()` entirely.
- Refactored `animateStop()` to dynamically resolve the `duration` and `easing` from `config.stopMotion` if present, otherwise falling back strictly to the legacy mathematical sum of `stopDecelMs` + `bounce.settleMs` to maintain exact total duration.
- The single decel tween now commands `to: { y: 0 }` mathematically reaching the final target position.
- In `onComplete`, the single tween schedules `enqueueSnapAnimation()` directly.
- Removed arbitrary telemetry probe code checking for dual-stage boundary logic since the boundary itself no longer exists.

## Template Changes (`@fnx/sl-template`)

### `src/brand/SpinFeel.ts`
- Removed all legacy `bounce`, `bounceEase`, and `stopEase` parameters from `spinFeelConfig`.
- Added the unified `stopMotion` block defining:
  - `style: 'spring'`
  - `durationMs: 120` (combining the previous `110ms` decel and `10ms` settle)
  - `overshootStrength: 100` (maintaining the legacy `amplitudePx` proportionality)
- Maintained all other non-stop-motion constraints (such as staggered `stopDelayMs` and strict bounds for `stopTravelSymbolsMin`/`Max`).
