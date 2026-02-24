# Turbo Fast Mode 2026 — Index

Rename current "Turbo" to **Skip Animations**; add **Real Turbo** (animated but faster). All evidence and patches live under this index.

## Recon (evidence)

| Doc | Description |
|-----|-------------|
| [01_MODES_AND_MEANINGS.md](./01_MODES_AND_MEANINGS.md) | Skip Animations vs Real Turbo; existing terms (turboMode, timeScale, etc.) with file:line |
| [02_TIME_OWNERSHIP_MAP.md](./02_TIME_OWNERSHIP_MAP.md) | Where delta time enters; timeScale; stop timing; win presentation timing |
| [03_TURBO_KNOB_TABLE.md](./03_TURBO_KNOB_TABLE.md) | Knob table: safe to scale, risk, evidence |
| [04_RUNTIME_TIMING_PROOFS.md](./04_RUNTIME_TIMING_PROOFS.md) | DEV trace flags; 10-spin timing deltas (normal vs Skip Animations) |
| [05_REAL_TURBO_SPEC.md](./05_REAL_TURBO_SPEC.md) | Production contract for Real Turbo |

## Fixes (implementation)

| Doc | Description |
|-----|-------------|
| [../fixes/turbo_fast_mode_2026/01_RENAME_SKIP_ANIMATIONS.md](../fixes/turbo_fast_mode_2026/01_RENAME_SKIP_ANIMATIONS.md) | Rename Turbo → Skip Animations (UI, storage, semantics) |
| [../fixes/turbo_fast_mode_2026/02_SDK_FAST_TURBO_PATCH.md](../fixes/turbo_fast_mode_2026/02_SDK_FAST_TURBO_PATCH.md) | SDK speed profile + Real Turbo implementation |
| [../fixes/turbo_fast_mode_2026/03_PARITY_GUARDS.md](../fixes/turbo_fast_mode_2026/03_PARITY_GUARDS.md) | Parity guarantees and DEV-only checks |
| [../fixes/turbo_fast_mode_2026/04_ACCEPTANCE.md](../fixes/turbo_fast_mode_2026/04_ACCEPTANCE.md) | Manual acceptance + timing comparison |
