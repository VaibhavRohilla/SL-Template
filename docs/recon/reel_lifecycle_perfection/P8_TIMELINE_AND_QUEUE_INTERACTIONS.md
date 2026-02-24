# P8: Timeline & CommandQueue Interactions

This document verifies the choreography mechanisms between the async Timeline API and the synchronous Frame Loop driver to rule out race conditions or skipped executions.

## 1. Interaction Model
The engine relies on a dual-state architecture:
1. **Queueing Phase:** `ReelMechanicClassic` creates independent logic trees (e.g. `enqueueBounceAnimation()`) and pushes them to `TimelinePlanner.ts`. It does not execute them immediately.
2. **Drive Phase:** Every tick, the SlotScene invokes `TimelinePlanner.update(deltaMs)`, which delegates to `CommandQueue.update(deltaMs)`.

Because the visual logic executes *inside* the main PIXI ticker loop synchronously, it is physically impossible for a Tween to fire before the Reel Update computes its logical bounds, provided they share the same Ticker instance.

## 2. Parallel vs Sequential Execution
*   `enqueue(Command)` strictly waits for the previous `Command` state to finish.
*   `enqueueParallel(Command[])` executes an array of commands simultaneously.
*   **Race Preventative:** `CommandQueue.ts` strictly evaluates one command or one parallel group per `update()` phase. If a Sequential Command completes during an update tick, the next command in the queue is NOT immediately executed in that same tick. Instead, `CommandQueue` returns and waits for the next tick. This guarantees identical frame execution counts regardless of machine speed, ensuring structural determinism.

## 3. Play Promise Resolution & The Idle Threshold
`TimelinePlanner.ts` manages an async `play()` promise.
Because new commands might be dynamically added mid-stop (e.g. Bounce only enqueued *after* Decel completes), the `CommandQueue` might temporarily read as empty during transition frames.
*   **The Guard:** `TimelinePlanner` tracks `idleTime` via `this.idleTime += deltaMs;`.
*   **The Threshold:** `IDLE_THRESHOLD_MS` is set to 5000ms. The `play()` promise ONLY resolves if the queue is empty AND no new commands have been enqueued for 5 solid seconds. This massively padded timeout prevents premature `onAllReelsStopped` triggers if a complex animation takes a few frames to chain its next step.

## 4. Skip & Cancellation Liveness
During turbo mode or manual skips, `skipRequested = true` is flagged.
*   `CommandQueue.skip()` forces `cmd.skip()` on every single command currently pending.
*   **Liveness Fix:** After skip execution, the engine asserts `this.sequentialQueue.length = 0` instantly. This allows `TimelinePlanner.skip()` to immediately see `getPendingCount() === 0` and synchronously resolve the pending `play()` promise.
*   There are no orphaned promises. If an async script fails inside `cmd.execute()`, `CommandQueue` specifically pushes it into an `executeErrors` array and throws it linearly on the *next* update tick instead of silently swallowing the unhandled rejection.

**Verdict:** TIMELINE/QUEUE ARCHITECTURE IS ROBUST AND RACE-FREE. Determinism is strictly maintained by enforcing frame-aligned boundaries between sequential chained animations.
