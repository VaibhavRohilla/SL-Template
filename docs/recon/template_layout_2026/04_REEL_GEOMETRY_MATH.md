# 04 — Reel Geometry Math

> **Goal:** Document the exact formulas used for reel area dimensions, per-reel masks, and compare to frame/viewport. Identify where width/height may exceed the frame.

---

## A. Reel Total Width Formula

### SlotScene.calculateReelsWidth() — `SlotScene.ts:1154-1158`

```typescript
private calculateReelsWidth(): number {
  const reelCount = this.slotConfig.layout.reelCount;
  const reelWidth = this.sceneConfig.symbolWidth;
  const gap = this.sceneConfig.reelGap ?? 0;
  return reelCount * reelWidth + (reelCount - 1) * gap;
}
```

**With current values:**
```
= 5 * 200 + (5 - 1) * 100
= 1000 + 400
= 1400
```

### ReelsView.totalWidth (getter) — `ReelsView.ts:98-101`

```typescript
get totalWidth(): number {
  const reelWidth = this.viewConfig.symbolWidth;
  const gap = this.viewConfig.reelGap ?? 0;
  return this.reelCount * reelWidth + (this.reelCount - 1) * gap;
}
```

**With current values:**
```
= 5 * 200 + (5 - 1) * 100
= 1400
```

**MATCH:** Both formulas agree.

---

## B. Reel Total Height Formula

### SlotScene.calculateReelsHeight() — `SlotScene.ts:1161-1165`

```typescript
private calculateReelsHeight(): number {
  const maxRows = Math.max(...this.slotConfig.layout.rowsPerReel);
  const symbolHeight = this.sceneConfig.symbolHeight;
  const gap = this.sceneConfig.symbolGap ?? 0;
  return maxRows * (symbolHeight + gap);
}
```

**With current values:**
```
= 4 * (200 + 60)
= 4 * 260
= 1040
```

### ReelsView.totalHeight (getter) — `ReelsView.ts:107-111`

```typescript
get totalHeight(): number {
  const maxRows = Math.max(...this.slotConfig.layout.rowsPerReel);
  const symbolHeight = this.viewConfig.symbolHeight;
  const gap = this.viewConfig.symbolGap ?? 0;
  return maxRows * (symbolHeight + gap);
}
```

**With current values:**
```
= 4 * (200 + 60)
= 1040
```

**MATCH:** Both formulas agree.

---

## C. Per-Reel Mask Bounds

### ReelView constructor — `ReelView.ts:71-76`

```typescript
const maskHeight = config.visibleRows * (config.symbolHeight + (config.symbolGap ?? 0));
this.mask.rect(0, 0, config.symbolWidth, maskHeight);
```

**With current values (all reels identical at 4 rows):**
```
maskHeight = 4 * (200 + 60) = 1040
mask = rect(0, 0, 200, 1040)
```

---

## D. Per-Reel Positioning

### ReelsView.createReels() — `ReelsView.ts:601`

```typescript
x: i * (symbolWidth + reelGap),  // i * (200 + 100) = i * 300
y: 0,
```

| Reel | Local X | Local Y | Mask Width | Mask Height |
|------|---------|---------|------------|-------------|
| 0 | 0 | 0 | 200 | 1040 |
| 1 | 300 | 0 | 200 | 1040 |
| 2 | 600 | 0 | 200 | 1040 |
| 3 | 900 | 0 | 200 | 1040 |
| 4 | 1200 | 0 | 200 | 1040 |

Last reel right edge: `1200 + 200 = 1400` ✓ matches `totalWidth`

---

## E. Reels Container Position (Scene Coordinates)

### SlotScene.createReels() — `SlotScene.ts:622-623`

```typescript
x: (this.sceneConfig.width - this.calculateReelsWidth()) / 2,
y: (this.sceneConfig.height - this.calculateReelsHeight()) / 2,
```

```
x = (1920 - 1400) / 2 = 260
y = (1080 - 1040) / 2 = 20
```

### Expected Reels Bounding Rect (Scene Coordinates)

```
{
  x: 260,
  y: 20,
  width: 1400,
  height: 1040,
  right: 1660,
  bottom: 1060
}
```

**Viewport:** 1920 × 1080

The reel area fits within the viewport with:
- **20px** top/bottom margin (very tight)
- **260px** left/right margin

---

## F. Buffer Rows Effect on Strip Height vs Visible Height

### ReelSymbolStrip — `ReelSymbolStrip.ts:18,58-59`

```typescript
private readonly bufferRows: number = 2;  // 2 above, 2 below

get totalSymbolSlots(): number {
  return this.visibleRows + this.bufferRows * 2;  // 4 + 4 = 8
}
```

The symbol strip actually places **8 symbols** per reel (4 visible + 2 buffer above + 2 buffer below).

Total strip pixel height: `8 * slotHeight = 8 * 260 = 2080px`

But only 4 rows (1040px) are visible through the mask. The buffer rows extend **520px above** and **520px below** the mask, invisible to the player.

**This does NOT affect the visible bounding rect**, but the symbols exist in the container and could affect `getBounds()` if called on the unmasked container.

---

## G. Reel Gap Visual Analysis

Each reel is `200px` wide, and reel positions are `300px` apart. This creates a **100px gap** between adjacent reel masks:

```
Reel 0:  [0 ─── 200]       gap       [300 ─── 500]       gap       ...
                      ← 100px →                     ← 100px →
```

The gap is purely empty space — no background fill, no separator lines. Whether this looks correct depends entirely on the frame asset design.

---

## H. DISCREPANCY: Layout slotHeight vs SpinFeel slotHeight

The `ReelSymbolStrip.slotHeight` computes using layout values:
```
slotHeight = 200 + 60 = 260px
```

But the SpinFeel animation math (`getSpinCycleHeight` in `SpinFeelConfig.ts:293-295`) uses:
```
cycleHeight = (symbolHeightPx + symbolGapPx) * stripLength = (140 + 4) * N = 144 * N
```

The `ReelMechanicClassic.update()` scrolls symbols by `spinSpeedPxPerSec * deltaMs / 1000`, and `ReelSymbolStrip.scroll()` uses `slotHeight` (260px) to determine when to recycle symbols.

**Impact:** The scroll speed (2200 px/sec) combined with `slotHeight=260` means each symbol takes `260/2200 = ~118ms` to scroll past. This is independent of `symbolHeightPx`—the SpinFeel `symbolHeightPx` is only used in `getSpinCycleHeight()` for determining full-strip-cycle wrap distance, which is a correctness concern for stop planning rather than a visual sizing concern.

The **visual** impact of the 200×200 symbol cells with 60px gap is that symbols appear very large and widely spaced, which contributes to the "out of frame" appearance if the frame asset was designed for smaller symbols.
