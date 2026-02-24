# Rendering Pipeline Findings — Paylines and Highlights

Recon only. Where paylines and win highlights are drawn and how they interact with the pipeline.

---

## 1. Payline / line rendering

| Component | File | Method | Technique | PNG sprites? |
|-----------|------|--------|------------|--------------|
| **LineWinVisualizer** | SL-Engine `src/view/win/LineWinVisualizer.ts` | drawPaylinePath, drawPathFromPositions, animateLineDrawing | Pixi Graphics (moveTo, lineTo, stroke) | No — Graphics only |
| **LineWinVisualizer** | LineWinVisualizer.ts ~68-72 | Container | Single Graphics object; container = overlayContainer or reelsView.container.parent | N/A |
| **LineWinVisualizer** | LineWinVisualizer.ts ~276 | addLineLabel | Text for line number (e.g. lineId) | No |

There is **no** “PaylineRenderer” or “LineView” by name; **LineWinVisualizer** is the payline renderer. It does **not** use PNG textures or sprite sheets; it draws paths with Graphics and optional text labels.

---

## 2. Highlight pipeline

| Component | File | What it does |
|-----------|------|----------------|
| **ReelsView** | ReelsView.ts:241-246 | `highlightPositions(positions)` → `reels[reel].highlightSymbol(row)` |
| **ReelView** | ReelView.ts:198, 214 | highlightSymbol(row), clearAllHighlights — symbol-level highlight on reels |
| **CascadeViewAnimator** | CascadeViewAnimator.ts:405-417 | animateWinHighlight(stageWins) → collect win.positions → reelsView.highlightPositions(winPositions); then wait winHighlightDurationMs |
| **DefaultWinPresenterStrategy** | DefaultWinPresenterStrategy.ts:391-424 | createWinHighlights(win) — creates Graphics (glow + border) per position, adds to overlayContainer, runs highlightPulse animation |
| **WinPresenterConfig** | WinPresenterConfig.ts:21-47, 151-165, etc. | highlight.primaryColor, glowColor, glowAlpha, borderWidth, highlightPulse (duration, easing, scaleMin/Max, alphaMin/Max) |

So: **two highlight mechanisms** — (1) ReelView symbol highlight (on reels), (2) overlay Graphics quads (WinPresenter overlayContainer). Cascade uses (1); win presentation uses (2) and (1) via triggerSymbolWinAnimations.

---

## 3. showLine / hideLine / hideAllLines

- **Not found** as public API names. Line visibility is controlled by:
  - **showPaylines** (WinPresenterConfig): when false, DefaultWinPresenterStrategy does not call LineWinVisualizer for line wins.
  - **clear()** on DefaultWinPresenterStrategy: destroys/detaches LineWinVisualizer and clears highlight graphics (no explicit “hideAllLines” method name).
- LineWinVisualizer clears its Graphics with `this.graphics.clear()` at the start of visualizeLineWin / visualizeMultipleLineWins and in clear(); there is no separate “hideLine(lineId)”.

---

## 4. Overlay / effects layers

| Layer / container | File | Contents |
|-------------------|------|----------|
| **SlotScene.container** | SlotScene.ts | backgroundView, gameLayer, overlayLayer, uiContainer |
| **gameLayer** | SlotScene.ts:391, 646 | slotFrameView (frame), reelsView.container |
| **overlayLayer** | SlotScene.ts:368-369, 404, 755 | slotFrameView (if overlay frame), **winPresenter.overlayContainer** |
| **winPresenter.overlayContainer** | WinPresenter.ts:61, SlotScene 755 | WinPresenter strategy adds: dimOverlay, winTextDisplay, highlightGraphics, and LineWinVisualizer’s graphics (when container passed = overlayContainer) |
| **ReelsView.lockOverlayContainer** | ReelsView.ts:52-84, 638-669 | Lock overlays (hold & spin); separate from win/line overlay |
| **IEffect.ts** | effects/IEffect.ts:36, 133-143, 388, 446 | Effect type 'highlight'; overlay Graphics for effects — not the same as WinPresenter overlay |

So: **WinPresenter’s overlayContainer** is the single “win layer” used for dim, win text, cell highlights, and line paths. It sits on **overlayLayer** above the reels. There is no dedicated “winLayer” or “effectsLayer” name; overlayLayer serves that role.

---

## 5. Callchain summary (rendering)

```
Win presentation (normal):
  SlotScene.onPresentWins
    → playStages(result)
    → winPresenter.present(result)
      → DefaultWinPresenterStrategy.present()
        → presentLineWins(lineWins)  [if showIndividualWins && lineWins.length]
          → LineWinVisualizer.visualizeMultipleLineWins(lineWins)  [Graphics lines]
          → triggerSymbolWinAnimations (ReelView symbol callbacks)
          → enqueue wait
        → presentAllWins()
          → LineWinVisualizer.visualizeMultipleLineWins(lineWins)  [if showPaylines]
          → createWinHighlights()  [overlay Graphics quads]
          → triggerSymbolWinAnimations
        → timelinePlanner.play()

Cascade (per stage):
  CascadeViewAnimator.animateCascadeTransition(..., stageWins)
    → animateWinHighlight(stageWins)
      → reelsView.highlightPositions(winPositions)  [ReelView.highlightSymbol]
      → wait winHighlightDurationMs
```

---

## 6. Gaps (evidence only)

- **PNG payline assets:** Not used. LineWinVisualizer uses only Graphics. No config or code path for “lineTexture”, “line_01.png”, or “paylines/” assets.
- **Dedicated line layer:** Line drawing uses the same overlayContainer as win highlights; no separate container for “line overlay above reels” beyond the existing overlayLayer.
- **hideLine(lineId):** No per-line show/hide; clearing is global (graphics.clear() / strategy.clear()).
