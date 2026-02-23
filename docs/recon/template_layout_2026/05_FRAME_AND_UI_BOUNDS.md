# 05 — Frame and UI Bounds

> **Goal:** Prove whether the decorative frame sprite is aligned/scaled in the same coordinate space as reels, and why things "go out of frame."

---

## A. Frame View Location and Parenting

### SlotScene Layer Hierarchy

**File:** `SlotScene.ts:372-404`

```
SlotScene.container  (label: 'SlotScene')
  ├── BackgroundView.container
  ├── GameLayer  (label: 'GameLayer')
  │     ├── SlotFrameView.container  (when layer='game', added FIRST at index 0)
  │     └── ReelsView.container
  ├── OverlayLayer  (label: 'OverlayLayer')
  │     ├── SlotFrameView.container  (when layer!='game')
  │     └── WinPresenter.overlayContainer
  └── UILayer  (label: 'UILayer')
```

**Current Template config:** `frameConfig.layer = 'game'` (`BrandConfig.ts:50`)

This means the frame is added to `gameLayer` at index 0, and reels are added after. Frame renders **behind** reels.

**Both frame and reels share the same parent container (`gameLayer`)**, so they ARE in the same coordinate space.

---

## B. Frame Initialization and Sizing

### SlotScene.createSlotFrame() — `SlotScene.ts:540-570`

```typescript
// Calculate reels area for frame positioning
const reelsArea = {
  x: (this.sceneConfig.width - this.calculateReelsWidth()) / 2,   // 260
  y: (this.sceneConfig.height - this.calculateReelsHeight()) / 2, // 20
  width: this.calculateReelsWidth(),   // 1400
  height: this.calculateReelsHeight(), // 1040
};

this.slotFrameView.initialize(
  this.sceneConfig.width,    // 1920
  this.sceneConfig.height,   // 1080
  textureResolver,
  reelsArea                  // { x:260, y:20, w:1400, h:1040 }
);
```

### SlotFrameView.applyScaleAndPosition() — `SlotFrameView.ts:112-185`

With `scaleMode: 'fit'` and `anchor: 'center'`:

```typescript
// Step 1: Scale to fit within viewport
const scaleX = this.viewportWidth / texWidth;    // 1920 / texWidth
const scaleY = this.viewportHeight / texHeight;  // 1080 / texHeight
const scale = Math.min(scaleX, scaleY);
this.frame.scale.set(scale);

// Step 2: Get anchor position (uses reelsArea because it was provided)
// anchor='center' → { x: area.x + area.width/2, y: area.y + area.height/2 }
// = { x: 260 + 700, y: 20 + 520 } = { x: 960, y: 540 }

// Step 3: Adjust for anchor
// anchor='center' → x -= scaledWidth/2; y -= scaledHeight/2

// Step 4: Apply offset [0, 0]
this.frame.position.set(x + 0, y + 0);
```

---

## C. THE CORE PROBLEM: Frame scales to VIEWPORT, positions relative to REELS

The frame `scaleMode: 'fit'` scales the frame texture to fit the **viewport** (1920×1080), but then centers it on the **reels area** center point (960, 540).

**If the frame texture is designed to be the same size as the viewport** (e.g., a 1920×1080 image), then:
- `scale = Math.min(1920/1920, 1080/1080) = 1.0`
- Scaled size = 1920 × 1080
- Centered at (960, 540): `x = 960 - 960 = 0`, `y = 540 - 540 = 0`
- Frame fills the entire viewport. **Reels (1400×1040) are smaller than frame.** Frame looks correct as a border.

**If the frame texture is designed to frame just the reels** (e.g., a ~1500×1100 image), then:
- `scale = Math.min(1920/1500, 1080/1100) = Math.min(1.28, 0.982) = 0.982`
- Scaled size = 1473 × 1080
- Centered at (960, 540): `x = 960 - 736 = 224`, `y = 540 - 540 = 0`
- **Frame would be slightly wider than reels but scales to full viewport height.**

