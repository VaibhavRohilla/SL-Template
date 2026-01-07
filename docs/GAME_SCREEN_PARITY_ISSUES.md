# Game Screen Parity Issues - Root Cause Analysis

## Overview

This document analyzes each mismatch identified in `GAME_SCREEN_PARITY_TARGET.md` and categorizes the root cause to guide implementation.

---

## Issue Categories

1. **Architecture Mismatch** - Fundamental game type difference
2. **Missing Component** - Component doesn't exist in template
3. **Layout System Mismatch** - Different positioning approaches
4. **Asset Mismatch** - Missing or different assets
5. **Animation/Feel Mismatch** - Timing or easing differences

---

## P0 Issues (Must Fix)

### Issue #1: Game Type Mismatch - Grid vs Reels

| Field | Value |
|-------|-------|
| **Category** | Architecture Mismatch |
| **Reference** | 5×5 fixed number grid (`GameTable` + `GameSymbol[]`) |
| **Template** | 5×3 spinning reels (`ReelsView` + `ReelView[]`) |
| **File (Ref)** | `ui/GameScreen/GameTable/GameTable.ts` |
| **File (Tmpl)** | Uses engine's `SlotScene.ts` |
| **Root Cause** | Engine designed for standard slot; reference is Slingo game |
| **Expected Outcome** | Template displays 5×5 grid with numbers that can be matched |

**Analysis:**
```typescript
// Reference: GameTable.ts (lines 34-40)
this.gameTable = new Array(25).fill(null).map((_, index) => {
  const singleSymbol = new GameSymbol(index);
  singleSymbol.x = (index % 5) * (singleSymbol.width + 9);
  singleSymbol.y = Math.floor(index / 5) * (singleSymbol.height + 8);
  // ...
});
```

The reference creates a static 5×5 grid where symbols don't spin - they're numbers that get marked as "matched" when the spinner lands on them.

**Fix Approach:**
- Create `CustomGameScene` with custom `SlingoGrid` component
- Grid shows fixed numbers, not spinning symbols
- Numbers marked/animated when matched

---

### Issue #2: Spinner Type Mismatch

| Field | Value |
|-------|-------|
| **Category** | Architecture Mismatch |
| **Reference** | 1-row horizontal spinner (`GameSpinTable` + `GameSpinReel[]`) |
| **Template** | 5 vertical reels with 3 visible rows |
| **File (Ref)** | `ui/GameScreen/GameTable/GameSpinTable.ts` |
| **File (Tmpl)** | `SlotFEngine/src/view/reels/ReelsView.ts` |
| **Root Cause** | Engine reel system is vertical; reference uses horizontal scroll |
| **Expected Outcome** | Single row of 5 symbols spins horizontally below the grid |

**Analysis:**
```typescript
// Reference: GameSpinTable.ts (lines 52-56)
this.gameSpinTableMask = new Graphics();
this.gameSpinTableMask.drawRect(0, 0, (this.gameSpinTable[0].width + 9) * 5, 140);
// Single row mask, 140px tall
```

```typescript
// Reference: GameSpinReel.ts (line 87-93)
gsap.to(this.isNewReel ? this.reel : this.newReel, {
  y: 140,  // Moves down by symbol height
  duration: REEL_SPEED * 0.5,
});
```

The spinner moves symbols vertically (y direction) but only shows 1 symbol at a time per "reel". This creates a horizontal row of 5 spinners.

**Fix Approach:**
- Create `SlingoSpinner` component with 5 single-symbol reels
- Each reel shows 1 symbol, mask height = 140px
- Spin direction is vertical (symbols drop down)
- Position at `y = grid_height + gap`

---

### Issue #3: Missing BonusInfo Panel

| Field | Value |
|-------|-------|
| **Category** | Missing Component |
| **Reference** | Left panel with 11 progress boxes |
| **Template** | No equivalent component |
| **File (Ref)** | `ui/GameScreen/BonusInfo/BonusInfo.ts` |
| **Position** | x: 283, y: 31 |
| **Root Cause** | Template has no Slingo win-tracking UI |
| **Expected Outcome** | Left panel shows win progress (3→Full House) |

**Analysis:**
```typescript
// Reference: BonusInfo.ts (lines 15-21)
this.bonusInfoBox = new Array(11).fill(null).map((_, index) => {
  const single = new BonusInfoBox(index);
  single.x = 0;
  single.y = index * (single.bonusInfoBackground.height + 9);
  // ...
});
```

11 boxes stacked vertically, tracking bingo completion (3 matches → full house).

