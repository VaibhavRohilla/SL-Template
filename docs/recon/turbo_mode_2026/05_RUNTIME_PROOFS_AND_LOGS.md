# Turbo Mode — Runtime Proofs and Logs

DEV-only instrumentation. No production logic changes. Logs behind a single flag `DEV_TURBO_TRACE`.

---

## 1. Flag and location

- **Flag:** `DEV_TURBO_TRACE` (boolean). When `true`, log the events below with `performance.now()` where applicable.
- **Defined:** `SL-Engine/src/view/reels/reelDebug.ts` (with other DEV_ flags).

---

## 2. Events to log (with performance.now())

| Event | When | Where to log |
|-------|------|--------------|
| **TURBO_STATE** | At spin start (after turboMode set). Log `turboMode` true/false. | SpinFlow.startSpin, after line 518. |
| **BRANCH_SELECTED** | When choosing skip vs normal. Log "NORMAL" or "TURBO". | SpinFlow.beginStoppingSequence (after 924); SpinFlow.presentWins (after 1379). |
| **REELS_STOPPED** | When all reels are considered stopped (before onAllReelsStopped). | SpinFlow: after marking all reels stopped in beginStoppingSequence (turbo), or in onReelStopped when stoppedReels.size >= reelCount (normal). |
| **PRESENTATION_START** | When win presentation starts (turbo: before applyFinalState; normal: before present). | SlotScene.onSkipAnimations start (turbo); SlotScene.onPresentWins start (normal). Or SpinFlow.presentWins after transition to PRESENTING_WINS. |
| **PRESENTATION_DONE** / **APPLY_FINAL_DONE** | When win presentation is finished. Turbo: after applyFinalState. Normal: after present() resolves. | SlotScene: end of onSkipAnimations (turbo); after winPresenter.present(result) (normal). And in DefaultWinPresenterStrategy.applyFinalState: at end (APPLY_FINAL_DONE). |
| **SPIN_INPUT_UNLOCKED** | When spin lock is released (user can spin again). | SpinFlow.presentWins: after spinLock.release() (1394). |
| **applyFinalState called** | When applyFinalState runs; log winCount, stageCount, containsLineWins (or similar). | DefaultWinPresenterStrategy.applyFinalState: at start, log e.g. allWins.length, result.stages.length, and whether any win has winType === 'line'. |

---

## 3. Instrumentation added (file:line)

- **reelDebug.ts:** Export `DEV_TURBO_TRACE = false`.
- **SpinFlow.ts:** After 518: if DEV_TURBO_TRACE log TURBO_STATE. After 924 (turbo branch): log BRANCH_SELECTED TURBO. In presentWins after 1379: if turbo log BRANCH_SELECTED TURBO. After 1394: log SPIN_INPUT_UNLOCKED. When all reels marked stopped in turbo path (after 931): log REELS_STOPPED. In onReelStopped when stoppedReels.size >= reelCount: log REELS_STOPPED (normal).
- **SlotScene.ts:** Start of onSkipAnimations: log PRESENTATION_START (turbo). End of onSkipAnimations: log APPLY_FINAL_DONE. Before await winPresenter.present: log PRESENTATION_START (normal). After present: log PRESENTATION_DONE.
- **DefaultWinPresenterStrategy.ts:** Start of applyFinalState: log applyFinalState called with winCount, stageCount, containsLineWins.

(Exact line numbers may shift; use the described locations.)

---

## 4. How to run and capture

1. Set `DEV_TURBO_TRACE = true` in `reelDebug.ts` (or via build/env so it’s true in dev only).
2. Run the game (Template or engine harness).
3. **5 spins turbo OFF** (ensure at least one win): click spin 5 times with turbo toggle off. Capture console/log output.
4. **5 spins turbo ON** (ensure at least one win): turn turbo on, spin 5 times. Capture console/log output.
5. Attach the logs to this recon (or paste into 05 or a separate file under docs/recon/turbo_mode_2026/).

---

## 5. Expected pattern

- **Turbo OFF:** TURBO_STATE false → BRANCH_SELECTED NORMAL (beginStoppingSequence and presentWins) → REELS_STOPPED after last onReelStopped → PRESENTATION_START → PRESENTATION_DONE → SPIN_INPUT_UNLOCKED.
- **Turbo ON:** TURBO_STATE true → BRANCH_SELECTED TURBO → REELS_STOPPED (same tick as branch) → PRESENTATION_START → applyFinalState called (winCount, stageCount, containsLineWins) → APPLY_FINAL_DONE → SPIN_INPUT_UNLOCKED.

No refactors or flow changes — logs only.