The problem is the `scaleMode: 'fit'` always scales relative to the **viewport**, not to the reel area. If the artist designed the frame window (transparent center) to match a specific reel area size, and the viewport is much larger than the reel area, the frame will be too large.

---

## D. reelsArea is Provided but Not Used for Scaling

Looking at `SlotFrameView.applyScaleAndPosition()`:

- **`reelsArea`** is used for **anchor positioning** (`getAnchorPosition()` at line 187-194)
- **`reelsArea`** is **NOT used for scaling** — scaling always uses `viewportWidth`/`viewportHeight`

This means:
1. Frame is scaled to viewport dimensions (1920×1080)
2. Frame is positioned centered on reels area center
3. If the frame's transparent "window" was designed for a smaller reel area, the window won't align

---

## E. Frame is NOT Resized When Scene Resizes

### Searching for resize calls on SlotFrameView:

Grep for `slotFrameView.resize` and `slotFrameView.updateReels` in Engine code: **NO MATCHES FOUND.**

The `SlotFrameView` has `resize()` (line 78) and `updateReelsArea()` (line 90) methods, but **neither is ever called** from `SlotScene`.

`SlotScene` has no resize handler at all — it relies on the stage-level scaling from `App.ts:609-634` (which scales the entire stage uniformly).

**Implication:** On resize, the stage is uniformly scaled, which scales both frame and reels equally. This part is correct. But the initial sizing mismatch (frame scaled to viewport, not to reel area) persists.

---

## F. Fallback Frame (when no custom frame)

### SlotScene.createBackground() — `SlotScene.ts:520-533`

When `frame.enabled` is false, a fallback decorative frame is drawn:

```typescript
const frame = new Graphics();
const reelAreaWidth = reelCount * (symbolWidth + (reelGap ?? 0));
const reelAreaHeight = maxRows * (symbolHeight + (symbolGap ?? 0));
```

**FORMULA BUG in fallback frame:**
```
reelAreaWidth = reelCount * (symbolWidth + reelGap)
             = 5 * (200 + 100)
             = 1500   ← WRONG (should be 1400)
```

Compare to `calculateReelsWidth()`:
```
= reelCount * symbolWidth + (reelCount - 1) * reelGap
= 5 * 200 + 4 * 100
= 1400   ← CORRECT
```

The fallback frame uses `n * (w + gap)` instead of `n * w + (n-1) * gap`, adding one extra `reelGap` to the width. The same bug applies to height (`n * (h + gap)` vs `n * h + (n-1) * gap`):

```
Fallback height = 4 * (200 + 60) = 1040  (happens to match because formula is maxRows*(h+gap) which IS the intended formula for height — rows are stacked differently than columns)
```

Actually for height, the formulas happen to match because `calculateReelsHeight` also uses `maxRows * (symbolHeight + gap)`. So the height bug doesn't manifest. But the width IS off by one `reelGap` (100px).

**This bug only affects the fallback frame, not the custom frame.** Since Template uses a custom frame (`enabled: true`), this doesn't directly cause the reported issue but is worth noting.

---

## G. Coordinate Space Summary

| Component | Parent Container | Coordinate Space | Notes |
|-----------|-----------------|-------------------|-------|
| Background | `SlotScene.container` | Scene root | Sized to viewport (1920×1080) |
| Frame (layer='game') | `GameLayer` | Scene root | Scaled to viewport, positioned at reels center |
| ReelsView | `GameLayer` | Scene root | Positioned at (260, 20) |
| Overlay | `OverlayLayer` | Scene root | Children positioned relative to overlay layer |
| UI | `UILayer` | Scene root | Children positioned by Template |

**All components share the same coordinate space** via the scene root → stage scaling chain. There is no coordinate space mismatch.

The "out of frame" issue is a **sizing mismatch**: the frame asset's transparent window may not match the computed reel area (1400×1040), especially since the frame scales to 1920×1080 (viewport) not to the reel area.
