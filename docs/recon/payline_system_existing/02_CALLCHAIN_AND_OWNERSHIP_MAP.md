# Callchain and Ownership Map — Win Presentation and Paylines

Recon only. Maps SpinFlow → SlotScene → WinPresenter → line/highlight ownership.

---

## 1. High-level flow

```
SpinFlow (onAllReelsStopped)
  → has wins? → presentWins(result)
       → if turboMode: onSkipAnimations(result)
       → else: onPresentWins(result)
  ← callbacks set by SlotScene
SlotScene (sets callbacks)
  → onPresentWins: playStages(result) then winPresenter.present(result)
  → onSkipAnimations: timelinePlanner.skip(), reelsView.applyStoppedState(), winPresenter.applyFinalState(result)
WinPresenter
  → strategy.present(result, overlayContainer)  [DefaultWinPresenterStrategy]
DefaultWinPresenterStrategy
  → presentLineWins(lineWins) / presentAllWins(..., lineWins)
  → getLineWinVisualizer().visualizeMultipleLineWins(lineWins)
  → reelsView.highlightPositions(win.positions) (via createWinHighlights + triggerSymbolWinAnimations)
LineWinVisualizer
  → draws into Graphics container (provided container or reelsView.container.parent)
  → DrawPaylinePath / drawPathFromPositions (Graphics API, no PNG sprites)
```

---

## 2. SpinFlow → presentWins

| File | Location | Responsibility |
|------|----------|----------------|
| **SpinFlow.ts** | `presentWins(result)` ~1369 | Transitions to PRESENTING_WINS; if turbo calls `onSkipAnimations(result)`, else calls `await onPresentWins(result)` |
| **SpinFlow.ts** | `onAllReelsStopped` ~1080-1082 | When `hasWins`: `await this.presentWins(finalResult)` |
| **SpinFlow.ts** | setCallbacks | `onPresentWins`, `onSkipAnimations` set by SlotScene |

---

## 3. SlotScene → WinPresenter

| File | Location | Responsibility |
|------|----------|----------------|
| **SlotScene.ts** | setupSpinFlow callbacks ~842-860 | `onPresentWins: async (result) => { await playStages(result); await winPresenter.present(result); }`, `onSkipAnimations: (result) => { timelinePlanner.skip(); reelsView.applyStoppedState(...); winPresenter.applyFinalState(result); }` |
| **SlotScene.ts** | createWinPresenter ~710-751 | Builds WinPresenter, sets `showPaylines: true` when `slotConfig.evaluationMode === 'lines'`, adds `winPresenter.overlayContainer` to **overlayLayer** |
| **SlotScene.ts** | Layer order | container → backgroundView, gameLayer (frame + reelsView), **overlayLayer** (winPresenter.overlayContainer), uiContainer |

---

## 4. WinPresenter → Strategy

| File | Location | Responsibility |
|------|----------|----------------|
| **WinPresenter.ts** | present(result) ~122-129 | Sets presenting, calls `strategy.present(result, this.overlayContainer)` |
| **WinPresenter.ts** | applyFinalState(result) ~112-114 | `strategy.applyFinalState(result, this.overlayContainer)` |
| **WinPresenter.ts** | skip() ~105-106 | `strategy.skip()` (sets skipRequested in DefaultWinPresenterStrategy) |
| **WinPresenter.ts** | overlayContainer | Single Container; added to SlotScene’s overlayLayer |

---

## 5. DefaultWinPresenterStrategy — line wins and highlights

| File | Location | Responsibility |
|------|----------|----------------|
| **DefaultWinPresenterStrategy.ts** | present() ~71-198 | Aggregate allWins from result.stages; split line vs other by winType + meta; if showIndividualWins call presentLineWins(lineWins) then presentSingleWin for each; then presentAllWins(winsToPresent, lineWins); await timelinePlanner.play() |
| **DefaultWinPresenterStrategy.ts** | presentLineWins ~360-389 | getLineWinVisualizer().visualizeMultipleLineWins(lineWins); triggerSymbolWinAnimations; enqueue wait commands |
| **DefaultWinPresenterStrategy.ts** | presentAllWins ~331-358 | clearHighlightGraphics; reelsView.clearAllHighlights(); if showPaylines visualizeMultipleLineWins(lineWins); createWinHighlights(wins); triggerSymbolWinAnimations |
| **DefaultWinPresenterStrategy.ts** | createWinHighlights ~391-424 | Creates Graphics (glow + border) per position, adds to **overlayContainer**, animates pulse |
| **DefaultWinPresenterStrategy.ts** | getLineWinVisualizer ~624-635 | Lazy-creates LineWinVisualizer with **this.overlayContainer** as container |

So: **WinPresenter (via strategy) owns** win text, dim overlay, and **cell highlight Graphics**; **LineWinVisualizer** is given the same overlayContainer and draws line paths there.

---

## 6. LineWinVisualizer — who owns the graphics

| File | Location | Responsibility |
|------|----------|----------------|
| **LineWinVisualizer.ts** | constructor ~50-73 | Creates `new Graphics()`, `graphics.zIndex = 250`; targetContainer = `container ?? reelsView.container.parent`; **targetContainer?.addChild(this.graphics)** |
| **DefaultWinPresenterStrategy.ts** | getLineWinVisualizer ~626-631 | `new LineWinVisualizer(..., this.overlayContainer)` → line graphics live in **WinPresenter’s overlayContainer** |
| **LineWinVisualizer.ts** | drawPaylinePath / drawPathFromPositions | Uses Graphics (lines, moveTo, lineTo); no Sprite/Texture (no PNG) |

So: **Line visuals are owned by the same overlay container as win highlights** (WinPresenter.overlayContainer), which is on SlotScene’s overlayLayer. No separate “line layer” container; one overlay holds both highlight quads and line paths.

---

## 7. ReelsView — symbol highlight

| File | Location | Responsibility |
|------|----------|----------------|
| **ReelsView.ts** | highlightPositions(positions) ~241-246 | For each position calls `reels[pos.reel]?.highlightSymbol(pos.row)` |
| **ReelsView.ts** | clearAllHighlights ~250-252 | Each reel.clearAllHighlights() |
| **ReelView.ts** | highlightSymbol(row), clearAllHighlights ~198, 214 | Per-reel symbol highlight state (implementation in ReelView) |

So: **ReelsView/ReelView** own **symbol-level** highlight (on the reels); **WinPresenter strategy** owns **overlay** highlight (Graphics quads) and **line path** (via LineWinVisualizer on overlayContainer).

---

## 8. Ownership summary

| Visual | Owner | Container / layer |
|--------|--------|-------------------|
| Reel symbols | ReelsView / ReelView | gameLayer (reelsView.container) |
| Symbol highlight (e.g. glow on symbol) | ReelView | Per-reel |
| Win overlay (quad glow per cell, win text, dim) | DefaultWinPresenterStrategy | WinPresenter.overlayContainer |
| Line path (payline Graphics) | LineWinVisualizer | WinPresenter.overlayContainer (same as above) |
| WinPresenter.overlayContainer | SlotScene | overlayLayer (above gameLayer) |

**Dedicated line overlay:** There is no separate container just for “lines”; line drawing uses the same overlay container as win highlights, above reels.
