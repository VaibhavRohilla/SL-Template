# P1: Full Callchain Map (Spin → Stop → Win)

This document traces the complete execution pipeline from player interaction to final win presentation, focusing on reel lifecycle and motion ownership.

## 1. Spin Initiation & Backend Flow
- **User click** → `SlotGameScene.ts` UI triggers `slotScene.spin()`
- **Scene spin wrapper**
  - **File:** `src/view/scene/SlotScene.ts:436` (`spin()`)
  - Validates bet, deducts balance, notifies UI.
  - Calls `spinFlow.startSpin({ bet, turboMode })`
- **SpinFlow start & lock**
  - **File:** `src/core/flow/SpinFlow.ts:492` (`startSpin()`)
  - Acquires atomic `spinLock`.
  - State transitions: `IDLE` → `SPINNING`.
  - Emits `SPIN_STARTED` and calls view callback `onStartSpinning()`.
- **View Layer reacts (Starts reels)**
  - **File:** `src/view/scene/SlotScene.ts:789` (`onStartSpinning`)
  - Clears `TimelinePlanner`, plays spin start/loop audio.
  - Calls `reelsView.startAllSpinning()`.
  - **File:** `src/view/reels/ReelMechanicClassic.ts:109` (`startSpin()`)
    - Transitions internal reel state to `SPINNING`. Sets `visualOffsetY = 0` and starts update loop.
- **Outcome Receive & Validation (V2)**
  - **File:** `src/core/flow/SpinFlow.ts:551`
  - Awaits `resultSource.getSpinResult()`.
  - Validates via schema and `OutcomeQueue.validateAndEnqueue`.
  - Emits `RESULT_VALIDATED`.

## 2. Stop Sequence Orchestration
- **Min Spin Time Wait**
  - **File:** `src/core/flow/SpinFlow.ts:628` (`waitForMinSpinTime()`)
  - Waits for deterministic `deltaMs` accumulation. Fast-tracked if `turboMode` is active.
- **Stop Sequence Begin**
  - **File:** `src/core/flow/SpinFlow.ts:895` (`beginStoppingSequence()`)
  - State transitions: `SPINNING` → `STOPPING`.
  - Initializes `reelStopSequenceState` based on `getReelStopOrder()` and `getStopDelay()`.
- **Per-Reel Stop Request**
  - **File:** `src/core/flow/SpinFlow.ts:964` (`processNextReelStop()`)
  - Emits `REEL_STOP_REQUESTED`.
  - Calls view callback `onStopReel(reelIndex, symbols)` which calls `reelsView.stopReel()`.

## 3. Reel Stop Execution (ReelMechanicClassic)
- **Stop Request Receive**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:127` (`requestStop()`)
  - Creates `stopPlan` via `ReelStopPlanner`.
- **Normalization (Distance Clamp)**
  - **File:** `src/view/reels/ReelStopPlanner.ts:101` (`calculateSpinDistance()`)
  - Calculates spin distance and clamps it between `minSpinDistance` and `maxSpinDistance` (prevents stop-time explosions).
  - Stop plan contents: `targetPosition`, `finalSymbols`, `spinDistance`.
- **Mechanic Update Loop (Scroll Phase)**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:164` (`update()`)
  - Scrolls reel strip (`rawDistance` clamped by `maxScrollPerFrame`).
  - Checks if `symbolsSpun >= stopPlan.spinDistance` threshold.
- **Threshold Reach & Decel Start**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:222` (`beginStop()`)
  - Transitions reel state to `STOPPING`.
  - **CRITICAL:** Replaces strip with final outcomes via `this.strip.setVisibleSymbols(this.stopPlan.finalSymbols)`.
- **Decel Animation**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:238` (`animateStop()`)
  - Enqueues tween on `animState.y` via TimelinePlanner. Tweens from `-slotHeight * 0.8` to `0` (or `overshootTarget`).
  - Updates `visualOffsetY` every frame.
- **Bounce (Settle) Phase**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:295` (`enqueueBounceAnimation()`)
  - **Condition:** Enqueued only if `bounce.enabled` && `overshootTarget > 0`.
  - Transitions to `BOUNCING`. Tweens `animState.y` back to `0`.
- **Snap-To-Grid Phase**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:322` (`enqueueSnapAnimation()`)
  - Transitions to `SNAPPING`.
  - Hard sets `visualOffsetY = 0` and calls `this.strip.snapToGrid()`.
  - Enqueues Timeline wait command + custom `reelComplete` event.

## 4. Spin Finalization
- **Reel Stopped Emit**
  - **File:** `src/view/reels/ReelMechanicClassic.ts:369` (`completeStop()`)
  - Transitions reel to `IDLE`.
  - Calls `onStopped()`, which percolates back to `reelsView.ts` and `SlotScene.ts`.
- **SlotScene / SpinFlow Callback**
  - **File:** `src/view/scene/SlotScene.ts:840` calls `spinFlow.onReelStopped()`.
  - **File:** `src/core/flow/SpinFlow.ts:679` (`onReelStopped()`)
  - Emits `REEL_STOPPED`.
  - If more reels remain, advances `reelStopSequenceState` and triggers next delay timer.
- **All Reels Stopped**
  - **File:** `src/core/flow/SpinFlow.ts:718`
  - Checks if `stoppedReels.size >= reelCount`.
  - Awaits `onAllReelsStopped()` via `processStagePipeline()`.
  - State transitions: `STOPPING` → `IDLE` (or blocks if wins present).
- **Win Presentation Dependency**
  - **File:** `src/core/flow/SpinFlow.ts:1369` (`presentWins()`)
  - State transitions: `IDLE` (temporarily) → `PRESENTING_WINS`.
  - Triggers cascade removal, win counters, and paylines. Does NOT natively scroll reels unless `stage.reelHeights` or a Megaways plugin mutates layout.
