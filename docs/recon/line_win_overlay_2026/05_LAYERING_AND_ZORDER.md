# Line Win Overlay — Layering and Z-Order

Recon-only. Where the overlay container lives and how it relates to reels, frame, and masks.

---

## Scene structure (evidence)

**SlotScene** (SlotScene.ts 369–377, 389–418):

- `this.container` (root)
  - **gameLayer** (371, 396): background (if any), then optional slot frame (if `frame.layer === 'game'` at index 0), then reels (createReels → reelsView).
  - **overlayLayer** (374–375, 410): optional slot frame (if `frame.layer !== 'game'`), then **winPresenter.overlayContainer** (800).
  - **uiContainer** (418): UI.

So: **overlayLayer** is above **gameLayer**. Win overlay (including line paths) is in **overlayLayer** via `winPresenter.overlayContainer`.

Evidence: SlotScene.ts 374–375 (`this.overlayLayer = new Container()`), 410 (`this.container.addChild(this.overlayLayer)`), 800 (`this.overlayLayer.addChild(this.winPresenter.overlayContainer)`). Frame: 399–401 (game) vs 413–416 (overlay).

---

## Overlay container contents (order)

DefaultWinPresenterStrategy adds to **overlayContainer**:

1. **dimOverlay** — added at index 0 (addChildAt(0)) so it is behind other overlay children (DefaultWinPresenterStrategy.ts 575).
2. **winTextDisplay** — addChild (528).
3. **highlightGraphics** — each highlight addChild (471).
4. **LineWinVisualizer.graphics** — added when LineWinVisualizer is constructed with `container = overlayContainer` (LineWinVisualizer.ts 72); visualizer is created on first getLineWinVisualizer() (DefaultWinPresenterStrategy.ts 667–671).

LineWinVisualizer sets `this.graphics.zIndex = 250` (LineWinVisualizer.ts 69) so its graphics sort above siblings without explicit zIndex. Highlights and text have no zIndex set in the cited code.

---

## Relation to reels and symbols

- **Reels** live in **gameLayer** (reelsView.container). **Overlay** is in **overlayLayer**, which is a sibling **above** gameLayer. So line path and highlights render **on top of** reels and symbols.
- **Symbol highlight** is two-part: (1) overlay quads (highlightGraphics) in overlayContainer; (2) symbol-level feedback via `triggerSymbolWinAnimations` → `symbol?.onWinStart?.()`. The overlay quads are positioned using reel/symbol layout (DefaultWinPresenterStrategy.ts 466–469: reel position + row offset).

---

## Line path vs highlight quads

- Both are in **overlayContainer**. Line path is the single Graphics from LineWinVisualizer (zIndex 250). Highlight quads are separate Graphics in highlightGraphics[]. Order depends on add order and zIndex: line graphics get 250, so they typically render above highlights unless highlights are added after and given higher zIndex (they are not in the cited code). So **line path is typically above highlight quads** in the same container.

---

## Reel masks

- No evidence that overlayContainer or line Graphics is clipped by a reel mask. ReelsView and ReelView mask usage (if any) applies to the reel container, not the overlay. So **line overlay is not blocked by reel masks**; it draws over the full overlay layer.

---

## Text diagram (layering)

```
SlotScene.container
├── gameLayer
│   ├── [optional] slotFrameView (if frame.layer === 'game')
│   └── reelsView.container (reels + symbols)
├── overlayLayer
│   ├── [optional] slotFrameView (if frame.layer !== 'game')
│   └── winPresenter.overlayContainer
│       ├── dimOverlay (index 0)
│       ├── winTextDisplay
│       ├── highlightGraphics[] (quads per winning cell)
│       └── LineWinVisualizer.graphics (zIndex 250)  ← line path + labels (labels on parent)
└── uiContainer
```

Line path and labels sit above reels and above dim and highlight quads (by add order and zIndex).
