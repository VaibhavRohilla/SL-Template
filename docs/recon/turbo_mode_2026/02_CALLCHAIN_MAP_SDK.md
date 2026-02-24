# Turbo Mode — Full Callchain Map (SDK)

Recon-only. Exact runtime chain with file:line evidence.

---

## 1. Where Turbo is read (boolean source of truth)

| Location | File:Line | What |
|----------|-----------|------|
| Stored | `SpinFlow.ts` 131 | `private turboMode: boolean = false` |
| Set at spin start | `SpinFlow.ts` 518 | `this.turboMode = options.turboMode ?? false` |
| Read (branch) | `SpinFlow.ts` 633, 864, 924, 982, 1379 | `if (this.turboMode)` |
| Exposed | `SpinFlow.ts` 774–775 | `isTurboMode(): boolean` returns `this.turboMode` |
| Snapshot/restore | `SpinFlow.ts` 836, 852 | `createSnapshot` / `restoreFromSnapshot` include `turboMode` |

---

## 2. Where the branch happens (turbo vs normal)

| Branch point | File:Line | Condition | Turbo path | Normal path |
|--------------|-----------|-----------|------------|-------------|
| After result validated | `SpinFlow.ts` 630–635 | `if (this.turboMode)` | `beginStoppingSequence()` immediately | `waitForMinSpinTime()` then later `checkMinSpinTimeThreshold()` → `beginStoppingSequence()` |
| Inside beginStoppingSequence | `SpinFlow.ts` 924–943 | `if (this.turboMode)` | `onSkipAnimations(pendingResult)`; mark all reels stopped; `onAllReelsStopped()`; return | Init `reelStopSequenceState`, `processNextReelStop()` |
| Inside processNextReelStop | `SpinFlow.ts` 982–1010 | `if (this.turboMode)` | Same: `onSkipAnimations`, mark all reels, `onAllReelsStopped()` | Request stop for current reel via `onStopReel?.(currentReelIndex, reelSymbols)` |
| presentWins | `SpinFlow.ts` 1379–1383 | `if (this.turboMode)` | `onSkipAnimations(result)` | `await this.onPresentWins(result)` |
| checkMinSpinTimeThreshold | `SpinFlow.ts` 864–866 | `if (this.turboMode) return` | Never waits for min spin | Accumulates `spinElapsedMs`, calls `beginStoppingSequence()` when threshold met |

---

## 3. Turbo path vs normal path (what gets called)

### Turbo path (skip)

```
SpinFlow.startSpin({ turboMode: true })
  → SpinFlow.ts 518: turboMode = true
  → SpinFlow.ts 633–634: beginStoppingSequence() immediately (no min spin wait)
  → SpinFlow.ts 924–926: onSkipAnimations(this.pendingResult)
  → SlotScene.ts 846–861: onSkipAnimations(result)
       → SlotScene.ts 850: this._timelinePlanner.skip()
       → SlotScene.ts 853–855: reelsView.applyStoppedState(baseStage.grid)   [baseStage = result.stages[0]]
       → SlotScene.ts 858–860: if result.totalWin > 0 → winPresenter.applyFinalState(result)
  → SpinFlow.ts 928–931: mark all reels stopped, emit REEL_STOPPED for each
  → SpinFlow.ts 936: onAllReelsStopped()
  → ... stage pipeline ...
  → SpinFlow.ts 1082: presentWins(finalResult)
  → SpinFlow.ts 1379–1381: turboMode → onSkipAnimations(result) again (presentWins branch)
  → SpinFlow.ts 1390–1395: WIN_PRESENTATION_COMPLETE, IDLE, spinLock.release(), onSpinComplete
```

- **Reel motion:** No per-reel `onStopReel`; reels are snapped via `applyStoppedState` (ReelsView.ts 194–203).
- **Win presenter:** `applyFinalState` only (DefaultWinPresenterStrategy.ts 200–241). No `present()`, no timeline.
- **Timeline:** `timelinePlanner.skip()` (SlotScene.ts 850).

### Normal path

```
SpinFlow.startSpin({ turboMode: false })
  → waitForMinSpinTime(); checkMinSpinTimeThreshold() → beginStoppingSequence()
  → SpinFlow.ts 946–958: reelStopSequenceState set, processNextReelStop()
  → processNextReelStop() → onStopReel?(currentReelIndex, reelSymbols)   [SlotScene 825–837 → reelsView.stopReel]
  → onReelStopped(reelIndex) → advance order, next reel or onAllReelsStopped()
  → onAllReelsStopped() → processStagePipeline → presentWins(finalResult)
  → SpinFlow.ts 1382–1383: onPresentWins(result)
  → SlotScene.ts 839–845: await playStages(result); await winPresenter.present(result)
  → SpinFlow.ts 1390–1395: WIN_PRESENTATION_COMPLETE, IDLE, release, onSpinComplete
```

- **Reel motion:** Sequential `onStopReel` per reel; ReelsView/ReelMechanic animate stop.
- **Win presenter:** `playStages` then `winPresenter.present(result)` (timeline-based).
- **Timeline:** Used for win presentation and feature commands.

---

## 4. Does Turbo affect reel motion, stop sequencing, win presenter, timeline, highlight layers?

| Component | Affected? | Evidence |
|-----------|-----------|----------|
| **Reel motion** | Yes | Turbo skips per-reel stop; `applyStoppedState` snaps all reels (ReelsView.ts 194–203). Normal path uses `stopReel` and mechanic animation. |
| **Stop sequencing** | Yes | Turbo: no delays, no `onStopReel` sequence; all reels marked stopped at once (SpinFlow.ts 928–931). Normal: `reelStopSequenceState` and `getStopDelay` (SpinFlow.ts 703). |
| **Win presenter** | Yes | Turbo: `applyFinalState` only (SlotScene 858–860, DefaultWinPresenterStrategy 200–241). Normal: `present()` with timeline (DefaultWinPresenterStrategy 71–198). |
| **Timeline planner** | Yes | Turbo: `timelinePlanner.skip()` (SlotScene 850). Normal: timeline runs for win/feature commands. |
| **Highlight layers** | Partial | Both paths can show symbol highlights and win text. Turbo does **not** call `LineWinVisualizer.visualizeMultipleLineWins` in `applyFinalState` (see 04_PRESENTATION_PARITY_AUDIT). |

---

## 5. Flow diagram (concise)

```
startSpin({ turboMode })
  → turboMode ? beginStoppingSequence() immediately : waitForMinSpinTime() → beginStoppingSequence()
  → beginStoppingSequence():
       turboMode ? onSkipAnimations + mark all stopped + onAllReelsStopped()
               : processNextReelStop() [→ onStopReel → onReelStopped → … → onAllReelsStopped]
  → onAllReelsStopped() → processStagePipeline() → presentWins(finalResult)
  → presentWins():
       turboMode ? onSkipAnimations(result)  [skip path]
               : await onPresentWins(result) [playStages + winPresenter.present]
  → IDLE, release, onSpinComplete
```

All branch decisions are in **SpinFlow**; **SlotScene** only provides the callbacks and implements `onSkipAnimations` / `onPresentWins`.
