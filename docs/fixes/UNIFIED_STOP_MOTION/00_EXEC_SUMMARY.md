# Execution Summary: Unified Stop Motion

## What Changed
We removed the mathematical "velocity cliff" that triggered halfway through reel stops by fundamentally rethinking the animation architecture rather than hacking it. The reel deceleration and the subsequent "bounce/overshoot" are no longer two consecutive timeline tweens. We replaced the entire dual-stage pipeline with a **single, unified motion tween** that travels smoothly from the initial stop distance directly to the target lock point (`visualOffset = 0`).

## Why It Solves the "Two Motion" Feel
The "two motion" feeling was empirically rooted in a true velocity boundary (`[DEV_STOP_PROFILE_PROBE] Velocity Cliff! End Decel v=0.20 px/ms, Start Bounce v=-5.00 px/ms`). 

By switching to a single tween approach, the engine now relies entirely on the mathematical curve of the easing function (e.g., `backOut`) to determine where the animation spends its time. Instead of hitting a brick wall at the end of deceleration and then "kicking" backward, the mathematical path naturally decelerates past the `0` line and settles gracefully back onto it, maintaining a single, uninterrupted velocity arc.

## How Bounce-Off Works
Bounce is no longer considered a "stage" at all; it's simply a stylistic effect of the new configuration property `stopMotion.style`. 

- **If `style: 'spring'`**, the engine employs an overshoot curve (like `backOut`), naturally resulting in the reel springing past the target and returning.
- **If `style: 'smooth'`**, the engine uses a standard deceleration curve (like `quadOut` or `cubicOut`), meaning motion strictly approaches 0 without crossing it. 
No conditionals branch the timeline logic—the engine runs the exact same tween command for both.

## StopMotionConfig ease typing
StopMotionConfig `ease` is typed as **EasingName** (schema: `z.enum(EASING_NAMES).optional()`). It is not a free-form string; invalid names fail schema validation. The canonical list is exported by the engine as `EASING_NAMES` (see public API). Public `overshootStrength` max is 3.0; the internal "strong" curve is `backOutStrong(s=3.0)`.

## Test Evidence
We wrote a specific unit regression test (`tests/recon/ReelMechanicClassic.unifiedStop.test.ts`) that asserts deterministic pipeline behavior:
- Running a spin with `stopMotion: { style: 'spring' }` proves that only **one single `reelStop` timeline command** is produced. The legacy `reelBounce` secondary command is completely inactive, enforcing a lack of multi-stage boundaries at the timeline level. Build gates including `pnpm typecheck` and `pnpm test` prove the API changes are safely integrated. See `05_TESTS_AND_EVIDENCE.md` for output logs.
