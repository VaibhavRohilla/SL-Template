# Turbo Mode — Template Patch Diff

Minimal set of Template edits to wire Turbo: toggle UI, read saved state at startup, pass turboMode into game.spin(), persist on toggle, DEV log.

---

## 1. Files changed

| File | Change |
|------|--------|
| `src/index.html` | Add Turbo toggle button (id="turbo-button"). |
| `src/bootstrap/bootstrap.ts` | Turbo storage helpers, wire spin to pass turboMode, wire turbo button, persist and log on toggle. |

No new dependencies. No changes to win presenter logic or engine. No restructure of Template architecture.

---

## 2. src/index.html

**Added:** One button after the SPIN button.

```html
<button id="turbo-button" type="button" style="pointer-events: auto; margin-left: 8px; padding: 12px 20px; font-size: 14px; font-weight: bold; background: #333; color: #fff; border: 1px solid #666; border-radius: 8px; cursor: pointer;">Turbo OFF</button>
```

- Placed inside the same flex container as the spin button.
- Default label "Turbo OFF"; script updates to "Turbo ON" / "Turbo OFF" from saved state and on click.

---

## 3. src/bootstrap/bootstrap.ts

**Added:**

- **Constants:** `TURBO_STORAGE_KEY = 'slot_turbo_mode'`.
- **getTurboEnabled():** Returns `localStorage.getItem(TURBO_STORAGE_KEY) === 'true'`, default `false` on missing or error.
- **setTurboEnabled(value: boolean):** Sets `localStorage[TURBO_STORAGE_KEY]` to `'true'` or `'false'`; logs `[TURBO] set to true/false` to console.
- **wireTurboButton():** Gets `#turbo-button`, sets initial label from `getTurboEnabled()`, on click toggles via `setTurboEnabled(!getTurboEnabled())` and updates label.

**Modified:**

- **bootstrap():** After `wireSpinButton(game)` call `wireTurboButton()`.
- **wireSpinButton(game):** On spin click, call `const turboMode = getTurboEnabled(); game.spin(undefined, turboMode);` instead of `game.spin()`.

---

## 4. Diff summary (conceptual)

```diff
--- a/src/index.html
+++ b/src/index.html
@@ -174,6 +174,7 @@
         <button id="spin-button" ...>SPIN</button>
+        <button id="turbo-button" ...>Turbo OFF</button>
       </div>

--- a/src/bootstrap/bootstrap.ts
+++ b/src/bootstrap/bootstrap.ts
@@ -14,6 +14,26 @@ import { GameUI } from '../ui/index.js';
 
+const TURBO_STORAGE_KEY = 'slot_turbo_mode';
+
+function getTurboEnabled(): boolean { ... }
+function setTurboEnabled(value: boolean): void { ... }
+
   try {
     await game.start();
     hidePrePixiLoader();
     wireSpinButton(game);
+    wireTurboButton();
     console.log('✅ Game started successfully');
   } catch (error) {
@@ -58,11 +78,25 @@ function wireSpinButton(game: Game): void {
   if (spinBtn && typeof spinBtn.addEventListener === 'function') {
     spinBtn.addEventListener('click', () => {
       if (game.isRunning()) {
-        game.spin();
+        const turboMode = getTurboEnabled();
+        game.spin(undefined, turboMode);
       }
     });
   }
 }
+
+function wireTurboButton(): void { ... }
```

---

## 5. Constraints satisfied

- Do not restructure Template architecture: only bootstrap and one new button.
- Do not touch win presenter logic: no changes in engine or Template win flow.
- Do not add new dependencies: only localStorage and existing DOM/Game API.
- DEV log: `[TURBO] set to true/false` when user toggles (in setTurboEnabled).
