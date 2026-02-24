# Line Win Overlay — Implementation Plan

Minimal, production-first plan in two phases. Recon only; no code changes in this deliverable.

---

## Phase 1 — Production correctness + UX parity (no PNG)

**Goal:** Overlay behaves correctly in all modes; explicit API for line win overlay; no label leak.

### 1.1 Overlay draw in all modes

- **Current state:** Normal and Skip already draw line path (presentLineWins/presentAllWins and applyFinalState with instant: true). Real Turbo uses same path.
- **Action:** No change required for draw paths. Optional: document or test that applyFinalState is always called with final-stage grid when using skip (already true in SlotScene 920–931).

### 1.2 Fix line label cleanup

- **Issue:** LineWinVisualizer.clear() only calls graphics.clear(); Text children added to graphics.parent are not removed (LineWinVisualizer 281–297, 303–305).
- **Action:**  
  - Track label Text objects (e.g. array or container) when calling addLineLabel.  
  - In clear(), remove and destroy those Text instances (and clear the list).  
  - Ensure destroy() also cleans labels if not already covered.

### 1.3 Explicit API: showLineWin / hideLineOverlay

- **Add (e.g. on WinPresenter or strategy):**  
  - `showLineWin(lineId?: number)` — show line path (and optional label) for given lineId, or all winning lines from last result if no arg. Requires last result or explicit LineWin[] input; may need a “preview” data path (e.g. from config paylines + current grid).  
  - `hideLineOverlay()` — clear line path and labels (and optionally other overlay visuals if desired for preview mode).  
- **Contract:** When used for “payline preview”, caller is responsible for providing line definition (e.g. paylinePattern from config) and optionally grid; when used after a win, use existing lineWins from outcome.  
- **Placement:** Prefer WinPresenter as the public API; strategy can implement. Template can call these from a “Paylines” button.

### 1.4 Overlay state (optional)

- **Option:** Simple state e.g. `overlayState: 'idle' | 'showing_win' | 'showing_preview'` to avoid clearing “win” overlay while “preview” is active, or vice versa. hideLineOverlay() resets to idle.  
- **Acceptance:** No double-clear bugs; clear before draw when switching context.

### Phase 1 acceptance checklist

- [ ] clear() removes and destroys all line label Text objects; no leak after multiple wins.
- [ ] showLineWin(lineId?) and hideLineOverlay() exist and are documented; preview use case (e.g. paytable) can show one or all lines and then hide.
- [ ] Normal, Real Turbo, and Skip Animations all show line path and (when configured) labels; overlay clears at spin start and at hideLineOverlay().

### Phase 1 risk

- **Low.** Label fix is local to LineWinVisualizer. API surface is additive; preview data path may require passing payline config or grid into presenter (small design).

---

## Phase 2 — PNG paylines (studio-grade)

**Goal:** Optional texture-based line rendering; Graphics remains fallback.

### 2.1 Config surface

- **Add:** e.g. `PaylineAssetsConfig`: `Record<number, string>` (lineId → texture key) or `paylineTexturePrefix?: string` with convention `line_${id}.png`.  
- **Place:** WinPresenterConfig or SlotConfig (or theme override).  
- **Use:** When drawing a line, if texture key exists for lineId, use sprite path; else use Graphics (existing).

### 2.2 PngLineWinVisualizer (or sprite path in existing visualizer)

- **Option A:** New class PngLineWinVisualizer that takes texture keys and draws sprites along the path (e.g. segment sprites or one sprite per line asset).  
- **Option B:** Extend LineWinVisualizer to accept optional texture map; when present, draw sprites (pooled per segment or whole line); when absent, use current Graphics.  
- **Implementation notes:**  
  - Reuse same path math (pattern/positions → points via reelsView.getSymbolAt + getGlobalPosition).  
  - Pool sprites per segment or per line to avoid allocation per presentation.  
  - Keep Graphics path for devtools and missing assets.

### 2.3 Fallback

- **Contract:** If asset missing or config absent, fall back to Graphics drawing (current behavior). No throw.

### Phase 2 acceptance checklist

- [ ] PaylineAssetsConfig (or equivalent) documented and wired; theme override possible.
- [ ] When config supplies texture for a lineId, line is drawn with sprite(s); otherwise Graphics.
- [ ] Sprite path uses same overlay container and z-order; no regression in Normal/Skip/Real Turbo.
- [ ] Performance: no large per-frame allocation; consider pooling.

### Phase 2 risk

- **Medium.** Asset loading and layout (stretch/scale of segment art) may need tuning; pooling adds code paths. Keep Phase 1 in place so disabling assets leaves behavior unchanged.

---

## Summary

| Phase | Focus | Delivered |
|-------|--------|-----------|
| **1** | Correctness + UX parity | Label cleanup; showLineWin / hideLineOverlay API; optional overlay state. |
| **2** | Studio polish | Payline texture config; PNG/sprite line renderer with Graphics fallback. |

Stop condition for this recon: all 10 docs exist. Implementation is out of scope for this prompt.
