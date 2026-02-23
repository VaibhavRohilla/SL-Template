# Game scene: only board visible (no background, bet grid, symbols)

## Summary

The game scene was showing only the slot board (golden frame with dark purple center) because of three causes. Fixes are applied in the template and engine.

---

## Root causes

### 1. **Frame drawn on top of reels (no symbols visible)**

**Engine:** The slot frame is rendered on the **overlay** layer, which is **above** the game layer (reels + symbols). The asset `Reel.png` has an **opaque center** (the dark purple area). So the frame was covering the reels and symbols.

**Fix (engine):** Added a `layer` option to `SlotFrameConfig` in `ViewLayerConfig.ts`:

- `layer: 'overlay'` (default) – frame on top of reels. Use when the frame asset has a **transparent** center.
- `layer: 'game'` – frame is drawn **behind** the reels so symbols render on top. Use when the frame asset has an **opaque** center.

**Fix (template):** In `BrandConfig.ts`, set `frameConfig.layer = 'game'` so the existing frame asset no longer hides the reels.

---

### 2. **No visible background**

**Template:** The game scene used a **solid black** background (`type: 'solid'`, `color: 0x000000`). The canvas is also black, so there was no visible “themed” background.

**Fix (template):** In `BrandConfig.ts`, `backgroundConfig` is set to `type: 'image'` with `imageKey: UI_ASSETS.SCENE.BACKGROUND` (`'Background'`), so the scene uses the themed background image from the manifest.

---

### 3. **No bet grid / spin controls**

**Template:** `GameUI` expects DOM elements with ids `balance-value`, `bet-value`, `win-value`, and `spin-button`. `index.html` did not define these, so there was no bet panel or spin button.

**Fix (template):**

- In `index.html`, added a small in-game UI bar with Balance, Bet, Win and a SPIN button, with these ids.
- In `bootstrap.ts`, added `wireSpinButton(game)` so the SPIN button calls `game.spin()` when the game is running.

---

## Files changed

### SL-Engine

- **`src/view/layers/ViewLayerConfig.ts`** – Added `layer: 'overlay' | 'game'` to `SlotFrameConfigSchema`.
- **`src/view/scene/SlotScene.ts`** – When `frame.layer === 'game'`, the frame is created and added to the **game** layer (before reels) so reels and symbols draw on top; when `frame.layer === 'overlay'`, the frame is added to the overlay layer as before.

### SL-Template

- **`src/brand/BrandConfig.ts`** – `backgroundConfig` uses image `Background`; `frameConfig` sets `layer: 'game'`.
- **`src/index.html`** – Added in-game UI bar with `#balance-value`, `#bet-value`, `#win-value`, `#spin-button`.
- **`src/bootstrap/bootstrap.ts`** – Added `wireSpinButton(game)` to connect the SPIN button to `game.spin()`.

---

## Optional: frame with transparent center

If you prefer the frame to sit **on top** of the reels (overlay style), use a frame asset whose **center is transparent** so reels show through. Then set `frameConfig.layer = 'overlay'` (or omit `layer`).
