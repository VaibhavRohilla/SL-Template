# Line Win Overlay 2026 — Executive Summary

Recon-only. No production logic changes.

---

## What was reconnoitered

- **Line Win Overlay** = payline path (Graphics), optional line number label, symbol highlights (overlay quads + symbol callbacks), total win text, and optional dim — shown during **win presentation** for line wins.
- **Modes:** Normal (animated), Real Turbo (same path, scaled time), Skip Animations (instant snap + applyFinalState with line path drawn instant).
- **Scope:** Winning line overlay during presentation; payline **preview** (idle “show line N”) documented as missing.

---

## Findings in short

| Area | Finding |
|------|--------|
| **Scope** | Path + label + highlights + win text exist. No direction arrows; no per-line win text. No payline preview API (showLine/hideLine when not in win). |
| **Callchain** | Normal: SpinFlow → SlotScene onPresentationStart → playStages → winPresenter.present → DefaultWinPresenterStrategy presentLineWins/presentAllWins → LineWinVisualizer. Skip: onSkipAnimations → applyStoppedState(finalStage.grid) → applyFinalState → same LineWinVisualizer with instant: true. Real Turbo: same as Normal. |
| **Data** | Source: result.stages[].wins[]; line wins need meta.lineId (required for path), meta.paylinePattern (optional; fallback positions), meta.direction (optional). Strategy builds LineWin[] and passes to visualizeMultipleLineWins. |
| **Rendering** | LineWinVisualizer: single Graphics, straight segments, no PNG. clear() does not remove label Text (added to graphics.parent) — leak/stale. No pooling. |
| **Layering** | overlayContainer on overlayLayer (above gameLayer/reels). Line graphics zIndex 250; dim at index 0; then win text and highlights. |
| **Timing** | singleWinDurationMs, betweenWinsDelayMs, allWinsDurationMs from config. Timeline uses raw deltaMs; TweenService timeScale does not scale timeline waits. |
| **Parity** | Line path, symbol highlight, overlay cleared between wins, final grid correct in all three modes. Payline preview API: NONE. |
| **Gaps** | P1: Line labels not removed on clear(); no showLineWin/hideLineOverlay. P2: No PNG payline renderer; no payline texture config; per-frame redraw during line animation. |

---

## Deliverables

All under `docs/recon/line_win_overlay_2026/`:

- **00_EXEC_SUMMARY.md** (this file)
- **01_SCOPE_DEFINITION.md** — What “line win overlay” is; in/out of scope.
- **02_CALLCHAIN_AND_OWNERSHIP.md** — Normal / Skip / Real Turbo flows; who owns overlay; clear/reset.
- **03_DATA_MODEL_AND_MAPPING.md** — stages[].wins[], StageWin → LineWin; LineWinVisualizer input.
- **04_RENDERING_PIPELINE.md** — LineWinVisualizer implementation; Graphics only; clear/label leak; perf.
- **05_LAYERING_AND_ZORDER.md** — overlayLayer; overlayContainer; relation to reels and frame.
- **06_PRESENTATION_FLOW_AND_TIMING.md** — Win sequencing; sync with highlights/audio; timeScale.
- **07_MODES_PARITY_MATRIX.md** — Table: Normal / Real Turbo / Skip for path, highlights, clear, grid, preview API, labels.
- **08_GAPS_RISKS_AND_MIN_FIX.md** — Gaps by priority; minimal fix recommendation.
- **09_IMPLEMENTATION_PLAN.md** — Phase 1 (correctness + label fix + showLineWin/hideLineOverlay); Phase 2 (PNG paylines + config).

---

## Recommended next steps

1. **Phase 1:** Fix label cleanup in LineWinVisualizer.clear(); add showLineWin / hideLineOverlay (and optional overlay state).  
2. **Phase 2:** Add payline texture config and PNG/sprite line renderer with Graphics fallback.

No implementation was performed in this recon; stop after docs + plan as requested.
