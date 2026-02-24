# Line Win Overlay — Scope Definition

Recon-only. Defines what “Line Win Overlay” means and what is in-scope.

---

## Overlay system components (with evidence)

| Component | Evidence | Present? |
|-----------|----------|-----------|
| **Payline path rendering** | `LineWinVisualizer` draws paths via Pixi `Graphics`: `moveTo`, `lineTo`, `stroke` (SL-Engine `src/view/win/LineWinVisualizer.ts` 68, 174–188, 219–224). No sprite/texture usage. | **Graphics only** (no PNG) |
| **Symbol highlight overlay** | `DefaultWinPresenterStrategy.createWinHighlights` creates `Graphics` quads (roundRect, fill, stroke) per winning position; added to `overlayContainer` (SL-Engine `src/view/win/DefaultWinPresenterStrategy.ts` 396–476). `triggerSymbolWinAnimations` calls `symbol?.onWinStart?.()` for reel symbol feedback (656–661). | **Yes** (Graphics quads + symbol callbacks) |
| **Line labels / line number UI** | `LineWinVisualizer.addLineLabel`: draws circle + `Text` with `lineId.toString()`; Text added to `this.graphics.parent` (SL-Engine `src/view/win/LineWinVisualizer.ts` 281–297). Config: `showLineLabel` / `showLineLabels` (WinPresenterConfig `src/view/win/WinPresenterConfig.ts` 124–125, 399–400). | **Yes** (optional via config) |
| **Direction arrows (LTR/RTL)** | No arrow assets or drawing. Direction is used only to **order points** for path drawing: `direction === 'right-to-left'` reverses points (SL-Engine `src/view/win/LineWinVisualizer.ts` 165–167). | **No** (direction affects path order only) |
| **Total win text** | `DefaultWinPresenterStrategy.showWinCelebration`: creates `Text` with formatted win amount, added to `overlayContainer` (SL-Engine `src/view/win/DefaultWinPresenterStrategy.ts` 512–566). | **Yes** |
| **Per-line win text** | No per-line win amount displayed on the line. Only total win text exists. | **No** |
| **“Show paylines” (idle preview)** | No API to show payline paths **without** a win. Visibility is gated by: (1) `showPaylines` config, and (2) presence of line wins in the outcome. No `showLine(lineId)` / `hideLineOverlay()` for idle preview. | **No** (see payline preview below) |
| **“Show winning line”** | When `winType === 'line'` and `showPaylines` is true, `LineWinVisualizer.visualizeMultipleLineWins(lineWins)` is invoked in normal flow (`presentLineWins`, `presentAllWins`) and in skip path (`applyFinalState` with `instant: true`). | **Yes** |

---

## In-scope for this recon

- **Winning line overlay during win presentation** — Line path + optional line label drawn when outcome has line wins and `showPaylines` is true. **In scope.**
- **Payline preview when player taps paylines (idle)** — No dedicated API. `showPaylines` only affects **win presentation** (show paths for winning lines). There is no “show line N when user taps paylines button” flow in the engine. **Out of scope for current implementation; documented as gap.**

---

## Summary

| Term | Meaning in this codebase |
|------|---------------------------|
| **Line Win Overlay** | The set of visuals shown during win presentation for line wins: (1) payline path (Graphics), (2) optional line number label, (3) symbol highlights (overlay quads + symbol `onWinStart`), (4) total win text, (5) optional dim overlay. |
| **Payline path** | A polyline through symbol centers, defined by `paylinePattern` (row index per reel) or fallback `positions`; drawn by `LineWinVisualizer` with a single `Graphics` object. |
| **Payline preview** | Not implemented. Would require an API to show/hide specific payline paths outside of win presentation (e.g. “show line 1” when user opens paytable). |
