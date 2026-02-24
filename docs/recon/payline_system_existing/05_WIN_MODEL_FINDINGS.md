# Win Model Findings — Line Wins and Positions

Recon only. Evidence for whether SpinOutcome carries wins, paylineId, positions, and where wins come from.

---

## 1. Does SpinOutcome carry `wins`?

**Yes.** Wins live per-stage: `SpinOutcome.stages[].wins` (array of `StageWin`).

- **SL-Engine** `src/core/types/SpinOutcome.ts`: `OutcomeStageSchema` includes `wins: z.array(StageWinSchema)`.
- **SL-Engine** `src/view/reels/ReelsView.ts:261-262`: `const allWins = result.stages.flatMap(stage => stage.wins)`.
- **SL-Engine** `src/view/win/DefaultWinPresenterStrategy.ts:80-84`: Aggregates `allWins` from `result.stages` for presentation.

There is no top-level `winList` or `wins` on SpinOutcome; only `stages[].wins` and `totalWin`.

---

## 2. StageWin shape — positions, paylineId, meta

**Schema (SpinOutcome.ts:244-264):**

```ts
export const StageWinSchema = z.object({
  symbolId: z.number().int().min(0),
  winAmount: z.number().min(0),
  positions: z.array(z.object({
    reel: z.number().int().min(0),
    row: z.number().int().min(0),
  })).min(1),
  count: z.number().int().min(3),
  multiplicity: z.number().int().min(1).default(1),
  winType: z.enum(['ways', 'line', 'scatter', 'cluster']),
  meta: z.record(z.string(), z.unknown()).optional(),
});
```

- **positions:** Yes — required array of `{ reel, row }`. Used for highlighting and line path.
- **paylineId:** Not a first-class field. For line wins it is in **meta**: `win.meta?.lineId`, `win.meta?.paylinePattern`, `win.meta?.direction` (see below).
- **meta:** Optional; backend can put `lineId`, `paylinePattern`, `direction` here for `winType === 'line'`.

**Evidence (DefaultWinPresenterStrategy.ts:117-141):**

```ts
if (win.winType === 'line' && this.config.global.showPaylines) {
  const lineId = win.meta?.lineId as number | undefined;
  const paylinePattern = win.meta?.paylinePattern as number[] | undefined;
  const rawDirection = win.meta?.direction;
  // ...
  lineWins.push({
    symbolId: win.symbolId,
    lineId,
    count: win.count,
    positions: win.positions,
    winAmount: win.winAmount,
    paylinePattern,
    direction,
  });
}
```

So: **SpinOutcome already carries wins with positions**. Line wins are identified by `winType === 'line'` and optional **meta** (`lineId`, `paylinePattern`, `direction`). No separate `WinEvent` type; `StageWin` is the unified win type.

---

## 3. WinTypes.LineWin (presentation DTO)

**SL-Engine** `src/core/types/WinTypes.ts:62-84` defines a **LineWin** type used by the win presenter and LineWinVisualizer:

- `symbolId`, `lineId`, `count`, `positions`, `winAmount`, `paylinePattern?`, `direction?`.

This is built from `StageWin` (with `winType === 'line'` and meta) inside DefaultWinPresenterStrategy; it is not part of the outcome schema. So: **line win shape for presentation is defined and used; backend must supply meta on StageWin for line wins.**

---

## 4. Where do wins come from today?

- **Backend-authoritative:** Design docs and flow indicate the frontend does **not** calculate paylines; it consumes outcomes from the backend.
- **SL-Engine** `docs/00-overview/design-goals.md`: "No Client-Side Evaluation: The frontend does not calculate paylines or symbol interactions."
- **SpinFlow** does not evaluate wins; it runs a stage pipeline and uses `processedOutcome` from evaluation/callback. For backend-provided outcomes, stages already contain `wins`.
- **LineEvaluator** (devtools) can evaluate lines client-side when given grid + paylines; used for dev/sim, not for production outcome path.

So: **in production, wins (including line wins with positions and meta) come from the backend.** The win model already supports line wins with paylineId (via meta) and positions.

---

## 5. presentWins / stages[].wins usage

- **ReelsView.presentWins** (SL-Engine `src/view/reels/ReelsView.ts:260-267`): Aggregates `result.stages.flatMap(stage => stage.wins)` and calls `highlightPositions(win.positions)` per win. So **win positions are used for symbol highlighting**.
- **CascadeViewAnimator** uses `stageWins` to call `animateWinHighlight(stageWins)` → `reelsView.highlightPositions(winPositions)` (CascadeViewAnimator.ts:405-417).
- **DefaultWinPresenterStrategy** aggregates `result.stages` → `allWins`, splits line vs other by `winType === 'line'` and meta, then presents individual wins and “all wins” with highlights and (when showPaylines) LineWinVisualizer.

---

## Summary

| Question | Answer | Evidence |
|----------|--------|----------|
| Does SpinOutcome carry wins? | Yes, per stage: `stages[].wins` | OutcomeStageSchema, ReelsView, DefaultWinPresenterStrategy |
| Shape of a win? | StageWin: symbolId, winAmount, positions, count, multiplicity, winType, meta? | StageWinSchema (SpinOutcome.ts) |
| Does it include paylineId for line wins? | Via meta: `meta.lineId`, `meta.paylinePattern`, `meta.direction` | DefaultWinPresenterStrategy.ts:117-141 |
| Does it include positions? | Yes — required `positions: { reel, row }[]` | StageWinSchema, ReelsView.highlightPositions |
| Where do wins come from? | Backend (outcome); client does not evaluate paylines in production | design-goals.md, SpinFlow stage pipeline |
| StageOutcome / presentWins? | presentWins uses full outcome; “stages[].wins” is the source | ReelsView, WinPresenter, DefaultWinPresenterStrategy |
