# Turbo Mode — Acceptance Checklist

Use this list to verify Turbo integration and SDK behavior.

---

## 1. Toggle and persistence

- [ ] **Toggle persists across refresh**  
  Turn Turbo ON, refresh the page. Turbo button still shows "Turbo ON". Start a spin; engine receives `turboMode: true` (e.g. DEV_TURBO_TRACE shows TURBO_STATE true).

- [ ] **Toggle OFF persists**  
  Turn Turbo OFF, refresh. Button shows "Turbo OFF"; spin uses normal path.

---

## 2. Branch logs (engine DEV_TURBO_TRACE)

With `DEV_TURBO_TRACE = true` in `SL-Engine/src/view/reels/reelDebug.ts` (and rebuild/pack engine if Template uses packaged build):

- [ ] **Turbo ON triggers turbo branch logs**  
  Turbo ON, spin. Console shows: `TURBO_STATE { turboMode: true }`, `BRANCH_SELECTED TURBO (beginStoppingSequence)`, `REELS_STOPPED (turbo)`, `BRANCH_SELECTED TURBO (presentWins)`, `applyFinalState called`, `APPLY_FINAL_DONE`, `SPIN_INPUT_UNLOCKED`.

- [ ] **Turbo OFF triggers normal branch logs**  
  Turbo OFF, spin. Console shows: `TURBO_STATE { turboMode: false }`, `REELS_STOPPED (normal)`, `PRESENTATION_START (normal)`, `PRESENTATION_DONE`, `SPIN_INPUT_UNLOCKED`. No `BRANCH_SELECTED TURBO` in beginStoppingSequence or presentWins.

---

## 3. Behavior

- [ ] **Turbo ON: win resolution is instant (timeline skipped)**  
  With a winning spin and Turbo ON, reels snap to final position and win text/highlights appear immediately; no sequential reel stop or win animation timeline.

- [ ] **No crashes, no desync**  
  Multiple spins with Turbo ON and Turbo OFF; no errors. Final reel symbols match outcome (same as normal). Balance/win updates correct.

---

## 4. Build and test

- [ ] **typecheck/build pass**  
  Template: `npm run build` (or equivalent) passes. Engine: build passes if engine was modified (e.g. DEV_TURBO_TRACE).

- [ ] **Tests pass (if Template has them)**  
  Run Template test script if any; no regressions.

---

## 5. Optional (recommended)

- [ ] **5 spins Turbo OFF, 5 spins Turbo ON**  
  Capture console output with DEV_TURBO_TRACE and attach or paste into docs/recon/turbo_mode_2026/ (see 05_RUNTIME_PROOFS_AND_LOGS.md).

- [ ] **Toggle log**  
  When toggling Turbo, console shows `[TURBO] set to true` or `[TURBO] set to false` (implemented in setTurboEnabled).
