# Executive Summary — Payline System Recon

Recon only. No implementation. Evidence in sibling docs.

---

## Is there already a payline system?

**Yes — partial.** The engine has a **full logical and Graphics-based payline path**: config geometry, outcome model with line wins and positions, a line-path renderer (Graphics), symbol and overlay highlights, win sequencing, and correct layering. What is **not** present: **payline asset config** (e.g. PNG per line) and a **PNG-based line renderer**; and **turbo/skip** does not draw line paths (only symbol highlights + win text).

---

## Fastest path to “PNG paylines + line win highlight”

1. **Line win highlight** — Already in place: StageWin.positions and meta (lineId, paylinePattern); ReelsView/ReelView symbol highlight and DefaultWinPresenterStrategy overlay highlights; LineWinVisualizer draws paths when showPaylines is true.
2. **PNG paylines** — Smallest addition:
   - Add optional config (e.g. payline texture keys or prefix) to SlotConfig or WinPresenterConfig.
   - In LineWinVisualizer (or a thin sprite adapter), when a texture exists for a lineId, draw a sprite along the path (or at segments) instead of/in addition to Graphics; keep Graphics fallback when no asset.
   - Ensure assets are loaded and keys match (e.g. line_1 … line_N).
3. **Turbo/skip** — In DefaultWinPresenterStrategy.applyFinalState, when there are line wins and showPaylines, call the same LineWinVisualizer.visualizeMultipleLineWins(lineWins) so line paths appear in skip/turbo as well.

No change to backend contract; backend already sends line wins with positions and meta.

---

## What NOT to build (already exists)

- **Payline geometry in config** — SlotConfig.paylines (id, pattern) and validation when evaluationMode === 'lines'.
- **Outcome model for line wins** — StageWin with winType 'line', positions, and meta (lineId, paylinePattern, direction).
- **Payline path drawing** — LineWinVisualizer (Graphics) and integration in DefaultWinPresenterStrategy (presentLineWins, presentAllWins).
- **Symbol and overlay highlights** — highlightPositions / highlightSymbol and createWinHighlights.
- **Win presentation sequencing** — Individual wins then “all wins” with timeline; showPaylines and showLineLabels in config.
- **Overlay layer above reels** — overlayLayer and winPresenter.overlayContainer; line graphics live there.

Build only: (1) optional PNG payline asset config and render path, and (2) line visualization in applyFinalState for turbo/skip.
