# Modes and Meanings

## Distinct modes (definitions)

### Skip Animations (current “Turbo” — to be renamed)

- **Meaning:** Per-spin runtime boolean that chooses the **onSkipAnimations** path: instant snap + applyFinalState. No reel motion, no win timeline.
- **Evidence:**
  - `SpinFlow.ts:930–936`: when `this.turboMode` is true, `beginStoppingSequence()` calls `this.onSkipAnimations?.(this.pendingResult)` and marks all reels stopped without dispatching `onStopReel`.
  - `SlotScene.ts:852–872`: `onSkipAnimations` callback skips timeline, calls `reelsView.applyStoppedState(baseStage.grid)`, then `winPresenter.applyFinalState(result)`.
  - `SpinFlow.ts:636–638`: when `turboMode` is true, `beginStoppingSequence()` is invoked immediately after result validation (min spin time not waited).
  - `SpinFlow.ts:1391–1396`: in `presentWins()`, when `turboMode` is true, `onSkipAnimations?.(result)` is called instead of `onPresentWins`.

### Real Turbo (to build)

- **Meaning:** Still uses the **normal** path (reels spin and stop in order, win presentation runs) but with **accelerated time budgets**: reel motion and/or presentation run faster (e.g. timeScale on delta, reduced stop delays, shortened win waits).
- **Evidence (where normal path lives):**
  - `SpinFlow.ts:958–972`: normal branch builds `reelStopSequenceState` and calls `processNextReelStop()` to dispatch `onStopReel` per reel.
  - `SpinFlow.ts:839–847`: when not turbo, `onPresentWins(result)` is awaited (playStages + winPresenter.present).
  - `ReelsView.ts:210`: `reel.update(deltaMs * this.timeScale)` — timeScale already exists for reels; currently not set by SlotScene for turbo.

---

## Existing terms (with file:line)

| Term | Location | Meaning |
|------|----------|---------|
| `turboMode` | `SpinFlow.ts:70` (StartSpinOptions), `131` (private), `518`, `533`, `636`, `659`, `779`, `799`, `842`, `858`, `870`, `916`, `930`, `943`, `995`, `1391`, `1491` | When true: skip-animations path (instant). |
| `turboMode` | `SlotScene.ts:434`, `436`, `458` | Passed from spin(bet, turboMode) into startSpin. |
| `timeScale` | `ReelsView.ts:47`, `210`, `218` | Multiplier for reel update delta; `setTimeScale(scale)` exists but is not wired from scene. |
| `timeScale` | `SpinFeelConfig.ts:95` (TurboConfigSchema) | Config: 1–10, default 2 (for “turbo” preset). |
| `spinSpeedPxPerSec` | `SpinFeelConfig.ts:135` | Base reel spin speed (px/s). |
| `minSpinMs` | `SpinFeelConfig.ts:150`; `SpinFlow.ts:885` | Minimum spin duration before stopping; skipped when turboMode (`SpinFlow.ts:869–872`). |
| `stopDelayMs` | `SpinFeelConfig.ts:144–147`, `299–302` (getStopDelay); `SpinFlow.ts:910`, `919`, `1483`, `1494` | Delay between reel stops; from base config (turbo config has `turbo.stopDelayMs` at `SpinFeelConfig.ts:99` but SpinFlow does not use it for the stop sequence). |
| `decelMs` / `bounceMs` | Not present in codebase | N/A (unified stop motion uses `stopMotion.durationMs`). |
| `winDelayMs` | Not a single name | Win timing is in WinPresenterConfig: `singleWinDurationMs`, `betweenWinsDelayMs`, `allWinsDurationMs` — `DefaultWinPresenterStrategy.ts:310`, `328`, `335`, `365`, `387`, `395`. |
| `timelinePlanner` | `SlotScene.ts:234`, `265`, `497`, `581`, `612`, `639`, `648`, `747`, `771`, `805`, `818`, `821`, `858`, `891`, `899`; `DefaultWinPresenterStrategy.ts:44`, `70`, `192`, `313`, `314`, etc. | Orchestrates wait/tween commands; `update(deltaMs)` at `SlotScene.ts:497`; no global speed scale on timeline. |
| `effectiveDeltaMs` | `SpinFlow.ts:452–453` | `turboMode ? deltaMs * 2 : deltaMs` — only used when turboMode (skip path); in skip path the stop sequence is not used. So this scaling currently has no effect on the animated stop sequence (because in turbo we take the instant path). |
| `onSkipAnimations` | `SpinFlow.ts:175`, `254`, `262`, `827`, `935`, `997`, `1396`; `SlotScene.ts:852` | Callback for instant snap + applyFinalState. |
| `applyFinalState` | `SlotScene.ts:868`; `DefaultWinPresenterStrategy.ts:201`; `WinPresenter.ts:113`; `IWinPresenterStrategy.ts:26` | Applies final win visuals without animation. |
| `beginStoppingSequence` | `SpinFlow.ts:892`, `901`, `932` | Starts either turbo (onSkipAnimations) or normal (reel stop sequence) path. |
| `config.turbo` | `SpinFeelConfig.ts:91–102`, `165` | Schema: timeScale, skipWinAnimations, stopDelayMs. Not used by SpinFlow for delays when in “turbo” (current turbo = skip path, so no delays). |

---

## Summary

- **Skip Animations** = current `turboMode: true`: onSkipAnimations path, instant.
- **Real Turbo** = new: normal path + scaled time (reel timeScale, SpinFlow delta scaling, optional turbo stopDelayMs and shorter win timing). No change to math/outcome; presentation only.
