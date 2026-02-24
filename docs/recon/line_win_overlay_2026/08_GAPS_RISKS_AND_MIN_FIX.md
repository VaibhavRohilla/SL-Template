# Line Win Overlay — Gaps, Risks, and Minimal Fix

Recon-only. Confirmed gaps and recommended minimal fixes by priority.

---

## Gaps confirmed

| Gap | Severity | Evidence | Recommendation |
|-----|----------|----------|----------------|
| **PNG asset renderer missing** | P2 | LineWinVisualizer uses only Graphics (LineWinVisualizer.ts; no Texture/Sprite). payline_system_existing recon: “No PNG payline renderer”. | Phase 2: optional PngLineWinVisualizer or texture path in visualizer. |
| **Config surface for payline textures missing** | P2 | SlotConfig/WinPresenterConfig have no paylineAssets or paylineTexturePrefix (payline_system_existing 06_GAPS). | Phase 2: PaylineAssetsConfig mapping lineId → texture key. |
| **Payline preview API missing** | P1 | No showLine(lineId) / hideLineOverlay() for idle “show paylines” (docs/recon/payline_system_existing 04). Visibility only during win presentation. | Phase 1: Add showLineWin(lineId) / hideLineOverlay() (or equivalent) for studios that want paytable preview. |
| **Line labels not removed on clear()** | P1 | addLineLabel adds Text to graphics.parent (LineWinVisualizer 297); clear() only calls graphics.clear() (303–305). Labels persist or leak. | Phase 1: In clear(), remove/destroy label Text children from container (or track and destroy stored refs). |
| **Performance: redraw every frame during line animation** | P2 | DrawLineWinCommand.drawProgress clears and redraws path each update (DrawLineWinCommand 97, 100–125). Many lines → more redraws. | Phase 2 or later: consider batched draw or single final draw + alpha/scale animation. |
| **Multi-stage line win selection** | P0 (verified OK) | applyFinalState and present() aggregate all stages’ wins (DefaultWinPresenterStrategy 83–86, 204–208). Line wins from any stage included. Final grid is final stage; path uses reelsView.getSymbolAt so positions match displayed grid. | No fix needed; parity confirmed. |

---

## Risk ranking

| Priority | Item | Rationale |
|----------|------|-----------|
| **P0 correctness** | Multi-stage / final grid | Verified: aggregation and applyStoppedState(finalStage) are correct; no mismatch. |
| **P1 parity/UX** | Line label cleanup; payline preview API | Label leak can leave stale UI; studios expect a way to show paylines on tap (preview). |
| **P2 studio polish** | PNG paylines; config for textures; redraw perf | Needed for art-driven lines and scalability, not for correctness. |

---

## Minimal fix recommendation

1. **Phase 1 (production correctness + UX parity)**  
   - Fix **clear()**: remove or destroy line label Text objects when clearing (track labels added to parent, or clear all children of a dedicated label container).  
   - Add **explicit API**: e.g. `showLineWin(lineId?: number)` / `hideLineOverlay()` so templates can drive “show winning line(s)” or “show line N for preview” and hide without starting a spin.  
   - Optionally: small overlay state machine (e.g. “idle / showing win / showing preview”) to avoid double-clear or conflicting draw.

2. **Phase 2 (studio-grade)**  
   - Add **PaylineAssetsConfig** (e.g. lineId → texture key) and **PngLineWinVisualizer** (or sprite path inside existing visualizer) with Graphics fallback.  
   - Address **performance** if many animated lines (e.g. reduce per-frame redraws or duration).
