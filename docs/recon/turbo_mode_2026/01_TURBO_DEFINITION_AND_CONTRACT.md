# Turbo Mode — Definition and Contract

Recon-only. Every claim includes file path and line ranges. Inferences are labeled **INFERENCE**.

---

## 1. What Turbo is intended to do

| Intended behavior | Evidence | Verdict |
|-------------------|----------|--------|
| **Shorten spin** | `SpinFlow.ts` 630–635: In turbo mode, `beginStoppingSequence()` is called immediately after result validation; no wait for min spin time. `SpinFlow.ts` 864–866: `checkMinSpinTimeThreshold()` returns early if `this.turboMode`. | **YES** — min spin time is skipped. |
| **Skip win sequencing** | `SpinFlow.ts` 1379–1381: In `presentWins()`, if `this.turboMode` the code calls `this.onSkipAnimations?.(result)` instead of `await this.onPresentWins(result)`. `SlotScene.ts` 846–861: `onSkipAnimations` calls `timelinePlanner.skip()`, `reelsView.applyStoppedState(baseStage.grid)`, and `winPresenter.applyFinalState(result)`. | **YES** — win timeline is skipped; final state applied immediately. |
| **Bypass timeline animations** | `SlotScene.ts` 849–850: `this._timelinePlanner.skip()`. `SlotScene.ts` 852–855: `reelsView.applyStoppedState(baseStage.grid)`. | **YES** — timeline skipped; reels snapped to final grid. |
| **Change reel stopping mechanics or only presentation?** | `SpinFlow.ts` 924–932: When `this.turboMode`, no `onStopReel` per reel; instead `onSkipAnimations` once, then all reels marked stopped and `onAllReelsStopped()` triggered. Reel stop *mechanics* (order, delays) are not used in turbo; only the *presentation* path changes (snap vs animate). | **Presentation only** — outcome and final grid come from same `pendingResult`; only the way reels and wins are shown differs. |

---

## 2. What Turbo must NOT do

| Invariant | Evidence | Verdict |
|-----------|----------|--------|
| **Must not break outcome authority** | Outcome is obtained once from `resultSource.getSpinResult(request)` with `turboMode: this.turboMode` in the request (`SpinFlow.ts` 527–532). Same result is used for both turbo and normal; no re-evaluation. `SpinFlow.ts` 1082, 1379–1383: Same `result`/`finalResult` passed to `presentWins` and thence to `onSkipAnimations` or `onPresentWins`. | **SATISFIED** — outcome is backend-authoritative and shared. |
| **Must not desync reels from outcome grid** | `SlotScene.ts` 852–855: `onSkipAnimations` applies `baseStage.grid` from `result.stages[0]` via `reelsView.applyStoppedState(baseStage.grid)`. `ReelsView.ts` 194–203: `applyStoppedState` sets each reel to `reel.setSymbols(symbols)` from that grid. | **SATISFIED** — reels are forced to outcome grid. |
| **Must not bypass mandatory final alignment (snap-to-grid)** | `ReelsView.ts` 194–203: `applyStoppedState` calls `reel.forceStop()` and `reel.setSymbols(symbols)` per reel. So final alignment is applied explicitly in turbo path. | **SATISFIED** — snap is applied via `applyStoppedState`. |

---

## 3. Turbo invariants (contract)

| Invariant | Evidence |
|-----------|----------|
| **Same outcome + config → same final grid** | Same `SpinOutcome` is used; turbo path applies `result.stages[0].grid` via `applyStoppedState`. Normal path ends with reels stopping on the same outcome. So same outcome → same final grid. |
| **Turbo only changes time/presentation, not results** | No code path in turbo that mutates `result` or re-requests outcome. `presentWins`/`onSkipAnimations`/`applyFinalState` only consume `result`. |

---

## 4. Config vs runtime Turbo

- **TurboConfig** in `SpinFeelConfig` (`SpinFeelConfig.ts` 91–102, 164–165): `timeScale`, `skipWinAnimations`, `stopDelayMs`. This is **preset/config** for spin feel (e.g. when using `turboPreset`). It is **not** the same as the runtime **turbo mode flag**.
- **Runtime turbo** is the boolean `turboMode` in `StartSpinOptions` (`SpinFlow.ts` 68–72, 518). When true, the flow takes the skip path; when false, normal path. The SDK does **not** read `config.turbo.timeScale` or `config.turbo.stopDelayMs` when deciding the branch; the branch is purely `this.turboMode` (set from `options.turboMode`).

**INFERENCE:** The schema’s `turbo` block is for “turbo preset” (faster feel when that preset is active). The per-spin `turboMode` flag is what actually selects skip vs normal path. So “Turbo” in this audit means the **per-spin boolean** unless stated otherwise.

---

## 5. Contradictions / callouts

- **None.** The code matches the intended meaning: turbo = skip path, same outcome, same final grid; no outcome or grid logic is bypassed.
