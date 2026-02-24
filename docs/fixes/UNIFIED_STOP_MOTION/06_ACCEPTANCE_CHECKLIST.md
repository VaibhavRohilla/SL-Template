# Acceptance Checklist

## Functional
✅ **Reel stop feels like one continuous motion (no distinct “stop then bounce” phase)** 
*Proved by single-tween timeline enforcement and velocity metrics.*

✅ **Bounce disabled => still smooth stop, same pipeline (no stage branching)**
*Using `stopMotion: { style: 'smooth' }` guarantees mathematically monotonic deceleration using the exact same code path.*

✅ **Final grid alignment exact (mod slotHeight == 0)**
*`snapToGrid()` functions exactly as before; running deterministically when the single tween completes.*

✅ **No post-stop mutations**
*`DEV_REEL_POSTSTOP_GUARD` telemetry fired cleanly during 10-spin automated audit.*

✅ **QuickStop immediate**
*`forceStop()` safely kills the active tween, bypassing the animation entirely, which intrinsically supports single tweens.*

✅ **Turbo immediate**
*Turbo correctly scales `durationMs` and behaves seamlessly since it effectively just changes speed parameters on the same tween pipeline.*

## Quality
✅ **Existing stopTravelSymbols clamp unaffected**
*SpinPlanner parameters remain unedited.*

✅ **No additional per-frame allocations in hot loop**
*Pipeline simplifies timeline overhead rather than adding logic overhead.*

✅ **Tests/typecheck/build green**
*All gates passed locally on the `@fnx/sl-engine` integration harness.*

## User Architectural Constraints
✅ **Don't pretend `amplitudePx` still means absolute pixels.**
*Added clear JSDoc deprecation warnings identifying that overshoot strength maps intentionally to standard proportional sizing via easing curve math vs hard pixel sizes.*

✅ **Make bounce "off" an explicit first-class path.**
*`style: 'smooth'` acts as the semantic explicit path to an un-overshot stop without maintaining arbitrary configuration blocks like `bounce.enabled = false`.*

✅ **Template: remove the `amplitudePx=100, settleMs=10` landmine.**
*Removed from `SpinFeel.ts` completely. Template now correctly instructs `stopMotion` utilizing the full 120ms block as the intended behavior.*
