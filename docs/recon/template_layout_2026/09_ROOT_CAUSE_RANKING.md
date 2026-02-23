# 09 — Root Cause Ranking

> **Goal:** For each reported issue, rank the root causes with evidence and identify the minimal fix approach.

---

## Issue 1: "Whole thing goes out of the intended frame/window"

### Cause 1 (PRIMARY): Frame scales to viewport, not to reel area

**Evidence:**
- `SlotFrameView.ts:121-127` — `scaleMode: 'fit'` scales frame to `viewportWidth × viewportHeight` (1920×1080)
- `SlotFrameView.ts:187-194` — Anchor positioning uses `reelsArea` center
- The frame texture's transparent "window" was likely designed to match a specific reel area proportion
- Computed reel area: **1400×1040** — but frame is scaled to **1920×1080**
- If the frame texture has a window sized for, say, 70% of its area, the window would be ~1344×756 — misaligned with the 1400×1040 reel area

**Why config isn't respected:** The frame `scaleMode: 'fit'` is respected, but it scales relative to the wrong reference rectangle (viewport instead of reel area). Template has no config field to control what the frame scales against.

**Minimal fix direction:**
- **Engine** — Add a new scaleMode option (e.g., `'fit-reels'`) to `SlotFrameView` that scales the frame to match the `reelsArea` instead of the viewport.
- **OR Template** — Adjust frame texture to have its window match the computed reel area when scaled to viewport.

### Cause 2 (SECONDARY): Large symbol dimensions create tight margins

**Evidence:**
- Reel area: 1400×1040 out of 1920×1080 viewport
- Vertical margin: only **20px** top + bottom = **40px total** (1080 - 1040)
- If any UI elements (buttons, balance display) are positioned in the remaining 20px, they'd overlap or be cut off

**Why config isn't respected:** Config IS respected — these are the correct computed dimensions from `symbolHeight:200 + symbolGap:60`. The values may simply be too large for the viewport.

**Minimal fix direction:**
- **Template** — Reduce `symbolHeight`, `symbolGap`, and/or `reelGap` in `BrandConfig.dimensions` to create more margin. Example: `symbolHeight:160, symbolGap:20, reelGap:40` → reelArea = 960×720 → much more breathing room.

### Cause 3 (MINOR): Fallback frame has off-by-one-gap width bug

**Evidence:**
- `SlotScene.ts:522`: `reelAreaWidth = reelCount * (symbolWidth + reelGap)` = **1500** (wrong)
- `SlotScene.ts:1154-1158`: `calculateReelsWidth()` = **1400** (correct)
- Difference: 100px (one extra reelGap)

**Why:** The fallback frame at line 522 uses `n*(w+gap)` instead of `n*w + (n-1)*gap`. Not triggered when custom frame is enabled, but indicates inconsistent geometry thinking.

**Minimal fix direction:**
- **Engine** — Fix formula at `SlotScene.ts:522` to use `calculateReelsWidth()`.

---

## Issue 2: "Reel gap not adjustable even though it exists in config"

### Cause 1 (PRIMARY): Frame doesn't adapt to reel area changes

**Evidence:**
- `reelGap` flows correctly through entire pipeline (see `06_OVERRIDE_POINTS.md`)
- Changing `reelGap` DOES change reel positions: `ReelsView.ts:601` — `x: i * (symbolWidth + reelGap)`
- But frame stays the same: `SlotFrameView.ts:121-127` — frame scale is independent of reel dimensions
- So changing `reelGap` changes where reels are, but the frame window doesn't follow

**Why it appears "not adjustable":** The gap IS applied, but the frame mask/window doesn't resize to match, so the visual relationship between reels and frame breaks. The user sees reels move but the frame stays fixed → perceived as "not working."

**Minimal fix direction:**
- **Engine** — Make `SlotFrameView` consume `reelsArea` for scaling (not just positioning). When reel area changes, frame should adapt.
- **OR Engine** — Recalculate and pass updated `reelsArea` to `SlotFrameView.updateReelsArea()` after layout changes.

### Cause 2 (SECONDARY): No visual indicator of the gap

**Evidence:**
- The gap is transparent empty space between reel masks
- No separator lines, no fill, no visual cue
- If the frame covers the gap area, it's invisible

**Minimal fix direction:**
- **Template** — Purely visual; could add separators or background strips if desired.

---

## Issue 3: "Layout customization via config not consistently applied"

### Cause 1 (PRIMARY): SpinFeel has SEPARATE dimension values

