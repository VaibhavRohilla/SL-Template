# Acceptance Checklist: SDK 10/10 Polish Pack

## CI trust
- [x] Default `pnpm test --run` is deterministic (100% pass)
- [x] Stress test is moved to non-gating suite; explicit command `pnpm test:stress` runs it

## Docs
- [x] Overshoot/stop-motion docs contain no `ease: string` references
- [x] StopMotionConfig ease documented as `EasingName` (and schema as `z.enum(EASING_NAMES).optional()`)
- [x] Canonical easing list referenced (engine public API), not duplicated in UNIFIED_STOP_MOTION

## Easing scale
- [x] backOutStrong uses s=3.0 (changed from 3.5 in `IEasingRegistry.ts`)
- [x] Public max overshootStrength (3.0) aligns with internal “strong” curve (backOutStrong(s=3.0))

## Finalize
- [x] `docs/fixes/SDK_10_OF_10_POLISH/00_EXEC_SUMMARY.md` updated with what changed, why it removes gaps, and proof links (file paths)
- [x] All deliverables present: 00–05 in `docs/fixes/SDK_10_OF_10_POLISH/`
