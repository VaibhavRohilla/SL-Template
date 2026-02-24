# Turbo Mode 2026 — Executive Summary

**Role:** Principal Slot SDK Auditor (regulator/certification mindset)  
**Goal:** Prove Turbo mode behavior is correct in SDK, then wire Template to use it safely.

---

## Outcome

- **Phase A (recon):** Completed. Turbo is **per-spin boolean** (`turboMode` in `startSpin`). When true: min spin time is skipped, `beginStoppingSequence()` runs immediately, and the flow takes the **skip path** (`onSkipAnimations`) instead of sequential reel stops and win timeline. Outcome authority is unchanged; only time/presentation differs.
- **Phase B (Template):** Integration plan and minimal patch defined. Template currently calls `game.spin()` with no second argument (turbo defaults to `false`). Patch adds a Turbo toggle, persistence, and passes `turboMode` into `game.spin(bet, turboMode)`.

---

## Findings (high level)

| Area | Finding |
|------|--------|
| **Turbo definition** | Shortens spin (skips min spin time), skips win sequencing (no timeline), bypasses reel stop animation sequence (snap via `applyStoppedState`). Does **not** change outcome or final grid. |
| **Outcome authority** | Unchanged. Same `result` from backend; turbo only changes how/when reels and wins are shown. |
| **Presentation parity** | **GAP:** `applyFinalState` does **not** call `LineWinVisualizer.visualizeMultipleLineWins` — payline paths are not drawn in turbo/skip. Symbol highlights and win text are applied. |
| **API surface** | No `setTurboEnabled` on Game. Turbo is **per spin**: `SlotScene.spin(bet?, turboMode)` → `SpinFlow.startSpin({ bet, turboMode })`. |
| **Template** | Ignores turbo: `game.spin()` only; no toggle, no persistence. |

---

## Deliverables

| # | Document | Content |
|---|----------|--------|
| 00 | **00_EXEC_SUMMARY.md** | This summary |
| 01 | **01_TURBO_DEFINITION_AND_CONTRACT.md** | What Turbo does/does not do; invariants; file:line evidence |
| 02 | **02_CALLCHAIN_MAP_SDK.md** | Full turbo vs normal callchain with file:line |
| 03 | **03_CONFIG_AND_API_SURFACE.md** | Where turbo is set/read; per-spin vs config |
| 04 | **04_PRESENTATION_PARITY_AUDIT.md** | Table: feature parity (FULL/PARTIAL/NONE) and GAPs |
| 05 | **05_RUNTIME_PROOFS_AND_LOGS.md** | DEV_TURBO_TRACE instrumentation and how to run/capture logs |
| 06 | **06_RISK_RANKING_AND_GAPS.md** | Ranked risks and recommended fixes |
| 07 | **07_TEMPLATE_INTEGRATION_PLAN.md** | SDK API to call; where to apply; persistence; UI |
| 08 | **08_TEMPLATE_PATCH_DIFF.md** | Minimal Template edits (toggle, persist, pass turboMode) |
| 09 | **09_ACCEPTANCE_CHECKLIST.md** | Toggle persists; branch logs; no desync; build/test pass |

---

## Stop condition

All 10 deliverables exist. Phase A recon is complete; Phase B minimal Template integration is specified and implemented in 08.