**Fix Approach:**
- Create `BonusInfoPanel` component
- 11 stacked boxes using reference assets
- Connect to game state for win progress updates

---

### Issue #4: Missing GameButtons Panel

| Field | Value |
|-------|-------|
| **Category** | Missing Component |
| **Reference** | Right panel with menu, spin, stake, spin-count buttons |
| **Template** | No button panel (engine has no built-in UI) |
| **File (Ref)** | `ui/GameScreen/GameButtons.ts` |
| **Position** | x: 1359, y: height/2 - height/2 + 109 |
| **Root Cause** | Engine delegates UI to game; template hasn't implemented |
| **Expected Outcome** | Right panel with interactive buttons matching reference |

**Analysis:**
```typescript
// Reference: GameButtons.ts resize (lines 51-64)
this.menuButton.x = this.width / 2 - this.menuButton.width / 2 - 6;
this.menuButton.y = 0;

this.spinButton.x = this.width / 2 - this.spinButton.width / 2 - 6;
this.spinButton.y = this.menuButton.height + 47;

this.stakeButton.x = this.width / 2 - this.stakeButton.width / 2 - 6;
this.stakeButton.y = this.spinButton.y + this.spinButton.height + 44;

this.spinNumberButton.x = 0;
this.spinNumberButton.y = this.stakeButton.y + this.stakeButton.height + 73;
```

**Fix Approach:**
- Create `GameButtonsPanel` component
- Match reference button types and layout
- Wire to game state/spin flow

---

### Issue #5: Missing GameBottom HUD

| Field | Value |
|-------|-------|
| **Category** | Missing Component |
| **Reference** | Bottom bar with stake, description, balance |
| **Template** | No bottom HUD |
| **File (Ref)** | `ui/GameScreen/GameBottom.ts` |
| **Position** | x: 0, y: height - bar.height |
| **Root Cause** | Engine has no built-in HUD; template hasn't implemented |
| **Expected Outcome** | Bottom bar showing stake, status text, balance |

**Analysis:**
```typescript
// Reference: GameBottom.ts resize (lines 117-143)
// Positions stake info on left, description center, balance on right
this.stakeLabel.x = this.stakeLabel.width / 2 + 9;
this.description.x = width / 2;
this.balanceUnit.x = width - this.balanceUnit.width / 2 - 12;
```

**Fix Approach:**
- Create `GameBottomBar` component
- Layout: stake (left), description (center), balance (right)
- Use reference asset `'GameBottom/bottom_shadowbar'`

---

### Issue #6: Background Mismatch

| Field | Value |
|-------|-------|
| **Category** | Asset Mismatch |
| **Reference** | Video background (`background.mp4`), FILL mode |
| **Template** | Solid color (`0x1a0a0a`) |
| **File (Ref)** | `ui/GameScreen/Background.ts` |
| **File (Tmpl)** | `config/themeConfig.ts` → `backgroundConfig` |
| **Root Cause** | Template doesn't have/use video asset |
| **Expected Outcome** | Animated video background fills screen |

**Analysis:**
```typescript
// Reference: Background.ts (lines 12-16)
const backgroundTexture = Texture.from('game/Background/background.mp4');
backgroundTexture.baseTexture.resource.loop = true;
this.background = new Sprite(backgroundTexture);
this.background.anchor.set(0.5);
```

**Fix Approach:**
- Add video background asset to template
- Update `backgroundConfig` to use `type: 'video'` (may need engine support)
- Or use static image approximation

---

### Issue #7: Missing Door Animation

| Field | Value |
|-------|-------|
| **Category** | Animation/Feel Mismatch |
| **Reference** | Split-door reveal + game container scale animation |
| **Template** | Direct scene transition with fade |
| **File (Ref)** | `screens/GameScreen.ts` lines 266-298 |
| **Root Cause** | Loading→Start transition done; Game reveal not implemented |
| **Expected Outcome** | Door opens, game container scales from 0.9→1.0 |

**Analysis:**
```typescript
// Reference: GameScreen.ts showGame() (lines 266-298)
this.doorSymbol.showGame();
this.gameContainer.scale.x = 0.9;
this.gameContainer.scale.y = 0.9;

showGameTimeline
  .to(this, { duration: REEL_SPEED * 12 })
  .to([this.gameContainer, this.gameBottom], {
    duration: REEL_SPEED * 4,
    alpha: 1,
  })
  .to(this.gameContainer.scale, {
    duration: REEL_SPEED * 4,
    x: 1, y: 1,
  }, '<');
```

