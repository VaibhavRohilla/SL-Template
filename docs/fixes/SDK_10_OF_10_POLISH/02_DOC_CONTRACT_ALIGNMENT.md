# Doc Contract Alignment: StopMotionConfig ease Type

## Goal

No documentation should state or imply that `ease` is a generic string (`z.string()`). It must reflect the typed **EasingName** contract (schema: `z.enum(EASING_NAMES).optional()`).

## 2.1 Outdated Doc Section

- **Location**: `SL-Template/docs/fixes/UNIFIED_STOP_MOTION/02_DESIGN_DECISION_AND_API.md`
- **Issue**: The “Engine Schema Updates” code block showed:
  - `ease: z.string().optional()`
  - Comment: “Optional explicit ease override (e.g., 'backOut')”  
  That suggested `ease` is any string, which does not match the engine.

## 2.2 Contract Text Updates

In `02_DESIGN_DECISION_AND_API.md`:

1. **Schema**  
   - Replaced `ease: z.string().optional()` with `ease: z.enum(EASING_NAMES).optional()`.  
   - Clarified that `overshootStrength` is 0–3 and that max 3 maps to `backOutStrong(s=3.0)`.

2. **Ease semantics**  
   - Stated explicitly: **`ease`** is typed as **EasingName**. It must be one of the names in `EASING_NAMES` exported by the engine. Invalid names fail schema validation.

3. **EasingName contract**  
   - Added a short “EasingName contract” subsection that:
     - Points to the engine’s public API for the canonical list (e.g. `SL-Engine/docs/10-api-reference/public-api.md`).
     - States that the full list of 38 names is not duplicated in the UNIFIED_STOP_MOTION doc; the canonical source is the engine.

## 2.3 Cross-Reference

- The UNIFIED_STOP_MOTION doc now references the engine’s public API for the canonical easing list and EasingName.
- There is no separate `EASING_TYPED_CONTRACT` folder in the Template repo; the canonical contract is the engine’s `EASING_NAMES` and `EasingName` export and the public API doc.

## 2.4 Summary Doc Update

In `SL-Template/docs/fixes/UNIFIED_STOP_MOTION/00_EXEC_SUMMARY.md`:

- Added a short section stating that:
  - StopMotionConfig **ease** is typed as **EasingName** (no free-form strings).
  - Public **overshootStrength** max is 3.0 and the internal “strong” curve is **backOutStrong(s=3.0)**.

## File Paths Changed

| File | Changes |
|------|---------|
| `SL-Template/docs/fixes/UNIFIED_STOP_MOTION/02_DESIGN_DECISION_AND_API.md` | Schema: `ease` → `z.enum(EASING_NAMES).optional()`, overshootStrength 0–3 and backOutStrong(s=3.0); EasingName contract subsection; template example overshootStrength 1.4 (0–3 scale). |
| `SL-Template/docs/fixes/UNIFIED_STOP_MOTION/00_EXEC_SUMMARY.md` | Section on ease typing and overshootStrength max / backOutStrong(s=3.0). |
