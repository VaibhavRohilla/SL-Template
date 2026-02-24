# Turbo Mode — Risk Ranking and Gaps

Recon-only. Ranked issues with evidence, impact, and recommended fix ideas (no code).

---

## 1. Parity gaps (missing visual layers)

| Rank | Issue | Evidence | Impact | Recommended fix |
|------|--------|----------|--------|-------------------|
| **P1** | Payline paths not drawn in turbo/skip | DefaultWinPresenterStrategy.applyFinalState (200–241) does not call getLineWinVisualizer().visualizeMultipleLineWins. Normal path: presentLineWins (360–366), presentAllWins (334–336). | When showPaylines is true, line paths appear in normal flow but not in turbo — inconsistent UX and possible certification concern (same outcome should show same win indication). | In applyFinalState, when config.global.showPaylines and lineWins.length > 0, call getLineWinVisualizer().visualizeMultipleLineWins(lineWins) (same as presentAllWins). Build lineWins from result.stages wins with winType === 'line' and meta.lineId. |
| **P2** | Tier effects (screen shake, flash) not applied in turbo | applyFinalState does not call applyTierEffects (DefaultWinPresenterStrategy 398–404). | Cosmetic only; big win “impact” is weaker in turbo. | Optional: call applyTierEffects in applyFinalState when tier has effects (or document as intentional “instant” feel). |
| **P2** | Jackpot path not used in turbo | present() branches to presentJackpot when result.jackpot?.won (225–310). applyFinalState has no jackpot branch. | If a spin has jackpot.won and user is in turbo, jackpot-specific presentation (and any mandatory messaging) may not run. | In applyFinalState, if result.jackpot?.won, run same content as presentJackpot (tier audio, celebration text, dim) without timeline; or call a shared “showJackpotState” used by both present and applyFinalState. |

---

## 2. Incorrect unlock timing (input locked too long)

| Rank | Issue | Evidence | Impact | Recommended fix |
|------|--------|----------|--------|-------------------|
| **P3** | Lock release is same path for turbo and normal | SpinFlow.presentWins (1394): spinLock.release() after either onSkipAnimations (sync) or onPresentWins (await). Turbo: onSkipAnimations is synchronous so release happens immediately after. | No evidence of “locked too long” in turbo; turbo path is shorter so unlock should be earlier. | None required unless testing shows otherwise. Monitor SPIN_INPUT_UNLOCKED in DEV_TURBO_TRACE. |

---

## 3. Multi-stage mismatch (wrong stage applied in turbo)

| Rank | Issue | Evidence | Impact | Recommended fix |
|------|--------|----------|--------|-------------------|
| **P2** | Turbo onSkipAnimations uses base stage grid only | SlotScene 852–855: baseStage = result.stages[0]; applyStoppedState(baseStage.grid). For cascade, final grid is in last stage. | In multi-stage (cascade) games, turbo could show base grid instead of final cascade grid — wrong symbols on reels. | In onSkipAnimations, use final stage grid: e.g. finalStage = result.stages[result.stages.length - 1]; if finalStage?.grid applyStoppedState(finalStage.grid). Same as playStages turbo branch (1056–1066). |

---

## 4. What turbo bypasses that still must run (alignment/cleanup)

| Rank | Issue | Evidence | Impact | Recommended fix |
|------|--------|----------|--------|-------------------|
| **P1** | Outcome and grid authority | Same result used; applyStoppedState(grid) forces reels to grid. processStagePipeline and presentWins still run; only the *animation* path is skipped. | None — alignment and cleanup are correct. | None. |
| **P3** | Timeline skip vs cleanup | timelinePlanner.skip() (SlotScene 850) cancels pending commands. No evidence that resources (e.g. tweens) are leaked. | Low; verify in testing that no leaks after many turbo spins. | Optional: audit timeline/command cleanup on skip(); add DEV or unit test for resource cleanup. |

---

## 5. Summary ranking

| Priority | Item | Category |
|----------|------|----------|
| P1 | Payline paths in applyFinalState | Parity |
| P1 | Outcome/grid authority (verified OK) | Invariant |
| P2 | Multi-stage grid: use final stage in onSkipAnimations | Correctness |
| P2 | Jackpot in applyFinalState | Parity |
| P2 | Tier effects in applyFinalState (optional) | Parity |
| P3 | Unlock timing (monitor only) | Timing |
| P3 | Timeline cleanup on skip (optional audit) | Cleanup |

Implementing P1 payline and P2 multi-stage/final-stage in turbo will address the main correctness and parity gaps.
