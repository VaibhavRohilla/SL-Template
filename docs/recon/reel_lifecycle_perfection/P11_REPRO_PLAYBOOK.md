# P11: Repro Playbook

If a visual artifact (snapback, teleporting, or stall) is observed on reels in the field, follow this playbook to immediately diagnose if it's an engine issue or an implementer issue.

## Issue 1: Reels Snap/Jerk wildly when stopping
**Diagnostics:**
1. Open `src/view/reels/reelDebug.ts`.
2. Toggle `DEV_REEL_POSTSTOP_GUARD = true`.
3. Open Developer Tools console and run the spin.
4. **If error logs `[DEV_REEL_POSTSTOP_GUARD] POST_STOP_MUTATION`**: A plugin or rogue tween is mutating the container after `IDLE`. Look at the stack trace to find the stray tween.
5. **No error logged**: Check your `SpinFeelConfig`. Is your `bounce.amplitudePx` excessively high relative to the `slotHeight`?

## Issue 2: Symbols Double-Apply (Grid flashes symbols twice)
**Diagnostics:**
1. Toggle `DEV_REEL_POSTSTOP_GUARD = true`.
2. Observe the Console.
3. If `[DEV_REEL_POSTSTOP_GUARD] setVisibleSymbols called` prints multiple times per reel stop (e.g. 2 times for reel 0), you have a double-apply bug.
4. Check the attached stack trace on the second print. It will point exactly to the class calling it inappropriately (usually a custom Feature Plugin attempting to "fix" a grid display).

## Issue 3: Reels stall and game locks up indefinitely
**Diagnostics:**
1. The `SpinFlow` state machine is blocked awaiting the Timeline promise.
2. In `SlotScene.ts`, log the `TimelinePlanner.getPendingCount()`.
3. If pending is stuck $> 0$, an async `ITimelineCommand` failed to call `resolve()` upon completion (like a missing sound file in `AudioCommand`).
4. Look for uncaught Promise rejections in console.

## Issue 4: Frame rate chugs / garbage collection spikes during spins
**Diagnostics:**
1. Open `src/view/reels/reelDebug.ts`.
2. Toggle `DEV_ALLOCATION_AUDIT = true`.
3. Run a spin. You should see 15-20 `Symbol CREATED (miss)` lines on Boot, and ONLY `Symbol REUSED (hit)` lines for every subsequent spin. 
4. If you see hundreds of `Symbol CREATED` per spin, the `SymbolPool.release()` logic is being sidestepped by custom logic, starving the pool.
