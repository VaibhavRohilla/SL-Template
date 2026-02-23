# 03 — SceneLayout Final Values

> **Goal:** Document the FINAL runtime values that Engine uses when constructing the scene.

---

## A. Static Analysis: Final Values

Based on the pipeline trace (02), the final values passed to `SlotScene` and consumed by all views are:

### Viewport
| Field | Value | Source |
|-------|-------|--------|
| `sceneConfig.width` | **1920** | `BrandConfig.ts:107` → `bootstrap.ts:26` → `App.ts:217` → `SceneContext.viewport.width` → `SlotGameScene.ts:61` |
| `sceneConfig.height` | **1080** | `BrandConfig.ts:108` → `bootstrap.ts:27` → `App.ts:218` → `SceneContext.viewport.height` → `SlotGameScene.ts:62` |

### Symbol/Reel Layout
| Field | Value | Source |
|-------|-------|--------|
| `sceneConfig.symbolWidth` | **200** | `BrandConfig.ts:109` → through pipeline |
| `sceneConfig.symbolHeight` | **200** | `BrandConfig.ts:110` → through pipeline |
| `sceneConfig.symbolGap` | **60** | `BrandConfig.ts:111` → through pipeline |
| `sceneConfig.reelGap` | **100** | `BrandConfig.ts:112` → through pipeline |

### Slot Config
| Field | Value | Source |
|-------|-------|--------|
| `layout.reelCount` | **5** | `slotConfig.ts:45` |
| `layout.rowsPerReel` | **[4,4,4,4,4]** | `slotConfig.ts:46` |

### SpinFeel (Scroll Animation)
| Field | Value | Source |
|-------|-------|--------|
| `spinFeelConfig.symbolHeightPx` | **140** | `SpinFeel.ts:21` (via `premiumPreset` override) |
| `spinFeelConfig.symbolGapPx` | **4** | `SpinFeel.ts:22` |

---

## B. Computed Dimensions (from Final Values)

### Reel Area (from `SlotScene.calculateReelsWidth/Height`)

**`calculateReelsWidth()`** — `SlotScene.ts:1154-1158`:
```
reelCount * symbolWidth + (reelCount - 1) * reelGap
= 5 * 200 + 4 * 100
= 1000 + 400
= 1400
```

**`calculateReelsHeight()`** — `SlotScene.ts:1161-1165`:
```
maxRows * (symbolHeight + symbolGap)
= 4 * (200 + 60)
= 4 * 260
= 1040
```

### Reel Centering Position

**`SlotScene.createReels()`** — `SlotScene.ts:622-623`:
```
x = (1920 - 1400) / 2 = 260
y = (1080 - 1040) / 2 = 20
```

### Per-Reel X Positions

From `ReelsView.createReels()` — `ReelsView.ts:601`:
```
reelX = i * (symbolWidth + reelGap) = i * (200 + 100) = i * 300
```

| Reel | X Position |
|------|-----------|
| 0 | 0 |
| 1 | 300 |
| 2 | 600 |
| 3 | 900 |
| 4 | 1200 |

### Per-Reel Mask

From `ReelView.ts:71-73`:
```
maskHeight = visibleRows * (symbolHeight + symbolGap) = 4 * 260 = 1040
mask = rect(0, 0, 200, 1040)
```

### Reels Bounding Rectangle (Scene Coordinates)

```
x: 260  (centering offset)
y: 20   (centering offset)
width:  1400  (5 reels × 200 + 4 gaps × 100)
height: 1040  (4 rows × 260)
```

**TOTAL scene coverage: 1400 × 1040 out of 1920 × 1080 viewport**

This leaves only:
- Horizontal margin: (1920 - 1400) / 2 = **260px** each side
- Vertical margin: (1080 - 1040) / 2 = **20px** each side

---

## C. SpinFeel Scroll Dimensions (DIFFERENT system)

The `ReelSymbolStrip` also computes `slotHeight`:
```
slotHeight = symbolHeight + symbolGap = 200 + 60 = 260  (from layout config)
```

But `ReelMechanicClassic` uses `spinFeelConfig` for scroll speed calculations:
```
getSpinCycleHeight = (symbolHeightPx + symbolGapPx) * symbolCount
                   = (140 + 4) * stripLength
                   = 144 * stripLength
```

The scroll mechanic uses `symbolHeightPx=140` / `symbolGapPx=4` for its internal cycle height, but `ReelSymbolStrip.slotHeight` uses layout `symbolHeight=200` / `symbolGap=60` for visual positioning.

This means the scroll mechanic's notion of "one symbol" distance (144px) disagrees with the visual layout's notion (260px). See `04_REEL_GEOMETRY_MATH.md` for the impact.

---

## D. Runtime Log Location (for verification)

To verify these values at runtime, a DEV-only log can be added at:

**`SlotScene.ts`**, inside `createReels()` (around line 624), gated on `DEV_REEL_DEBUG`:

```typescript
if (DEV_REEL_DEBUG) {
  console.log('[DEV_LAYOUT] Final sceneLayout:', {
    viewport: { w: this.sceneConfig.width, h: this.sceneConfig.height },
    symbolWidth: this.sceneConfig.symbolWidth,
    symbolHeight: this.sceneConfig.symbolHeight,
    symbolGap: this.sceneConfig.symbolGap,
    reelGap: this.sceneConfig.reelGap,
    reelCount: this.slotConfig.layout.reelCount,
    rowsPerReel: this.slotConfig.layout.rowsPerReel,
    computedReelsWidth: this.calculateReelsWidth(),
    computedReelsHeight: this.calculateReelsHeight(),
    reelsX: reelsConfig.x,
    reelsY: reelsConfig.y,
  });
}
```

This uses the existing `DEV_REEL_DEBUG` flag from `reelDebug.ts:10` (currently `false`).
