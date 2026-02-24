# Design Decision and API API

## 1. Implementation Strategy

**Choice: Option A — ONE tween to `visualOffset=0` with easing style controlling overshoot.**

### Justification
- **Eliminates "Two Motion" Feel**: A single continuous mathematical tween from the initial offset to `0` guarantees mathematically smooth velocity. There is no velocity cliff simply because there is no hand-off to a second tween. Overshoot is created by the easing function dipping past zero and returning, meaning velocity approaches 0, crosses 0 smoothly, and settles at 0.
- **Future-Proof**: By defining the stop motion in terms of an overall "style" (`'smooth'` vs `'spring'`) and duration, the pipeline no longer branches based on bounce configuration. Disabling overshoot is as simple as changing the easing function (i.e. changing style to `'smooth'`). The same pipeline handles both.
- **Safe for Determinism and Snap Alignment**: The single tween still targets `visualOffsetY = 0`, meaning that when the tween completes, the visual position is exactly zero (modulo internal easing float precision). The `snapToGrid` function will still run immediately after, forcing exact pixel integer alignment before the `onStopped` event. Because the timeline duration is deterministic and known upfront, determinism is maintained.

## 2. New Configuration API

We introduce a `stopMotion` profile on `SpinFeelConfig` while keeping legacy fields for backwards compatibility.

### Engine Schema Updates (`SpinFeelConfigSchema`)
```typescript
/**
 * Unified stop motion profile
 */
export const StopMotionConfigSchema = z.object({
  /** Motion style: smooth (no overshoot) or spring (overshoot/bounce) */
  style: z.enum(['smooth', 'spring']).default('spring'),
  /** Duration of the entire stop motion (decel + settle) */
  durationMs: z.number().min(50).max(2000).optional(),
  /** Overshoot strength 0–3 (used if style='spring'). Max 3 maps to backOutStrong(s=3.0). 0 = no overshoot. */
  overshootStrength: z.number().min(0).max(3).optional(),
  /** Optional explicit ease override. Must be one of EASING_NAMES (EasingName). Invalid names fail schema validation. */
  ease: z.enum(EASING_NAMES).optional()
});

export type StopMotionConfig = z.infer<typeof StopMotionConfigSchema>;
```
We will append this to `SpinFeelConfigSchema`:
```typescript
  /** Unified stop motion profile (preferred over legacy stopDecelMs/bounce) */
  stopMotion: StopMotionConfigSchema.default({}),
```

### Backwards Compatibility Mapping Rules
When the engine runs `animateStop`, it will resolve the config properties sequentially:
1. **Duration**: 
   - Use `config.stopMotion.durationMs` if provided.
   - Fallback: `config.stopDecelMs + (config.bounce.enabled ? config.bounce.settleMs : 0)`.
2. **Style / Overshoot**:
   - If `config.stopMotion.style === 'spring'`, or if `stopMotion.style` is omitted but legacy `bounce.enabled === true`: Use a spring/backOut ease.
     - Default overshoot target mapped to `config.stopMotion.overshootStrength` or legacy `bounce.amplitudePx`. Max overshoot distance used by `backOut`. (Note: standard `backOut` does exactly 10% overshoot by default; we can use the GSAP-style `backOut(overshoot)` or similar if the internal tween engine supports custom parameters, OR map the amplitude into the start offset math if we need exact amplitude).
     - Because the internal tween library might just use strings like `'backOut'`, we rely on `config.stopMotion.ease` or `bounceEase`. If no custom amplitude tween is available, we use standard `'backOut'`.
   - If `config.stopMotion.style === 'smooth'`, or if legacy `bounce.enabled === false`: Use `config.stopMotion.ease` or `config.stopEase` (default `'quadOut'`). No overshoot.

### EasingName contract
- **`ease`**: Typed as `EasingName` (not a free string). Must be one of the names exported as `EASING_NAMES` by the engine. Invalid names fail schema validation. See the engine’s public API (e.g. `docs/10-api-reference/public-api.md`) for the canonical list; do not duplicate the full list here.

### Template Updates
In `SpinFeel.ts`, we will provide:
```typescript
    stopMotion: {
        style: 'spring',
        durationMs: 120, // Sum of old stopDecelMs (110) + settleMs (10)
        overshootStrength: 1.4 // 0–3 scale; max 3 maps to backOutStrong(s=3.0).
    },
```
We leave `stopTravelSymbolsMax` unmodified.

### Pipeline Simplification
In `ReelMechanicClassic.ts`:
- The `bounce` tween logic is completely removed from the default pipeline.
- Instead of tweening to `bounce.amplitudePx` and then tweening to `0`, we tween directly to `0`.
- If overshoot is requested, the tween uses an easing function that dips below/above `0` before settling.

*Note on Easing precision*: If the timeline system uses standard string-based easing curves without amplitude parameters (e.g., `backOut`), the overshoot distance is strictly proportional to the initial deceleration distance. We will accept this proportional overshoot as the modern standard, rather than trying to force an absolute pixel amplitude, which is what caused the two-stage approach. If an absolute amplitude is strictly required by the legacy API, we can either warn that it is now proportional, or implement a custom easing function. Given the directive for unified motion, proportional overshoot via standard curve is the only mathematically sound approach for a single tween. We will document this mapping.
