# Capability Matrix — Paylines / Lines / Win Presentation

Recon only. Status: FULL / PARTIAL / NONE / DEADCODE. Evidence = file:line or short refs.

---

| # | Capability | Status | Evidence | Notes |
|---|------------|--------|----------|--------|
| **A** | Payline geometry defined in config (logical rows by reel) | **FULL** | SlotConfig.ts:170-174 (paylines: id, pattern[], multiplier?); slotConfig.ts:202-251 (Template 50 lines); validateSlotConfig + refine when evaluationMode === 'lines' | Pattern = row index per reel. No rowsByReel/lineDefs; pattern[] is the contract. |
| **B** | Payline assets config (PNG textures per id) | **NONE** | No hits for paylineAssets, lineTexture, line_png, line_01, paylines/ in config or schema | No config surface or asset keys for per-line PNGs. |
| **C** | Payline renderer exists (PNG sprites) | **NONE** | LineWinVisualizer uses Graphics only; no Sprite/Texture from assets | Only Graphics drawing; no PNG-based line renderer. |
| **D** | Payline renderer exists (Graphics line drawing) | **FULL** | LineWinVisualizer.ts:68-73, 117-197, 241-286; drawPaylinePath, drawPathFromPositions, addLineLabel; DefaultWinPresenterStrategy calls it when showPaylines | Paths drawn with Pixi Graphics; optional line number label. |
| **E** | WinEvent model supports line wins with paylineId | **FULL** | StageWinSchema (SpinOutcome.ts:244-264): winType 'line', meta optional; DefaultWinPresenterStrategy.ts:117-141 reads meta.lineId, meta.paylinePattern, meta.direction | paylineId via StageWin.meta.lineId; backend supplies meta. |
| **F** | WinEvent model supports winning cell positions | **FULL** | StageWinSchema.positions (required): array of { reel, row }; ReelsView/DefaultWinPresenterStrategy use win.positions | positions[] is required on every StageWin. |
| **G** | Highlighter exists for symbol cells | **FULL** | ReelsView.highlightPositions → ReelView.highlightSymbol (ReelView.ts:198); DefaultWinPresenterStrategy.createWinHighlights (Graphics overlay quads); CascadeViewAnimator.animateWinHighlight | Two mechanisms: per-reel symbol highlight + overlay Graphics. |
| **H** | Win presenter sequences individual wins | **FULL** | DefaultWinPresenterStrategy: showIndividualWins → presentLineWins then presentSingleWin per win; presentAllWins at end; timeline wait commands between | Sequential ordering and “all wins” hold; line wins can be shown first. |
| **I** | Win presenter supports skip/quick-stop/turbo correctly | **PARTIAL** | SpinFlow.presentWins: turbo → onSkipAnimations(result); SlotScene.onSkipAnimations: timelinePlanner.skip(), applyStoppedState, winPresenter.applyFinalState; DefaultWinPresenterStrategy.skip() sets skipRequested; applyFinalState shows highlights + text but does NOT draw line paths | Turbo/skip: symbol highlights + win text applied; line paths are not drawn in applyFinalState (LineWinVisualizer not invoked). |
| **J** | Layering supports line overlay above reels | **FULL** | SlotScene: overlayLayer holds winPresenter.overlayContainer; LineWinVisualizer graphics added to overlayContainer (zIndex 250); gameLayer has reelsView; overlayLayer above gameLayer | Same overlay container for highlights and lines; overlayLayer above reels. |

---

## Summary by status

- **FULL:** A, D, E, F, G, H, J (7)
- **PARTIAL:** I (1) — skip/turbo applies final state but does not draw payline paths.
- **NONE:** B, C (2) — no payline asset config, no PNG line renderer.
