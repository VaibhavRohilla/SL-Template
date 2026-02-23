# 06 — Override Points

> **Goal:** Identify every place reelGap, symbol sizes, or spacing could be overridden or dropped.

---

## A. Full Variable Search Results

### `reelGap` / `reelsGap` / `columnGap`

| Location | Type | Value / Expression | Notes |
|----------|------|--------------------|-------|
| `BrandConfig.ts:112` | **Definition** | `reelGap: 100` | Template source of truth |
| `bootstrap.ts:38` | **Mapping** | `reelGap: dimensions.reelGap` | 1:1 pass-through |
| `App.ts:81-86` | **Interface** | `reelGap?: number` (GameOptions) | Optional field |
| `App.ts:378` | **Mapping + default** | `L?.reelGap ?? 10` | Default 10, but inert (Template provides) |
| `IScene.ts:202` | **Interface** | `reelGap: number` (SceneContext.sceneLayout) | Read-only |
| `SlotGameScene.ts:55` | **Fallback default** | `reelGap: 10` | Inert (sceneLayout always provided) |
| `SlotGameScene.ts:66` | **Mapping** | `reelGap: layout.reelGap` | 1:1 pass-through |
| `SlotScene.ts:152` | **Default partial** | `reelGap: 10` | Overridden by spread at line 334 |
| `SlotScene.ts:334` | **Merge** | `{ ...DEFAULT, ...sceneConfig }` | sceneConfig wins |
| `SlotScene.ts:522` | **Consumed** | `this.sceneConfig.reelGap ?? 0` | Fallback frame width calc |
| `SlotScene.ts:621` | **Consumed** | `this.sceneConfig.reelGap` | ReelsViewConfig |
| `SlotScene.ts:1157` | **Consumed** | `this.sceneConfig.reelGap ?? 0` | calculateReelsWidth |
| `ReelsView.ts:25` | **Interface** | `reelGap?: number` (ReelsViewConfig) | Optional field |
| `ReelsView.ts:100` | **Consumed** | `this.viewConfig.reelGap ?? 0` | totalWidth getter |
| `ReelsView.ts:588` | **Consumed** | `this.viewConfig.reelGap ?? 0` | createReels → reel X positioning |
| `ReelsView.ts:601` | **Consumed** | `i * (symbolWidth + reelGap)` | Actual reel position |

**No `reelsGap` or `columnGap` found anywhere.**

### Conclusion on `reelGap`:

**The value IS correctly propagated and consumed.** `reelGap: 100` reaches every consumer. The "reelGap not adjustable" complaint might stem from:

1. **Changing it in BrandConfig doesn't seem to have visible effect** because the frame doesn't adjust to match the new reel area size.
2. **The SpinFeel has its own gap** (`symbolGapPx: 4`) which could be confused with `reelGap`.
3. **The gap IS applied but the frame covers it** — or conversely the frame window is sized for a different gap.

---

### `symbolWidth` / `symbolHeight`

| Location | Type | Value | Notes |
|----------|------|-------|-------|
| `BrandConfig.ts:109-110` | **Definition** | `200 / 200` | Template source |
| `bootstrap.ts:35-36` | **Mapping** | Pass-through | |
| `App.ts:375-376` | **Mapping + default** | `?? 140` | Inert |
| `SlotScene.ts:149-150` | **Default partial** | `150 / 150` | Overridden by spread |
| `SlotScene.ts:599-600` | **Consumed** | SymbolFactory config | Cell size for symbol rendering |
| `SlotScene.ts:618-619` | **Consumed** | ReelsViewConfig | |
| `SlotScene.ts:714-715` | **Consumed** | WinPresenter config | Symbol highlight sizing |
| `ReelView.ts:71-73` | **Consumed** | Mask creation | `rect(0, 0, symbolWidth, maskHeight)` |
| `ReelSymbolStrip.ts:44` | **Consumed** | Strip `symbolHeight` | Used for `slotHeight` |
| `SlotFrameView.ts:123-126` | **NOT consumed** | Frame scales to viewport | Frame ignores symbol size |

