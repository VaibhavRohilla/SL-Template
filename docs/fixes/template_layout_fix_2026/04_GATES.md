# 04 — Gate Results

**Date:** 2026-02-23

---

## SL-Engine Gates

### Typecheck ✅
```
> @fnx/sl-engine@1.5.2 typecheck
> tsc --noEmit

(no output — clean)
```

### Lint ✅
```
> @fnx/sl-engine@1.5.2 lint
> pnpm eslint src

(no output — clean)
```

### Tests ✅
```
Test Files  97 passed (97)
     Tests  972 passed (972)
   Duration  9.42s
```

All 972 tests pass, including stress tests.

### Build ✅
```
> @fnx/sl-engine@1.5.2 build:sdk
> tsup

ESM dist/index.js     235.54 KB
CJS dist/index.cjs    237.64 KB
DTS dist/index.d.ts   458.34 KB
⚡️ Build success
```

---

## SL-Template Gates

### Typecheck ✅
```
> slot-game-template@1.0.0 typecheck
> tsc --noEmit

(no output — clean)
```

### Lint ✅
```
> slot-game-template@1.0.0 lint
> eslint src --ext .ts

src/Asset.d.ts
  127:38  warning  'spriteKey' is defined but never used  @typescript-eslint/no-unused-vars
  127:70  warning  'clipKey' is defined but never used     @typescript-eslint/no-unused-vars

✖ 2 problems (0 errors, 2 warnings)
```

**Verdict:** 0 errors, 2 pre-existing warnings in `Asset.d.ts` (unrelated).

### Tests ✅
```
> slot-game-template@1.0.0 test:run
> vitest run --passWithNoTests

No test files found, exiting with code 0
```

### Build ✅
```
> slot-game-template@1.0.0 build
> node scripts/build.js

dist/main.js      1.0mb
dist/main.js.map  4.8mb
⚡ Done in 252ms
✅ Build complete: dist/
```

---

## Summary

| Gate | Engine | Template |
|------|--------|----------|
| Typecheck | ✅ | ✅ |
| Lint | ✅ | ✅ (0 errors, 2 pre-existing warnings) |
| Tests | ✅ 972/972 | ✅ (no test files) |
| Build | ✅ | ✅ |
