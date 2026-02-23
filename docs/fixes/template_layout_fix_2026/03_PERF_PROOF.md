# 03 — Performance Proof

**Date:** 2026-02-23

---

## Primary fix: Double tween update eliminated

### Before (2 updates/frame)
- Tweens advanced by `2 × deltaMs` per frame
- Stop decel at 280ms config → completed in ~140ms wall clock
- Bounce at 140ms config → completed in ~70ms wall clock
- Visual: animations appeared twice as fast → perceived as "jerky"

### After (1 update/frame)
- Tweens advance by exactly `deltaMs` per frame
- All animation durations now match their config values
- No extra `getTypedServices()` DI lookup per frame in the hot path

### Eliminated per-frame overhead
The `App.ts` update loop no longer calls:
```typescript
const services = getTypedServices(this.container); // DI lookup — removed
services.tweenService.update(ticker.deltaMS);      // duplicate — removed
```

---

## Secondary: Renderer configurability

### New GameOptions fields

| Option | Default | When to change |
|--------|---------|---------------|
| `maxDpr: 2` | no cap (native) | Mobile/tablet with 3× screens |
| `antialias: false` | `true` | Low-end GPU, integrated graphics |

### GPU impact of HiDPI

| DPR | Backing buffer (1920×1080 design) | Fill rate vs 1× |
|-----|-----------------------------------|-----------------|
| 1 | 1920 × 1080 | 1× |
| 2 | 3840 × 2160 | 4× |
| 3 | 5760 × 3240 | 9× |

Capping at `maxDpr: 2` limits worst-case to 4× fill rate on any device.

### Usage in Template (if needed)
```typescript
const gameOptions = {
  // ... existing options ...
  maxDpr: 2,
  antialias: false,  // disable on low-end
} as GameOptions;
```

---

## Stress test results (Engine)

All 972/972 tests pass, including all stress and pooling tests.

```
Test Files  97 passed (97)
     Tests  972 passed (972)
   Duration  9.42s
```