### `symbolGap` / `symbolGapPx`

| Location | Type | Value | Notes |
|----------|------|-------|-------|
| `BrandConfig.ts:111` | **Definition** | `60` | Layout gap |
| `SpinFeel.ts:22` | **Definition** | `4` | Scroll gap |
| `SlotScene.ts:151` | **Default** | `5` | Overridden |
| `ReelView.ts:71` | **Consumed** | Mask height calc | Uses layout `60` |
| `ReelSymbolStrip.ts:45` | **Consumed** | Strip `symbolGap` | Uses layout `60` |
| `SpinFeelConfig.ts:294` | **Consumed** | `getSpinCycleHeight` | Uses SpinFeel `4` |
| `ReelMechanicClassic.ts:167` | **Indirect** | `strip.slotHeight * maxScrollPerFrame` | `slotHeight` = 260 (from layout) |

### `slotHeight` / `spacing` / `dimensions`

| Location | Type | Value | Notes |
|----------|------|-------|-------|
| `ReelSymbolStrip.ts:51-53` | **Derived** | `symbolHeight + symbolGap = 260` | Used for scroll distance |
| No `spacing` fields found | — | — | Not used in layout |

---

## B. Override Classification Table

| Variable | Where Set | Where Could Be Overridden | Is It Overridden? | Fix Direction |
|----------|-----------|---------------------------|-------------------|---------------|
| `reelGap` | `BrandConfig:112` | `App.ts:378` (default), `SlotScene.ts:152` (default) | **NO** — Template value wins | N/A |
| `symbolWidth` | `BrandConfig:109` | `App.ts:375` (default), `SlotScene.ts:149` (default) | **NO** — Template value wins | N/A |
| `symbolHeight` | `BrandConfig:110` | `App.ts:376` (default), `SlotScene.ts:150` (default) | **NO** — Template value wins | N/A |
| `symbolGap` | `BrandConfig:111` | `App.ts:377` (default), `SlotScene.ts:151` (default) | **NO** — Template value wins | N/A |
| `symbolHeightPx` | `SpinFeel:21` | `premiumPreset` (base) | **SpinFeel overrides preset** | Intentional |
| `symbolGapPx` | `SpinFeel:22` | `premiumPreset` (base) | **SpinFeel overrides preset** | Intentional |

---

## C. WHY "reelGap not adjustable" — Root Cause

The values ARE propagated and consumed. The likely reasons the user perceives it as "not adjustable":

### Cause 1: Frame doesn't adapt to reel area

When you change `reelGap` in BrandConfig, the reel area width changes:
- `reelGap: 100` → `reelsWidth = 1400`
- `reelGap: 50` → `reelsWidth = 1200`
- `reelGap: 0` → `reelsWidth = 1000`

But the **frame** always scales to the viewport (1920×1080) regardless. The frame's transparent window doesn't shrink/grow with the reel area. So changing `reelGap` moves reel positions but the frame stays the same size, making it look like the change had no effect.

**Evidence:** `SlotFrameView.ts:121-127` — scaling uses `viewportWidth/texWidth`, not reel area dimensions.

### Cause 2: symbolGap confusion

There are two "gap" concepts:
- `symbolGap: 60` (vertical gap between rows, affects layout height)
- `reelGap: 100` (horizontal gap between reel columns, affects layout width)

Both are applied correctly. But if the user expects `reelGap` to control vertical spacing, they'd see no change in what they expect.

### Cause 3: No visual feedback

The gap is empty transparent space. There's no visual indicator (separator line, background fill) that shows the gap is present. If the frame covers the gap area, it's invisible.

---

## D. Special Focus: Where reelGap Could Be Dropped

**Nowhere.** The value is never dropped in the pipeline. Every intermediate step passes it through or uses nullish coalescing `?? 0` / `?? 10` as a fallback that is never triggered when Template provides the value.

The only way `reelGap` would be "dropped" is if `gameOptions.layout` were `undefined`, which would trigger the fallback defaults. With the current Template code, `layout` is always provided.
