# Implementation Plan

## 1. Files to Touch

**Engine (`@fnx/sl-engine`)**
- `src/core/types/SpinFeelConfig.ts`: Add `StopMotionConfigSchema` to `SpinFeelConfigSchema` and ensure legacy `bounce` fields remain optional/deprecated but functional.
- `src/view/reels/ReelMechanicClassic.ts`: Update `animateStop()` to tween from initial offset directly to `0` over `durationMs`. Remove `enqueueBounceAnimation()`. Apply easing based on the new `stopMotion.style`.

**Template (`@fnx/sl-template`)**
- `src/brand/SpinFeel.ts`: Define `stopMotion: { style: 'spring', durationMs: 120 }` (combining previous 110ms decel + 10ms settle) and keep `bounce` there but unused by the new pipeline.

**Tests**
- `tests/recon/audit.test.ts` (or create a specific `unified_stop.test.ts`): Add assertions to verify that single-tween motion is used and that no visual offset jump occurs.

## 2. Exact Steps

1. **Schema Update**:
   - Add `stopMotion` schema object to `SpinFeelConfig`.
   - Retain existing `bounce` config schema without breaking changes.
2. **ReelMechanic Modification**:
   - Refactor `animateStop()` to resolve duration and ease:
     - `duration`: `stopMotion?.durationMs ?? (stopDecelMs + (bounce.enabled ? bounce.settleMs : 0))`
     - `ease`: `stopMotion?.ease ?? (stopMotion?.style === 'smooth' || !bounce.enabled ? stopEase : bounceEase)`
   - Set the tween `to: { y: 0 }`.
   - In `onComplete`, call `enqueueSnapAnimation()` directly.
   - Delete/bypass `enqueueBounceAnimation()`.
3. **Template Wiring**:
   - Add `stopMotion` property to the `spinFeelConfig` in `SpinFeel.ts`.
4. **Testing**:
   - Run `pnpm test` and specific reel determinism tests.
   - Ensure `DEV_STOP_PROFILE_PROBE` no longer logs a velocity cliff.
   - Ensure build passes (`pnpm typecheck` & `pnpm build`).

## 3. Rollback Strategy

1. The `StopMotionConfig` is entirely additive to the `SpinFeelConfig`.
2. If `ReelMechanicClassic` changes fail, we can revert `ReelMechanicClassic.ts` to restore the `enqueueBounceAnimation` logic. Since the legacy `bounce` config parameters are untouched, rolling back simply re-enables the dual-tween system.
3. If necessary, we can put the new one-tween behavior behind a feature flag (e.g., `unifiedStop: true` inside `stopMotion`), but since it's an architectural fix, direct replacement is preferred.

## 4. Risks and Mitigation

- **Risk**: The timeline engine or standard GSAP-like easing (`backOut`) might not natively support an explicit `overshootStrength` parameter via string parsing (e.g. `'backOut(1.5)'`).
- **Mitigation**: We will prioritize standard string-based easing (e.g., `'backOut'`) and allow proportional overshoot. If an exact pixel amplitude is strictly required and standard scaling doesn't cover it, we can fallback to math-based start-offset scaling, but standard easing achieves the requested aesthetic natively without a velocity cliff.
- **Risk**: QuickStop or Turbo might rely on the two stages for internal routing.
- **Mitigation**: Turbo simply reduces `timeScale` and `skipBounce`, which we can simulate by forcing `style: 'smooth'` when `turbo.skipBounce` is true. QuickStop kills tweens entirely and jumps to zero, so a single tween is actually safer to interrupt.
