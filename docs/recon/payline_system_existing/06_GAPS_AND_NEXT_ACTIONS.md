# Gaps and Next Actions (No Implementation)

Recon only. Proposals are planning only; no code changes.

---

## 1. Gaps from capability matrix

| Gap | Detail |
|-----|--------|
| **No payline asset config** | SlotConfig has no field for per-line assets (e.g. PNG paths or texture keys). LineWinVisualizer uses only Graphics. |
| **No PNG payline renderer** | Line paths are drawn with Graphics; there is no code path to show a sprite/texture per payline (e.g. line_01.png). |
| **Turbo/skip: line paths not shown** | When turbo or skip is used, `applyFinalState` shows symbol highlights and win text but does not call LineWinVisualizer, so payline paths are not drawn in that path. |

---

## 2. Minimal next step (smallest change to get PNG paylines working)

- **Add optional payline asset config** (e.g. in SlotConfig or WinPresenterConfig): e.g. `paylineAssets?: Record<number, string>` (lineId → texture key or path) or `paylineTexturePrefix?: string` with convention `line_${id}.png`.
- **Extend LineWinVisualizer (or add a small adapter)** to:
  - Prefer sprite per line when a texture is available for that lineId; otherwise fall back to current Graphics drawing.
- **Ensure LineWinVisualizer is invoked from applyFinalState** when `showPaylines` is true, so turbo/skip also shows line paths (same as normal flow). Option: call `getLineWinVisualizer().visualizeMultipleLineWins(lineWins)` inside `applyFinalState` when there are line wins and config.global.showPaylines.

No change to outcome contract (backend already sends lineId/paylinePattern in meta). Template would add asset keys or paths and, if needed, wire texture loader for those keys.

---

## 3. Phase 1 build plan (only if implementing from scratch — not the case here)

Not required: a payline system already exists (config geometry, Graphics renderer, win model with lineId/positions, highlight and sequencing). Phase 1 would only apply if most capabilities were NONE; here the plan is **extensions** (PNG option + turbo line drawing), not a greenfield build.

If a phased plan were needed for a different codebase, it would look like:

1. Config: payline geometry (already done).
2. Outcome: StageWin with positions and line meta (already done).
3. Renderer: Graphics line drawing (already done).
4. Optional: Asset config + PNG path renderer.
5. Optional: applyFinalState to draw lines on skip/turbo.

---

## 4. Risks (performance, determinism, layering)

| Risk | Mitigation |
|------|------------|
| **Performance** | Many PNGs or large textures per line could increase load and draw cost. Prefer atlases or a single texture with UVs per line; keep Graphics fallback. |
| **Determinism** | Line drawing is already timeline-driven (commands enqueued). PNG path should not introduce timers or non-deterministic ordering; use same timeline/command pattern. |
| **Layering** | Line visuals already sit in WinPresenter overlayContainer on overlayLayer. PNG sprites should be added to the same container (or same zIndex policy) so they stay above reels and consistent with current highlights. |
| **Turbo/skip** | Adding LineWinVisualizer to applyFinalState keeps behavior consistent with normal presentation and avoids “lines missing when user skips.” |

---

## 5. What NOT to build (already exists)

- **Payline geometry in config** — SlotConfig.paylines (id, pattern) is defined and validated.
- **Line win model** — StageWin with winType 'line', positions, and meta (lineId, paylinePattern, direction) is supported and used.
- **Graphics-based payline drawing** — LineWinVisualizer draws paths and optional labels; DefaultWinPresenterStrategy calls it when showPaylines is true.
- **Symbol and overlay highlights** — ReelsView.highlightPositions/ReelView.highlightSymbol and createWinHighlights in strategy.
- **Win sequencing** — presentLineWins / presentSingleWin / presentAllWins with timeline waits.
- **Overlay above reels** — overlayLayer and winPresenter.overlayContainer; LineWinVisualizer uses that container.

Implement only: (1) optional PNG payline asset config and render path, and (2) invoking line visualization in applyFinalState for turbo/skip.
