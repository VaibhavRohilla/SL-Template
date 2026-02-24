# Line Win Overlay — Data Model and Mapping

Recon-only. Source of truth, line win structure, and how LineWinVisualizer input is built.

---

## Source of truth

- **Outcome:** `SpinOutcome` (SL-Engine `src/core/types/SpinOutcome.ts`).
- **Stages:** `result.stages[]`; each stage has `grid`, `wins`, `stageWin`, etc. (`OutcomeStageSchema` 276–371).
- **Wins per stage:** `stage.wins` is `StageWin[]` (`OutcomeStageSchema` 287, `StageWinSchema` 244–263).

**StageWin** (SpinOutcome.ts 244–264):

- `symbolId`, `winAmount`, `positions` (reel/row), `count`, `multiplicity`, `winType` (`'ways' | 'line' | 'scatter' | 'cluster'`).
- `meta?: Record<string, unknown>` — for line wins, backend is expected to set `meta.lineId`, `meta.paylinePattern`, `meta.direction`.

---

## Line win: required and optional fields

For `winType === 'line'`:

| Field | Source | Required for overlay? | Evidence |
|-------|--------|------------------------|----------|
| **positions** | `StageWin.positions` | Yes (fallback path) | LineWinVisualizer uses positions when paylinePattern is missing (84–86, 203–214). |
| **meta.lineId** | Backend | Yes for line path | DefaultWinPresenterStrategy only pushes to `lineWins` when `lineId !== undefined` (135–144). If absent, win is treated as otherWin (154–155). |
| **meta.paylinePattern** | Backend | No (fallback) | If missing or empty, `drawPathFromPositions(win.positions, win.lineId)` is used (LineWinVisualizer.ts 83–86, 105–108). |
| **meta.direction** | Backend | No | Optional. If provided must be `'left-to-right'` or `'right-to-left'`; else points are drawn in array order (LineWinVisualizer.ts 125–135, 165–167). |

---

## Mapping: StageWin → LineWin (strategy)

`LineWin` type (WinTypes.ts 61–84): `symbolId`, `lineId`, `count`, `positions`, `winAmount`, `paylinePattern?`, `direction?`.

Build in **DefaultWinPresenterStrategy** (present and applyFinalState):

1. Filter: `win.winType === 'line'` and (for present) `config.global.showPaylines`.
2. Read `lineId = win.meta?.lineId`, `paylinePattern = win.meta?.paylinePattern`, `rawDirection = win.meta?.direction`.
3. Validate direction; if invalid throw `OutcomeContractError` (119–133, 255–264).
4. If `lineId !== undefined`: push to `lineWins` with `{ symbolId, lineId, count, positions, winAmount, paylinePattern, direction }`.
5. If `lineId === undefined`: push to `otherWins` (no line path drawn for that win).

Evidence: `DefaultWinPresenterStrategy.ts` 112–156 (present), 248–278 (applyFinalState).

---

## LineWinVisualizer input

- **visualizeMultipleLineWins(wins: LineWin[], options?: { instant?: boolean }):**
  - For each win: `win.paylinePattern` → if present and non-empty, `drawPaylinePath(pattern, lineId, direction, immediate)`; else `drawPathFromPositions(win.positions, lineId)`.
- **drawPaylinePath:** Resolves symbol centers via `reelsView.getSymbolAt(reelIndex, rowIndex)` and `displayObj.getGlobalPosition()` (144–167). So **pattern** is row indices per reel; **positions** are only used when pattern is missing.

---

## Assumptions and fallbacks

| Assumption | Fallback if backend omits |
|------------|----------------------------|
| **lineId exists** | Win is not added to lineWins; only symbol highlights and win amount (as “other” win) are shown; no path. |
| **paylinePattern exists** | Path is drawn from `positions` (reel/row) via `drawPathFromPositions`. |
| **direction** | Points drawn in default order (left-to-right); no reversal. |

No default lineId is inferred; without `meta.lineId` the win is not considered a line win for overlay purposes.
