# P2: Reel Lifecycle Phases & State Machine

This document details the nested state machines that orchestrate a single spin, ensuring legal execution overlap and preventing illegal states.

## 1. SpinFlow Phases (Global Frame)
The `SpinFlow` object manages the global lifecycle via `SlotStateMachine.ts`.
States and valid transitions:
*   **`IDLE`**: Awaiting spin request. Transitions to `SPINNING` (or `ERROR`).
*   **`SPINNING`**: Spin requested and outcome pending/validating. Reels begin to spin. Transitions to `STOPPING` (on min-spin time reached or turbo request) or `ERROR`.
*   **`STOPPING`**: Timeline is driving the sequential reel stop. Transitions to `PRESENTING_WINS`, `IDLE` (if no wins), or `ERROR`.
*   **`PRESENTING_WINS`**: Win choreographies active. Transitions to `FEATURE_ACTIVE` (if feature triggered), `IDLE`, or `ERROR`.

**Rules:** 
- A new spin cannot be initiated unless the machine is strictly in `IDLE`.
- Engine utilizes atomic `spinLock` that acquires at `SPINNING` and releases at `IDLE`.

## 2. ReelMechanicClassic Phases (Per-Reel Frame)
Each individual reel strip maintains an internal `ReelState` during its spin loop (`src/view/reels/ReelMechanicClassic.ts`).
*   **`IDLE`**: Reel is stationary.
    *   *Exit Condition:* `startSpin()` is called.
*   **`SPINNING`**: Continuous vertical scroll. Update loop manipulates `strip.scroll()`.
    *   *Exit Condition:* `requestStop()` is received AND the required `spinDistance` buffer is consumed.
*   **`STOPPING`**: Reel is decelerating. Final symbols have been fetched. `yOffset` is detached from scroll distance and driven by a decel Tween.
    *   *Exit Condition:* Decel tween hits `overshootTarget`.
*   **`BOUNCING`**: (Optional) Overshoot recovery tween is playing.
    *   *Exit Condition:* Bounce tween hits 0.
*   **`SNAPPING`**: Final micro-adjustment. Pixel-perfect `snapToGrid()` is invoked.
    *   *Exit Condition:* Snap wait period expires. Transitions back to `IDLE` and emits `onStopped()`.

**Illegal Overlaps:**
- `requestStop()` is ignored if not `SPINNING`.
- Update loop scroll (`strip.scroll()`) is bypassed unless the state is strictly `SPINNING`.

## 3. ReelSymbolStrip Invariants
The underlying visual presenter (`src/view/reels/ReelSymbolStrip.ts`) enforces strict coordinate decoupling:
*   **`stripPosition`**: Logical index in the `strip` array representing the top-most position.
*   **`yOffset`**: Scroll delta mapped to `[0, slotHeight)`. Driven entirely by `scroll()` during the `SPINNING` phase. Reset to 0 when snapping or forcefully setting stopping symbols.
*   **`visualOffset`**: Abstract secondary translation value used exclusively during `STOPPING` / `BOUNCING` / `SNAPPING` to create visual juice (decel/bounce) *without* modifying logical `stripPosition` or `yOffset`.

**Invariant Rule:**
`visualOffsetY` and `yOffset` are aggregated at render time.
The calculation is strictly: `startY = -bufferRows * slotHeight + yOffset + visualOffset`.
