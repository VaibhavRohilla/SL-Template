# Tests and Gates

## Commands Run

| Command | Result | Notes |
|--------|--------|--------|
| `pnpm typecheck` | Pass | No type errors. |
| `pnpm test --run` | Pass | 101 test files, 1014 tests. All deterministic; no stress suite in default run. |
| `pnpm build` | Pass | SDK (tsup) and demo build succeed. |

## Summary of Outputs

### typecheck
```
> tsc --noEmit
```
Exit code: 0.

### test (default run)
- **Scope**: All `*.test.ts` / `*.spec.ts` **except** `**/*.stress.test.ts`.
- **Result**: Test Files 101 passed (101), Tests 1014 passed (1014).
- **Run twice**: Both runs passed; default suite is deterministic.

### test:stress (optional)
- **Command**: `pnpm test:stress` (runs `vitest run --config vitest.stress.config.ts`).
- **Scope**: Only `**/*.stress.test.ts` (e.g. `tests/stress/stress.stress.test.ts`). Uses `vitest.stress.config.ts` so the quarantined suite runs without being part of the default gate.
- **Note**: Stress tests are not run by `pnpm test --run` and do not gate CI. Run locally when validating performance/load.

### build
- **build:sdk**: tsup → `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` (and variants).
- **build:demo**: `dist-app/index.js` produced.
- Exit code: 0.

## Stress Test Scope (Non-Gating)

- **File**: `SL-Engine/tests/stress/stress.stress.test.ts` (renamed from `stress.test.ts`).
- **Excluded from default**: Vitest config has `exclude: ['**/*.stress.test.ts']`, so this file is not run by `pnpm test --run`.
- **Included in** `pnpm test:stress`: The script runs vitest with `vitest.stress.config.ts`, which includes only `**/*.stress.test.ts`, so the quarantined performance stress tests run.

## Evidence

- **Typecheck**: Run in SL-Engine root; completes with exit 0.
- **Test**: Two full `pnpm test --run` runs completed; 101 files, 1014 tests passed each time.
- **Build**: `pnpm build` (sdk + demo) completed successfully.
