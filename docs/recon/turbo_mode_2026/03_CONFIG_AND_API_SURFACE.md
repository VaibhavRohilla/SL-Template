# Turbo Mode — Config and API Surface

Recon-only. Where Turbo is set, stored, and read. Template usage noted.

---

## 1. Public API to set Turbo

There is **no** Game-level API named `setTurboEnabled`, `setTurbo`, or `toggleTurbo`. Turbo is **per spin** only.

| API | File:Line | Description |
|-----|-----------|-------------|
| **SlotScene.spin(bet?, turboMode)** | `SlotScene.ts` 436, 456–458 | `async spin(bet?: number, turboMode: boolean = false)`. Forwards to `spinFlow.startSpin({ bet: betAmount, turboMode })`. |
| **SlotGameScene.spin(bet?, turboMode)** | `SlotGameScene.ts` 155–156 | Delegates to `this.slotScene.spin(bet, turboMode)`. |
| **SpinFlow.startSpin(options)** | `SpinFlow.ts` 491–532 | `StartSpinOptions { bet, turboMode?, seed?, outcome? }`. `turboMode` stored at 518: `this.turboMode = options.turboMode ?? false`. |
| **SpinFlow.requestQuickStop()** | `SpinFlow.ts` 652–663 | Sets `this.turboMode = true` mid-spin (and `quickStopTriggered`); triggers immediate turbo handling if in STOPPING. |

So the **only** way to set turbo for a spin is to pass `turboMode: true` into `spin(bet, true)` (or `startSpin({ bet, turboMode: true })`). There is no “global turbo on/off” setter on Game/Scene.

---

## 2. Where Turbo is stored

| Store | File:Line | Scope |
|-------|-----------|--------|
| **SpinFlow.turboMode** | `SpinFlow.ts` 131 | Private; set at 518 from `options.turboMode`; reset at 793 in `destroy()`. Per spin (and can be toggled mid-spin via `requestQuickStop()`). |
| **Snapshot** | `SpinFlow.ts` 830–837, 847–853 | `createSnapshot()` / `restoreFromSnapshot()` include `turboMode` for deterministic replay. |

Not stored: Game instance, Strategy, or a global config flag. SlotScene does not keep a “current turbo preference”; it only passes the argument through to `startSpin`.

---

## 3. Per-spin vs persistent state

- **Per-spin:** `turboMode` is set at each `startSpin` from `options.turboMode` (SpinFlow.ts 518). It is not read from any persistent store inside the SDK.
- **Persistent:** The SDK does not persist turbo. If the host (Template) wants “turbo on until user toggles”, it must remember the preference (e.g. localStorage) and pass it into every `spin(bet, turboMode)`.

---

## 4. Config schema (TurboConfig) vs runtime flag

| Item | Defined | Read | Mutated |
|------|---------|------|--------|
| **SpinFeelConfig.turbo** (TurboConfig) | `SpinFeelConfig.ts` 91–102, 164–165 | Preset usage (e.g. defaultSpinFeelPresets.ts 29–31, 81–83, 127–129). **Not** read by SpinFlow for the turbo branch. | N/A (config is immutable at runtime) |
| **StartSpinOptions.turboMode** | `SpinFlow.ts` 68–72 | `SpinFlow.ts` 518, 633, 864, 924, 982, 1379, 1473 | `SpinFlow.ts` 518 (startSpin), 656 (requestQuickStop), 793 (destroy), 852 (restore) |

So: **TurboConfig** is part of spin feel (e.g. turbo preset’s timeScale/stopDelayMs). The **turbo branch** is driven only by the **turboMode** boolean in `startSpin` options.

---

## 5. Whether Template passes or ignores Turbo

| Location | File:Line | Behavior |
|----------|-----------|----------|
| **Bootstrap** | `SL-Template/src/bootstrap/bootstrap.ts` 59–66 | `wireSpinButton`: on click calls `game.spin()` with **no** second argument. |
| **Game.spin** | Engine: `SlotGameScene.ts` 155–156, `SlotScene.ts` 436 | Default for second parameter is `turboMode: boolean = false`. |

So Template **ignores** turbo: it never passes `turboMode`, so every spin uses the default `false`. To support turbo, Template must call `game.spin(bet, true)` when the user has turbo on, and persist that preference (e.g. localStorage) so it can pass it at startup for the next spin.

---

## 6. Summary table

| Question | Answer | Evidence |
|----------|--------|----------|
| Public API to set Turbo? | No setter. Only `spin(bet?, turboMode)` / `startSpin({ turboMode })`. | SlotScene 436, 456–458; SpinFlow 491–532 |
| Where stored? | SpinFlow private `turboMode`; snapshot for replay. | SpinFlow 131, 518, 830–837, 847–853 |
| Per-spin or persistent? | Per-spin (and mid-spin via requestQuickStop). No SDK persistence. | SpinFlow 518, 656 |
| Template passes/ignores? | Ignores: `game.spin()` only, so turbo always false. | Template bootstrap 65 |
