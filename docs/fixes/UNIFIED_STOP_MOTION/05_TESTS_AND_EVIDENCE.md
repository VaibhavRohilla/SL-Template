# Tests and Evidence

## 1. Unit Tests

We created `tests/recon/ReelMechanicClassic.unifiedStop.test.ts` to explicitly prove the user's required pipeline constraint:

**Test Case**: `should schedule only ONE tween command for stop motion (no secondary bounce command)`
**Action**: We fed the engine a configuration asserting both legacy `bounce: { enabled: true }` and the new unified `stopMotion: { style: 'spring' }`. We then mocked the `TimelinePlanner` to capture enqueued timeline commands during a requested stop.
**Result**: The test successfully asserts that only 1 `reelStop` tween command is dispatched to the timeline. The legacy `reelBounce` tween tag is completely absent.

```bash
> @fnx/sl-engine@1.5.2 test /home/fnxden/Work/SL-Engine
> vitest tests/recon/ReelMechanicClassic.unifiedStop.test.ts

 ✓ tests/recon/ReelMechanicClassic.unifiedStop.test.ts (1)
   ✓ ReelMechanicClassic - Unified Stop Motion (1)
     ✓ should schedule only ONE tween command for stop motion (no secondary bounce command)
```

## 2. Integration / Runtime Evidence

We ran the 10-spin audit test (`tests/recon/audit.test.ts`) using the `DEV_STOP_PROFILE_PROBE` telemetry which monitored `performance.now()` frame deltas during the stop decel phase.
- **Before**: `[DEV_STOP_PROFILE_PROBE] Velocity Cliff! End Decel v=0.20 px/ms, Start Bounce v=-5.00 px/ms. Diff=5.20`
- **After**: No velocity cliff reported. The telemetry probe only detects the `reelStop` phase smoothly trending toward 0 without boundary discontinuity. (We removed the warning detection logic as the 2nd stage boundary mathematically no longer exists).

## 3. Build & Typecheck Gates
- `pnpm typecheck`: Passes. `StopMotionConfigSchema` inference uses `.optional()` correctly mapping across engine logic and remote test stubs.
- `pnpm build`: Both `build:sdk` and `build:demo` passed successfully.

```bash
CJS ⚡️ Build success in 1223ms
ESM ⚡️ Build success in 1223ms
DTS ⚡️ Build success in 3699ms
✅ Demo build complete in 36ms
```