**Fix Approach:**
- In `CustomGameScene.mount()`, implement reveal animation
- Start with `gameContainer.scale = 0.9`, `alpha = 0`
- Animate to `scale = 1`, `alpha = 1`

---

## P1 Issues (Polish)

### Issue #8: Symbol Gap Mismatch

| Field | Value |
|-------|-------|
| **Category** | Layout System Mismatch |
| **Reference** | Gap H: 9px, Gap V: 8px |
| **Template** | Gap: 4px both directions |
| **File (Tmpl)** | `config/themeConfig.ts` line 179 |
| **Expected Outcome** | Gaps match reference |

**Fix:**
```typescript
// themeConfig.ts
symbolGap: 8,  // Was 4
reelGap: 9,    // Was 8
```

But note: this only matters if we implement the grid; engine reels have different gap semantics.

---

### Issue #9: Spin Easing Mismatch

| Field | Value |
|-------|-------|
| **Category** | Animation/Feel Mismatch |
| **Reference** | `back.in(1)` for spin start |
| **Template** | Engine default easing |
| **File (Ref)** | `GameSpinReel.ts` line 339 |
| **Expected Outcome** | Spin-start has slight overshoot feel |

**Analysis:**
```typescript
// Reference: GameSpinReel.ts (lines 335-349)
gsap.to(this.newReel, {
  y: 0,
  duration: REEL_SPEED,
  ease: 'back.in(1)',
});
```

**Fix:**
- Update `spinFeelConfig` start easing if engine supports it
- Or implement custom spin animation in Slingo spinner

---

### Issue #10: Entry Animation Scale

| Field | Value |
|-------|-------|
| **Category** | Animation/Feel Mismatch |
| **Reference** | Game container scales 0.9→1.0 on show |
| **Template** | No scale animation |
| **File (Ref)** | `GameScreen.ts` line 270-298 |
| **Expected Outcome** | Game zooms in slightly on reveal |

**Fix:**
- Add scale animation to `CustomGameScene.mount()`
- Initial scale: 0.9, animate to 1.0 with fade-in

---

## Root Cause Summary

| Category | Count | Issues |
|----------|-------|--------|
| Architecture Mismatch | 2 | #1, #2 |
| Missing Component | 3 | #3, #4, #5 |
| Asset Mismatch | 1 | #6 |
| Animation/Feel Mismatch | 3 | #7, #9, #10 |
| Layout System Mismatch | 1 | #8 |

---

## Implementation Priority

### Phase 3A: Core Architecture (Must Complete First)
1. Create `CustomGameScene` scene factory
2. Implement `SlingoGrid` (5×5 number grid)
3. Implement `SlingoSpinner` (1-row horizontal spinner)

### Phase 3B: UI Panels
4. Implement `BonusInfoPanel` (left)
5. Implement `GameButtonsPanel` (right)
6. Implement `GameBottomBar` (bottom)

### Phase 3C: Visual Polish
7. Add video/image background
8. Add entry animation (scale + fade)
9. Tune spinner easing

### Phase 3D: Feel Parity
10. Match spin timing
11. Match stop stagger
12. Match sound cue timing

---

## Engine Compatibility Notes

The engine (`SlotFEngine`) provides:
- ✅ Scene factory system - can inject `CustomGameScene`
- ✅ TweenService for animations
- ✅ AudioBus for sounds
- ✅ AssetAPI for loading
- ✅ BackgroundView (solid/image/gradient)
- ❌ No video background support (would need to add)
- ❌ No Slingo/grid game mode
- ❌ No horizontal single-row spinner

**Conclusion**: Most work will be in the template's `CustomGameScene`, not engine changes. The engine provides the infrastructure; we build the Slingo-specific components.

---

## Files to Create/Modify

### New Files (Template)
```
src/scenes/CustomGameScene.ts      - Main game scene
src/components/SlingoGrid.ts       - 5×5 number grid
src/components/SlingoSpinner.ts    - 1-row spinner
src/components/BonusInfoPanel.ts   - Left panel
src/components/GameButtonsPanel.ts - Right panel  
src/components/GameBottomBar.ts    - Bottom HUD
src/layout/DesignLayout.ts         - Layout constants module
```

### Modified Files (Template)
```
src/scenes/index.ts     - Add game scene factory
src/config/themeConfig.ts - Update dimensions/gaps
```

### Engine Changes (If Needed)
```
None required for basic parity.
Optional: Add video background support to BackgroundView.
```

