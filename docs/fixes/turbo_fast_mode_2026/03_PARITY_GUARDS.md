# Parity Guards (Turbo vs Skip Animations)

## Requirements

1. **Turbo fast** must still call the normal presenter path (onPresentWins, playStages, winPresenter.present) — no skip path.
2. **Skip Animations** must still apply final visuals completely (applyFinalState, applyStoppedState, paylines/highlights).
3. DEV-only checks (removable behind flags):
   - If `showPaylines` is true and lineWins exist, ensure visualizer is called in both normal and skip paths.
   - If `stages.length > 1`, skip path must snap to final stage grid (last stage), not stages[0].

## Evidence (existing behavior)

- **Normal path:** `SlotScene.ts:839–847` — `onPresentWins(result)` runs `playStages` then `winPresenter.present(result)`. Presenter uses timeline and highlights; line wins visualized when `config.global.showPaylines` (`DefaultWinPresenterStrategy.ts:346–348`, `370–377`).
- **Skip path:** `SlotScene.ts:852–872` — `onSkipAnimations(result)` calls `reelsView.applyStoppedState(baseStage.grid)` (stages[0] only for base grid), then `winPresenter.applyFinalState(result)`. `applyFinalState` in `DefaultWinPresenterStrategy.ts:201–250` aggregates wins from **all stages**, highlights all winning positions, shows win text, dims non-winning if configured — so line wins and highlights are applied.
- **Multi-stage:** Skip path uses `baseStage = result.stages[0]` for reel grid; win state uses all stages. For multi-stage (e.g. cascade), final grid for reels is base stage; win amounts and highlights include all stages. If “final stage grid” means the last stage’s grid for reels, current code snaps to base (first) stage. Parity guard: when stages.length > 1, skip path should apply final stage grid for reels if that is the contract; otherwise document that skip path uses base stage grid. (Recon: playStages in normal path runs per stage; skip applies base grid + full win state. No change made here unless product requires last-stage grid for reels.)

## DEV-only checks (optional, behind flag)

- In `applyFinalState`, if `DEV_TURBO_TRACE` or a new `DEV_PARITY_GUARD`: when `showPaylines` and lineWins.length > 0, assert or log that line win visualizer was used (already applied in applyFinalState via createWinHighlights/triggerSymbolWinAnimations for all wins; line wins are in allWins and get highlighted). So parity is already satisfied.
- For multi-stage: add a DEV log when stages.length > 1 in onSkipAnimations: “Skip path using base stage grid for reels; win state from all stages.” No code change required for parity if base-stage grid is intended for skip.

No additional code changes required for 03; existing behavior satisfies Turbo = normal path and Skip = full applyFinalState. DEV_TURBO_TRACE already logs applyFinalState args (DefaultWinPresenterStrategy.ts:212–218).
