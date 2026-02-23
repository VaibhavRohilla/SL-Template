# SDK-Only Template Guide

Welcome to the **SL-Template**. This template has been refactored to be a lightweight, SDK-only framework for building slot games with `@fnx/sl-engine`.

## Architectural Philosophy
**The defining rule**: The Template relies entirely on the SDK to handle all game logic, outcomes, spins, and engine behavior. The Template is exclusively a thin wrapper that bootstraps the game with your desired branding, visual layers, and static configuration.

### What the Template Owns
The template is effectively just a configuration and visualization layer:
- **Branding & Config:** `src/brand/BrandConfig.ts` — boot config (for the engine’s LoadingScene and StartScene), game background/frame, dimensions. Asset keys via `src/ui/reference/AssetMap.ts`.
- **Config & Feel:** `src/config/slotConfig.ts` and `src/brand/SpinFeel.ts` — layout, paytables, reels, reel timings. Symbol `spriteKey`s must exist in the manifest (game scene assets).
- **Bootstrap & UI:** `src/bootstrap/bootstrap.ts` wires the engine; `src/ui/GameUI.ts` implements balance/bet/win (ISlotUI, IWinFormatter).
- **Scenes:** The template does **not** provide custom loading or start scenes. The engine uses its built-in **LoadingScene** and **StartScene** (driven by `bootConfig`) and **SlotGameScene** for the game (driven by `slotConfig`, `backgroundConfig`, `frameConfig`).

### What the SDK Owns
The `@fnx/sl-engine` handles all heavy lifting:
- **Spin Flows & Backend Communication:** The SDK triggers spins and handles backend integration natively using adapters.
- **Outcomes & Sequences:** Core stepping evaluation, win handling, stopping protocols (e.g., slamming, turbo modes), win presentation logic, and animations that depend on the slot reels.
- **State Recovery:** Rehydration after page reload and interrupted game flows.

## What Not To Do
- **NO backend integrations.** There is exactly zero code in this template that directly talks to a backend or parses `TSpinResponse`. That's handled via the SDK's pluggable adapter registry.
- **NO outcome processing.** Do not intercept spins or process outcomes in custom code unless doing purely visual effects decoupled from game state progression.
- **NO duplicate engine structures.** Do not implement your own CustomGameScene logic just to handle STOP/TURBO states—configure it via the game policy instead.

## Where to Change Things

- **Visual Theme & Colors:** Edit `src/brand/BrandConfig.ts` — backgrounds, logo asset key and position (bootConfig), game scene background and frame.
- **Paytables, Grid, Symbols:** Modify `src/config/slotConfig.ts`. Symbol `spriteKey`s must match manifest keys (game scene reels).
- **Spin/Reel Feels:** Adjust `src/brand/SpinFeel.ts` for reel timings and spin feel.
- **Asset Pipeline:** Run `pnpm assets:build` and `pnpm assets:check` so all referenced keys exist in the manifest.
