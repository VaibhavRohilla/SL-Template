# Config Surface Map — Paylines (Engine + Template)

Recon only. Evidence for where payline-related config and terms appear.

---

## Search Terms Used

- `payline`, `paylines`, `lineId`, `line`, `LineConfig`, `PaytableLine`
- `rowsByReel`, `rowPattern`, `linePattern`, `lineDefs`, `lineDefinitions`
- `paylineAssets`, `lineTexture`, `line_png`, `line_01`, `paylines/`

---

## 1. Engine — SlotConfig paylines (contract)

| Location | Evidence | Contract/Template | Runtime/Dead | Validation |
|----------|----------|-------------------|--------------|------------|
| **SL-Engine** `src/core/types/SlotConfig.ts` | `paylines: z.array(z.object({ id, pattern, multiplier? })).optional()` | Engine contract | Runtime (used when `evaluationMode === 'lines'`) | Zod: required when `evaluationMode === 'lines'` (refine) |
| **SL-Engine** `src/core/types/SlotConfig.ts:170-199` | `evaluationMode: 'ways' \| 'lines' \| 'clusters'`, `.refine(... paylines must be defined when evaluationMode is "lines")` | Engine | Runtime | `validateSlotConfig()` |

**Excerpt (SlotConfig.ts:169-199):**

```ts
  evaluationMode: z.enum(['ways', 'lines', 'clusters']).default('ways'),
  paylines: z.array(z.object({
    id: z.number().int().min(1),
    pattern: z.array(z.number().int().min(0)),
    multiplier: z.number().min(1).optional(),
  })).optional(),
  // ...
}).refine(
  (data) => {
    if (data.evaluationMode === 'lines' && (!data.paylines || data.paylines.length === 0)) {
      return false;
    }
    return true;
  },
  { message: 'paylines must be defined when evaluationMode is "lines"' }
)
```

- **Shape:** `{ id: number, pattern: number[], multiplier?: number }[]` — logical rows per reel (pattern[reel] = row index).
- **No** `lineDefs`, `lineDefinitions`, `rowsByReel`, `PaytableLine`, `paylineAssets`, `lineTexture`, `line_png`, `line_01`, or `paylines/` in Engine config schema.

---

## 2. Engine — WinPresenterConfig showPaylines (presentation)

| Location | Evidence | Contract/Template | Runtime/Dead | Validation |
|----------|----------|-------------------|--------------|------------|
| **SL-Engine** `src/view/win/WinPresenterConfig.ts:122-124` | `showPaylines: boolean`, `showLineLabels: boolean` | Engine (view config) | Runtime | Part of WinPresenterFullConfig (typed, not Zod in this file) |
| **SL-Engine** `src/view/win/WinPresenterConfig.ts:399,499,531` | Defaults `showPaylines: true` in theme presets | Engine | Runtime | N/A |

**Excerpt (WinPresenterConfig.ts:122-124):**

```ts
    /** Whether to show payline paths for line wins */
    showPaylines: boolean;
    /** Whether to show line number labels on paylines */
    showLineLabels: boolean;
```

---

## 3. Engine — DevTools / LineEvaluator (paylines in eval config)

| Location | Evidence | Contract/Template | Runtime/Dead | Validation |
|----------|----------|-------------------|--------------|------------|
| **SL-Engine** `src/core/debug/DevTools.ts:128-130` | `evaluationMode === 'lines' && (!config.paylines \|\| config.paylines.length === 0)` → errors | Engine | Runtime (dev validation) | DevTools config check |
| **SL-Engine** `src/devtools/math/LineEvaluator.ts:28,41,49` | `private paylines: PaylineDefinition[]`, `evalConfig.paylines` | Engine | Runtime (dev/sim only) | Uses IEvaluator PaylineDefinition |
| **SL-Engine** `src/core/evaluation/IEvaluator.ts:112-126` | `PaylineDefinition { id, pattern, multiplier? }`, `LineEvaluatorConfig.paylines` | Engine | Runtime (evaluator contract) | Type only |

---

## 4. Engine — Test / example payloads

| Location | Evidence | Contract/Template | Runtime/Dead | Validation |
|----------|----------|-------------------|--------------|------------|
| **SL-Engine** `src/core/flow/SpinFlow.deterministicScheduling.test.ts:145` | `paylines: []` in mock SlotConfig | Test | Dead (test fixture) | N/A |
| **SL-Engine** `src/examples/EgyptLines/EgyptLinesConfig.ts:302` | `paylines: egyptLinesPaylines` (25 paylines) | Example | Example config | Matches SlotConfig |

---

## 5. Template — slotConfig paylines (used at runtime)

| Location | Evidence | Contract/Template | Runtime/Dead | Validation |
|----------|----------|-------------------|--------------|------------|
| **SL-Template** `src/config/slotConfig.ts:202-251` | `paylines: [ { id: 1, pattern: [0,0,0,0,0] }, ... ]` (50 entries) | Template | Runtime | Validated by Engine `validateSlotConfig()` when passed to Engine |

**Excerpt (slotConfig.ts:202-212):**

```ts
  // Paylines - Extracted from Reference initConfig.json
  paylines: [
    { id: 1, pattern: [0, 0, 0, 0, 0] },
    { id: 2, pattern: [1, 1, 1, 1, 1] },
    // ... 50 lines
  ],
```

- Template docs reference `paylines` in `slotConfig.ts` (BRANDING_GUIDE, ARCHITECTURE_ANALYSIS, TEMPLATE_QUICKSTART). No separate Zod in Template; Engine validates.

---

## 6. Terms not found (no config surface)

- **Engine + Template:** No hits for `LineConfig`, `PaytableLine`, `rowsByReel`, `rowPattern`, `lineDefs`, `lineDefinitions`, `paylineAssets`, `lineTexture`, `line_png`, `line_01`, `paylines/` in config or asset paths.
- **Conclusion:** Payline **geometry** is defined only as `paylines: { id, pattern }[]` in SlotConfig. There is **no** config surface for payline **assets** (e.g. PNG textures per line).

---

## Summary Table

| Term | Engine contract | Template | Used at runtime | Validated (Zod/schema) |
|------|-----------------|----------|-----------------|-------------------------|
| `paylines` (array) | Yes — SlotConfig | Yes — slotConfig.ts | Yes | SlotConfigSchema + refine |
| `showPaylines` | Yes — WinPresenterConfig | No (uses Engine default/auto) | Yes | Typed only |
| `showLineLabels` | Yes — WinPresenterConfig | No | Yes | Typed only |
| `lineId` / `paylinePattern` | In **outcome** (StageWin.meta), not config | N/A | Yes (backend → StageWin) | StageWinSchema.meta optional |
| Payline assets (PNG, etc.) | No | No | N/A | N/A |
