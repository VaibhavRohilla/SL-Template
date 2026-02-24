# Line Win Overlay — Modes Parity Matrix

Recon-only. Explicit parity for Normal, Real Turbo, and Skip Animations.

---

## Parity table

| Overlay feature | Normal | Real Turbo | Skip Animations | Parity | Evidence |
|-----------------|--------|------------|------------------|--------|----------|
| **Line path visible** | Yes | Yes | Yes | OK | Normal: presentLineWins/presentAllWins → visualizeMultipleLineWins (DefaultWinPresenterStrategy 388–391, 417–418). Real Turbo: same path with scaled time. Skip: applyFinalState → visualizeMultipleLineWins(lineWins, { instant: true }) (278–281). |
| **Symbol highlight** | Yes | Yes | Yes | OK | createWinHighlights in present (391–398) and applyFinalState (232–243); triggerSymbolWinAnimations in both. |
| **Overlay cleared between wins** | Yes | Yes | N/A (no “between”) | OK | clear() in present() finally (199); clearVisualEffects() at spin start (SlotScene 821). Skip path doesn’t run present(); overlay was cleared at start of same spin. |
| **Final grid correct (multi-stage)** | Yes | Yes | Yes | OK | Skip: applyStoppedState(finalStage.grid) with finalStage = result.stages[stageCount-1] (SlotScene 920–923). Present: playStages(result) then present; grid is final after stages. |
| **Payline preview API exists** | No | No | No | NONE | No showLine(lineId) / hideLineOverlay() for idle payline preview. showPaylines only toggles line path during **win** presentation. |
| **Line labels** | Yes (if showLineLabels) | Yes | Yes | OK | LineWinVisualizer addLineLabel when showLineLabel (192, 235, 267); config from strategy showLineLabels (673). Same visualizer used in normal and applyFinalState (instant). |

---

## Notes

- **Real Turbo:** Same code path as Normal; parity is “same behavior, possibly shorter time” if timing/delta is ever scaled.
- **Skip Animations:** applyFinalState draws paylines with `instant: true`; no animated line draw. Line path and labels still shown when showPaylines and line wins exist (247–282).
- **Payline preview:** Marked NONE — no API to show a specific payline (e.g. line 1) when there is no win or when user opens paytable.
