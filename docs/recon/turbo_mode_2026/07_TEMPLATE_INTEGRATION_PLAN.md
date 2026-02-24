# Turbo Mode — Template Integration Plan

Phase B. Which SDK API to call, where to apply, persistence, UI, and DEV proof.

---

## 1. SDK API to call

- **Game.spin(bet?, turboMode)**  
  Engine: `SlotGameScene.spin(bet?, turboMode)` → `SlotScene.spin(bet, turboMode)` → `SpinFlow.startSpin({ bet, turboMode })`.  
  So Template must call `game.spin(bet, turboMode)` with the current user preference (e.g. from localStorage).

- There is no `game.setTurboEnabled(bool)`. Turbo is **per spin** only; the host passes it each time.

---

## 2. Where in Template to apply (before first spin)

- **At boot:** Read saved turbo preference (e.g. `localStorage.getItem('turboMode')`). Default to `false` if missing or invalid.
- **When starting a spin:** Use that preference when calling spin. So the place to apply is wherever Template triggers a spin (today: spin button in `wireSpinButton` in `bootstrap.ts`). Pass the current turbo state: `game.spin(undefined, turboEnabled)` or `game.spin(bet, turboEnabled)`.
- **When user toggles:** Update the stored preference and (optionally) use it on the next spin. No need to call any SDK method except the next `game.spin(bet, turboMode)`.

---

## 3. Where to store the preference (localStorage key)

- **Key:** e.g. `slot_turbo_mode` or `template_turbo_enabled`.
- **Value:** `'true'` | `'false'` (string) for simplicity, or JSON boolean.
- **Read:** At bootstrap (or when building UI). Default `false` if key missing or not `'true'`.
- **Write:** When user toggles the turbo control (e.g. button click). Persist immediately so refresh keeps state.

---

## 4. UI/UX: toggle button, indicator, default state

- **Toggle:** Add a Turbo button (e.g. near the spin button). Click toggles turbo on/off. Template already has assets: `button_turbo_spin_off.png`, `button_turbo_spin_on.png`, `icon_turbo_spin_off.png`, `icon_turbo_spin_on.png` (see `assets/main/uiPanels_0_@1x.json`).
- **Indicator:** Button state (on/off) is the indicator. Optional: small label “Turbo” or icon-only.
- **Default state:** Off (`false`) so behavior matches current Template and is safe for certification.

---

## 5. DEV proof logs: show turbo branch selection after toggle

- With `DEV_TURBO_TRACE = true` in the engine (reelDebug.ts), the existing instrumentation logs:
  - `TURBO_STATE { turboMode }` at spin start
  - `BRANCH_SELECTED TURBO` or normal path in beginStoppingSequence and presentWins
- After implementing the toggle and passing `turboMode` into `game.spin()`:
  - Turbo ON → spin → console should show `TURBO_STATE { turboMode: true }` and `BRANCH_SELECTED TURBO`.
  - Turbo OFF → spin → `TURBO_STATE { turboMode: false }` and normal path (no BRANCH_SELECTED TURBO in beginStoppingSequence).
- No additional Template logs required; optional: one line `[TURBO] set to true/false` when user toggles (DEV-only or behind a debug flag).

---

## 6. Summary

| Item | Choice |
|------|--------|
| SDK API | `game.spin(bet?, turboMode)` |
| When to apply | Every spin: pass current turbo preference from Template state. |
| Persistence | localStorage key (e.g. `slot_turbo_mode`), read at boot, write on toggle. |
| UI | Turbo toggle button; optional icon/label; default off. |
| DEV proof | Use existing DEV_TURBO_TRACE logs; optional Template log on toggle. |
