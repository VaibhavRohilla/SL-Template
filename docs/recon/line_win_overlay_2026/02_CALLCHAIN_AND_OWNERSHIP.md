# Line Win Overlay — Callchain and Ownership

Recon-only. Who draws what, where; how overlay is cleared; scene graph placement.

---

## A) Normal win presentation flow (line wins)

| Step | File:Line | Description |
|------|-----------|-------------|
| Spin completes, presentation branch | `SpinFlow.ts` (e.g. 1016, 1078, 1477) | Flow calls `onPresentationStart(result)` when not skip; SlotScene registered this callback. |
| Scene runs normal path | `SlotScene.ts` 902–909 | `onPresentationStart`: `playStages(result)` then `winPresenter.present(result)`. |
| Presenter delegates to strategy | `WinPresenter.ts` 131–137 | `present(result)` sets `presenting = true`, calls `strategy.present(result, this.overlayContainer)`. |
| Strategy aggregates wins, builds lineWins | `DefaultWinPresenterStrategy.ts` 82–201 | Loops `result.stages`, collects `stage.wins`; filters `winType === 'line'` and `config.global.showPaylines`; builds `LineWin[]` from `meta.lineId`, `meta.paylinePattern`, `meta.direction`. |
| Line wins drawn (individual then all) | `DefaultWinPresenterStrategy.ts` 174–191, 384–412 | If `showIndividualWins` and line wins: `presentLineWins(lineWins)` → `getLineWinVisualizer().visualizeMultipleLineWins(lineWins)` (no instant). Then `presentAllWins(winsToPresent, lineWins)` → same visualizer again (animated). |
| Visualizer draws paths | `LineWinVisualizer.ts` 97–112, 118–206 | `visualizeMultipleLineWins`: `this.graphics.clear()`; per win: `drawPaylinePath(pattern, lineId, direction)` or `drawPathFromPositions`; enqueues `DrawLineWinCommand` when not instant. |
| Timeline runs | `DefaultWinPresenterStrategy.ts` 194 | `await this.timelinePlanner.play()`. |
| Cleanup | `DefaultWinPresenterStrategy.ts` 196–200 | `finally`: `this.clear()`, `reelsView.clearAllHighlights()`, `presenting = false`. Strategy `clear()` calls `lineWinVisualizer.clear()` (309–306). |

**Owner of overlay container:** `WinPresenter.overlayContainer` (created in `WinPresenter.ts` 61). Added to scene at `SlotScene.ts` 800: `this.overlayLayer.addChild(this.winPresenter.overlayContainer)`.

**Clearing between wins:** Within a single presentation, `presentSingleWin` / `presentLineWins` call `clearHighlightGraphics()` and `reelsView.clearAllHighlights()` before drawing the next set; `LineWinVisualizer.visualizeMultipleLineWins` clears once at start then draws all lines. Between spins, overlay is cleared at spin start: `SlotScene.ts` 821 `winPresenter.clearVisualEffects()` → strategy `clear()` and `reelsView.clearAllHighlights()`.

---

## B) Skip Animations flow

| Step | File:Line | Description |
|------|-----------|-------------|
| Turbo/skip branch | `SpinFlow.ts` 1016, 1078, 1477 | When skip/turbo path is used, flow calls `onSkipAnimations(result)`. |
| Scene skip handler | `SlotScene.ts` 911–935 | `onSkipAnimations`: (1) `_timelinePlanner.skip()`, (2) apply final grid `reelsView.applyStoppedState(finalStage.grid)` (920–926), (3) if `result.totalWin > 0` then `winPresenter.applyFinalState(result)` (930–931). |
| Apply final state | `WinPresenter.ts` 122–124 | `applyFinalState(result)` → `strategy.applyFinalState(result, this.overlayContainer)`. |
| Strategy: highlights + paylines | `DefaultWinPresenterStrategy.ts` 201–292 | Aggregates `allWins` from `result.stages`; shows win text, creates win highlights, triggers symbol animations; then if `config.global.showPaylines` builds `lineWins` from line wins with `meta.lineId` and calls `getLineWinVisualizer().visualizeMultipleLineWins(lineWins, { instant: true })` (278–281). |
| Line path drawn immediately | `LineWinVisualizer.ts` 97–112, 169–195 | With `instant: true`, `drawPaylinePath(..., immediate)` draws synchronously (moveTo/lineTo/stroke + optional label), no timeline commands. |

**Overlay container:** Same `winPresenter.overlayContainer` on `overlayLayer`. **Clear/reset:** Skip path does not call `clearVisualEffects()` before `applyFinalState`; the previous spin’s overlay was already cleared at **this** spin’s start in `onStartSpinning` (821). So overlay is clean when skip runs. No explicit “clear before draw” inside `applyFinalState`; LineWinVisualizer’s `visualizeMultipleLineWins` does `this.graphics.clear()` at start (99).

---

## C) Real Turbo flow

Real Turbo = same as normal but with scaled time (reel timeScale, optionally shorter stop delays / win timing). No separate code path: the same `onPresentationStart` → `playStages` → `winPresenter.present(result)` is used. Line overlay is drawn by the same strategy and `LineWinVisualizer`; timing is shortened if TweenService/timeScale or config durations are adjusted. Evidence: `docs/recon/turbo_fast_mode_2026/05_REAL_TURBO_SPEC.md` — “When speedProfile === 'turbo' and skipAnimations === false: use normal path (onStopReel sequence, onPresentWins), with scaled delta and optionally reduced stop delays and win timing.”

---

## Ownership and scene graph summary

| Object | Owner | Where placed | Cleared / reset |
|--------|--------|---------------|------------------|
| **overlayContainer** | WinPresenter | SlotScene.overlayLayer (SlotScene.ts 800) | Not destroyed between spins; children cleared via strategy.clear() and clearVisualEffects() |
| **LineWinVisualizer.graphics** | LineWinVisualizer (lazy-created by strategy) | Added to overlayContainer when getLineWinVisualizer() is first used (DefaultWinPresenterStrategy.ts 669, LineWinVisualizer.ts 72) | strategy.clear() → lineWinVisualizer.clear() → graphics.clear() (DefaultWinPresenterStrategy.ts 304–306, LineWinVisualizer.ts 303–305). Note: Line labels (Text) are added to graphics.parent; clear() does not remove them — potential leak/stale labels. |
| **highlightGraphics** | DefaultWinPresenterStrategy | overlayContainer | clearHighlightGraphics() destroys and clears array (634–641) |
| **winTextDisplay** | DefaultWinPresenterStrategy | overlayContainer | clear() destroys and nulls (308–311) |
| **dimOverlay** | DefaultWinPresenterStrategy | overlayContainer (addChildAt 0) | clear() destroys and nulls (313–316) |

**Scene order (bottom to top):** SlotScene.container → gameLayer (reels, optional frame) → overlayLayer (frame if overlay, **winPresenter.overlayContainer**) → uiContainer (SlotScene.ts 369–377, 410, 418).