**Evidence:**
- `BrandConfig.ts:110-111` — `symbolHeight: 200`, `symbolGap: 60` (layout)
- `SpinFeel.ts:21-22` — `symbolHeightPx: 140`, `symbolGapPx: 4` (scroll animation)
- These are consumed by different subsystems and never cross-checked
- `ReelSymbolStrip.slotHeight` uses layout value (260px) while `getSpinCycleHeight` uses SpinFeel value (144px)
- This creates a disconnect between the visual cell size and the scroll cycle

**Why config isn't respected:** Both configs ARE individually respected. But the user expects ONE set of dimensions. Having two creates confusion about which is "the" config.

**Minimal fix direction:**
- **Template** — Either derive SpinFeel values from BrandConfig dimensions, or document clearly that SpinFeel dimensions are independent scroll-animation parameters.
- **Engine** — Consider consuming `sceneLayout` values in the scroll path and removing `symbolHeightPx`/`symbolGapPx` from SpinFeel. This would make Template config the single source of truth.

### Cause 2 (SECONDARY): Multiple fallback default layers create ambiguity

**Evidence:** Defaults exist at 4 levels:
1. `App.ts:375-378` — `?? 140, ?? 140, ?? 5, ?? 10`
2. `SlotGameScene.ts:51-56` — `140, 140, 5, 10`
3. `SlotScene.ts:146-154` — `150, 150, 5, 10`
4. `ReelsViewConfig` — optional fields with `?? 0`

The defaults at levels 1, 2, and 3 **disagree** (140 vs 150 for symbolWidth/Height). While these are never triggered when Template provides values, they create confusion for developers reading the code.

**Minimal fix direction:**
- **Engine** — Consolidate defaults to a single location. Use `App.ts:375-378` as the sole fallback and remove redundant defaults elsewhere.

---

## Issue 4: "Game feels laggy / not smooth"

### Cause 1 (PRIMARY): Double TweenService.update() per frame

**Evidence:**
- `App.ts:639-646` — App's update loop calls `tweenService.update(deltaMs)`
- `SlotScene.ts:475-490` — SlotScene's update (called via SceneManager) also calls `tweenService.update(deltaMs)`
- Same TweenService singleton receives 2× deltaMs per frame
- All tween-based animations run at **double speed**: stop deceleration (280ms → ~140ms actual), bounce (140ms → ~70ms), snap (40ms → ~20ms)
- Animations completing too fast feels "jerky" — perceived as laggy

**Why it's not a config issue:** This is a code bug in the Engine's update loop, not a config problem.

**Minimal fix direction:**
- **Engine** — Remove the duplicate `tweenService.update()` call from either `App.ts:645` or `SlotScene.ts:486`. The `SlotScene` call is more appropriate since it's co-located with other scene updates.

### Cause 2 (SECONDARY): HiDPI resolution with antialias on mobile

**Evidence:**
- `App.ts:264-266` — `resolution: window.devicePixelRatio || 1, antialias: true`
- On 2× displays: 3840×2160 backing buffer with MSAA
- On 3× displays: 5760×3240 backing buffer with MSAA
- GPU fill rate scales quadratically

**Minimal fix direction:**
- **Engine** — Cap resolution at 2 (`Math.min(window.devicePixelRatio, 2)`) and consider making `antialias` configurable via `GameOptions`.

### Cause 3 (MINOR): Unnecessary DI lookup every frame

**Evidence:**
- `App.ts:643-644`:
  ```typescript
  const services = getTypedServices(this.container);
  services.tweenService.update(ticker.deltaMS);
  ```
- `getTypedServices()` is called every frame in the game loop

**Minimal fix direction:**
- **Engine** — Cache the services reference after initialization instead of looking it up every frame.

---

## Summary Matrix

| Issue | Root Cause | Severity | Fix In | Blocked By |
|-------|-----------|----------|--------|------------|
| Out of frame | Frame scales to viewport not reel area | **Critical** | Engine (SlotFrameView) | — |
| Out of frame | Symbol dims too large for viewport | Medium | Template (BrandConfig) | — |
| reelGap broken | Frame doesn't adapt to reel area | **Critical** | Engine (SlotFrameView) | Same as above |
| Config inconsistent | SpinFeel has separate dimensions | **High** | Template + Engine | Design decision needed |
| Config inconsistent | Multiple conflicting default layers | Low | Engine | — |
| Laggy | Double TweenService update | **Critical** | Engine (App.ts) | — |
| Laggy | HiDPI + antialias | Medium | Engine (App.ts) | — |
