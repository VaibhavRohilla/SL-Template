# Easing Scale Alignment: backOutStrong vs overshootStrength Max

## Goal

Public max for `overshootStrength` is **3.0**. The internal “Strong” back-out curve must match that upper bound: **backOutStrong** should use **s = 3.0**, not 3.5.

## 3.1 Where Easings Are Registered

- **File**: `SL-Engine/src/runtime/services/IEasingRegistry.ts`
- **Registrations**:
  - `backOutSoft`: `EasingRegistry.createBackOut(0.8)` — unchanged.
  - `backOutStrong`: was `createBackOut(3.5)`; updated to `createBackOut(3.0)`.
- **Mapping**: `ReelMechanicClassic.resolveSpringEase(overshootStrength)` maps:
  - `overshootStrength === 0` → `'quadOut'`
  - `0 < overshootStrength ≤ 1` → `'backOutSoft'`
  - `1 < overshootStrength ≤ 2` → `'backOut'`
  - `overshootStrength > 2` → `'backOutStrong'`  
  So the upper bucket (near 3.0) uses `backOutStrong`; it should correspond to the public max 3.0.

## 3.2 Changes Applied

1. **IEasingRegistry.ts**
   - `this.register('backOutStrong', EasingRegistry.createBackOut(3.5))`  
     → `this.register('backOutStrong', EasingRegistry.createBackOut(3.0))`.
   - Comment for `createBackOut`: “s=3.5 → strong overshoot”  
     → “s=3.0 → strong overshoot (aligns with public overshootStrength max)”.

2. **Docs**
   - UNIFIED_STOP_MOTION API contract: overshootStrength is 0–3; max 3 maps to **backOutStrong(s=3.0)** (see `02_DOC_CONTRACT_ALIGNMENT.md` and updated `02_DESIGN_DECISION_AND_API.md`).
   - Engine public API / summary: same alignment stated where relevant.

## 3.3 Rationale

- **Consistency**: The public API says overshootStrength ∈ [0, 3]. The “strong” preset should match the maximum value (3.0), not exceed it (3.5).
- **Behavior**: This is a small, intentional alignment of behavior with the documented contract; no new legacy or back-compat paths. The curve shape remains the same; only the strength parameter is set to 3.0.

## 3.4 Runtime and Tests

- **Existing tests**: No change to “single tween invariant” or stop-motion logic; only the internal parameter of `backOutStrong` changed.
- **Snapshots**: No snapshot expectations in the repo depended on the numeric value 3.5; no snapshot updates required.
- **Gates**: `pnpm typecheck`, `pnpm test --run`, `pnpm build` all pass (see `04_TESTS_AND_GATES.md`).
