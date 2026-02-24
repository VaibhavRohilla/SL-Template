# Fix: Flaky Stress Test (CI Trust)

## 1.1 Failing Test Identified

- **File path**: `SL-Engine/tests/stress/stress.test.ts` (now renamed; see below)
- **Test name**: `Performance Stress Tests > 20+ Stage Cascade > should handle 20-stage cascade without unbounded growth`
- **Assertion that failed**: `expect(result.performanceReport.frameTime.p95).toBeLessThan(100)`  
  Observed value: e.g. `131.62476800000013` (actual value varies by run and machine).

## Why It Flaked

- **Cause**: The test asserts on **wall-clock frame time** (p95 ms per frame). Frame time depends on:
  - CPU load and scheduling
  - CI runner performance and contention
  - Node/JS event loop timing
- **Result**: Same code can pass locally and fail in CI (or vice versa); the test is **nondeterministic**.

Other tests in the same file also use `frameTime.p95 < 100` or similar time-based thresholds (e.g. FPS stability, turbo comparison), so the whole performance stress suite is environment-sensitive and not suitable for gating CI.

## 1.2 Approach Taken: Quarantine (Exclude from Default Run)

Making the test fully deterministic would require replacing real-time loops with fixed-dt stepping and simulated time, which is a larger refactor. Per instructions, the flaky stress suite was **quarantined** so it does not gate CI:

1. **Rename**  
   `tests/stress/stress.test.ts` → `tests/stress/stress.stress.test.ts`  
   So the file matches the pattern `*.stress.test.ts`.

2. **Vitest config**  
   In `SL-Engine/vitest.config.ts`, add:
   - `exclude: ['**/*.stress.test.ts']`  
   So the default `pnpm test --run` does **not** run any `*.stress.test.ts` file.

3. **Stress-only command**  
   `pnpm test:stress` runs `vitest run --config vitest.stress.config.ts`, which includes only `**/*.stress.test.ts`. So the quarantined suite (including `stress.stress.test.ts`) is runnable locally and is not part of the default gate.

**Outcome**: Default `pnpm test --run` is 100% deterministic and gates CI reliably. Stress tests remain runnable via `pnpm test:stress`.

## 1.3 Verification

- Run `pnpm test --run` (at least twice): all tests pass except those excluded by `*.stress.test.ts`.
- Run `pnpm test:stress`: stress suite (including the 20-stage cascade test) runs.  
See `04_TESTS_AND_GATES.md` for command outputs and summaries.
