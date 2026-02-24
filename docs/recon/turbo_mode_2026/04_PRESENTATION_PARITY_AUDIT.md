# Turbo Mode — Presentation Parity Audit

Recon-only. Parity table and GAPs with file:line evidence.

---

## 1. Parity table

| Feature | Normal path | Turbo path | Parity | Evidence |
|---------|-------------|------------|--------|----------|
| **Reel final alignment** | Reels stop in order; each `stopReel` → mechanic → final symbols. | `applyStoppedState(baseStage.grid)` (ReelsView 194–203): `forceStop()` + `setSymbols(symbols)` per reel. | **FULL** | Same grid from `result.stages[0]`; snap is explicit. SlotScene 853–855. |
| **Symbol win highlight** | `present()` → createWinHighlights (DefaultWinPresenterStrategy 391–424), triggerSymbolWinAnimations. | `applyFinalState()` (200–241): same createWinHighlights and triggerSymbolWinAnimations for all wins (222–231). | **FULL** | Same code paths for highlights and symbol win animations. |
| **Payline draw** | `present()` → presentLineWins / presentAllWins → getLineWinVisualizer().visualizeMultipleLineWins(lineWins) (331–336, 360–366). | `applyFinalState()` does **not** call LineWinVisualizer. Only showWinCelebration, createWinHighlights, triggerSymbolWinAnimations, showDimOverlay (200–241). | **NONE** | **GAP:** Line paths not drawn in turbo. DefaultWinPresenterStrategy 200–241 vs 331–336, 360–366. |
| **Win amounts text** | showWinCelebration (364–401) + timeline animation. | showWinCelebration (215–220), winTextDisplay alpha/scale set to 1 (216–219). | **FULL** | Same text; turbo shows immediately. |
| **Big win overlay** | present() uses tier (getWinTier), applyTierEffects, showWinCelebration; presentJackpot for jackpot. | applyFinalState uses getWinTier, showWinCelebration, showDimOverlay; no applyTierEffects (screen shake/flash). presentJackpot not called from applyFinalState. | **PARTIAL** | Win text and dim overlay; tier effects (screen shake, flash) and jackpot path not applied in turbo. |
| **Scatter highlight** | Wins aggregated from all stages; line/other split; highlights for all. | applyFinalState aggregates allWins from all stages (203–207), createWinHighlights for each (222–228). Scatter wins are in allWins; same highlight path. | **FULL** | Scatter positions get same highlight treatment. |
| **Multi-stage outcomes** | playStages() animates cascade stages; final grid from last stage. | onSkipAnimations uses baseStage = result.stages[0] only (SlotScene 853). For multi-stage, turbo shows **base** grid; playStages defensive branch (SlotScene 1054–1068) applies final stage grid if turbo and multiple stages. | **PARTIAL** | SlotScene 1056: if turbo in playStages, applies finalStage grid (1057–1066). But onSkipAnimations (846–861) uses baseStage only — so if onSkipAnimations runs first, reels get base grid; playStages is not called in turbo from presentWins (we take onSkipAnimations). So in turbo, only the first callback (beginStoppingSequence’s onSkipAnimations) runs; it uses baseStage. **INFERENCE:** For cascade, turbo shows base stage grid; cascade stages are not visually applied in turbo path from SlotScene 852–855. |
| **Skip/stop interactions** | User can requestQuickStop → turboMode true; or requestSkipWins in PRESENTING_WINS. | requestQuickStop sets turboMode (SpinFlow 656); processNextReelStop (982) or beginStoppingSequence (924) then runs skip path. | **FULL** | Same skip behavior. |

---

## 2. applyFinalState vs normal presenter (detail)

**Normal path** (DefaultWinPresenterStrategy.present, 71–198):

- getWinTier, playTierAudio, applyTierEffects, showWinCelebration
- Dim overlay if configured
- Split lineWins vs otherWins; if showIndividualWins: presentLineWins(lineWins) then presentSingleWin for each; then presentAllWins(winsToPresent, lineWins)
- presentLineWins / presentAllWins call getLineWinVisualizer().visualizeMultipleLineWins(lineWins)
- await timelinePlanner.play()

**Turbo path** (applyFinalState, 200–241):

- getWinTier, showWinCelebration (immediate), set alpha/scale to 1
- createWinHighlights for all wins, triggerSymbolWinAnimations
- showDimOverlay if configured
- **Missing:** applyTierEffects (screen shake, flash), presentJackpot (jackpot wins), **LineWinVisualizer.visualizeMultipleLineWins** (payline paths)

So parity gaps:

1. **Payline paths** — applyFinalState does not call LineWinVisualizer. **GAP.** Evidence: DefaultWinPresenterStrategy 200–241 (no call to getLineWinVisualizer/visualizeMultipleLineWins); presentAllWins 334–336, presentLineWins 364–366 do.
2. **Tier effects** — applyFinalState does not call applyTierEffects (screen shake, flash). **GAP** (cosmetic).
3. **Jackpot** — applyFinalState does not handle jackpot; present() has presentJackpot (225–310). If result.jackpot?.won, normal path uses presentJackpot; turbo path falls through to normal applyFinalState (no jackpot branch). **GAP** for jackpot presentation in turbo.

---

## 3. Logic only in normal flow that should be considered for turbo

| Logic | Normal only? | Recommended for turbo correctness |
|-------|----------------|-----------------------------------|
| LineWinVisualizer.visualizeMultipleLineWins | Yes (presentLineWins, presentAllWins) | Call in applyFinalState when showPaylines and lineWins.length > 0 (same as payline recon 06). |
| applyTierEffects (shake, flash) | Yes | Optional; can add to applyFinalState for parity or leave out for “instant” feel. |
| presentJackpot | Yes | Add jackpot branch in applyFinalState when result.jackpot?.won (show text/state without timeline). |

---

## 4. Summary

- **FULL parity:** Reel alignment, symbol win highlight, win text, scatter highlight, skip/stop behavior.
- **PARTIAL:** Big win (no tier effects in turbo), multi-stage (turbo applies base grid in onSkipAnimations; playStages has defensive turbo branch but is not used for the initial turbo skip).
- **NONE / GAP:** Payline draw in turbo (LineWinVisualizer not invoked in applyFinalState). Jackpot and tier effects also missing in applyFinalState.
