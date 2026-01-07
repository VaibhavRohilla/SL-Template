# Game Screen Parity Target

## Executive Summary

**CRITICAL FINDING**: The REFERENCE (blingo_front) and TEMPLATE (slot-game-template) implement **fundamentally different game types**:

| Aspect | Reference (blingo_front) | Template (slot-game-template) |
|--------|--------------------------|-------------------------------|
| Game Type | **Slingo** (Bingo + Slots hybrid) | **Standard 5-reel Slot** |
| Main Grid | 5×5 fixed number grid | 5×3 spinning reels |
| Spinner | 1-row horizontal spinner (5 symbols) | 5 reels with 3 visible rows each |
| Mechanics | Number matching on grid | Payline/Ways evaluation |

This document captures the visual layout specifications for both to enable future parity work.

---

## Reference Layout Spec (blingo_front)

### Design Size & Scaling

```
DESIGN_WIDTH:  1920
DESIGN_HEIGHT: 1080
Scaling Rule:  FIT (CSS-based letterbox)
```

**Scaling Implementation** (from `main.ts`):
- Renderer always stays at 1920×1080
- CSS styles (`width`/`height`) scale the canvas to fit viewport
- Maintains aspect ratio with letterboxing
- Canvas centered in viewport via CSS `left`/`top`

### Layer Hierarchy (Z-Order Bottom to Top)

```
GameScreen (Container)
├── background (Background) - Video background, centered
├── gameContainer (Container) - pivoted at center for scale animation
│   ├── bonusInfo (BonusInfo) - Left panel, x:283, y:31
│   ├── gameTable (GameTable) - 5×5 grid + spin reel
│   ├── gameButtons (GameButtons) - Right panel, x:1359
│   └── extraSymbols (ExtraSymbols) - zIndex:10
├── gameBottom (GameBottom) - Bottom bar, zIndex:10
├── bonusSlot (BonusSlot) - Bonus mini-game overlay
├── stakeBox (StakeBox) - Popup
├── menuBox (MenuBox) - Popup
├── resultBox (ResultBox) - Popup
├── imagePopUp (ImagePopUp) - Popup
├── animationPopUp (AnimationPopUp) - Popup
├── freeSpinBox (FreeSpinBox) - Popup
├── errorBox (ErrorMessagePopUp) - Popup
├── doorSymbol (DoorSymbol) - zIndex:11
└── rotateAlert (RotateAlert) - zIndex:50
```

### Exact Positions & Sizes (Landscape Mode)

#### Background
```
Position:   x = width / 2, y = height / 2 (centered)
Size:       width = viewport.width, height = viewport.height (FILL)
Type:       Video sprite (background.mp4)
Anchor:     0.5, 0.5 (center)
```

#### Game Container
```
Pivot:      (960, 540) - center of design size
Position:   (960, 540)
Animation:  Scales from 0.9 to 1.0 on game show
```

#### BonusInfo Panel (Left)
```
Position:   x = 283, y = 31
Contents:   11 BonusInfoBox items, vertical stack
Box Gap:    9px vertical
Box Asset:  'BonusInfo/bonus_info_box' (determines size)
```

#### GameTable (5×5 Grid + Spinner)
```
Position:   x = width * 0.5 - 365.5
            y = height * 0.5 - 453 + 7
            = (960 - 365.5, 540 - 446)
            = (594.5, 94)

Contents:
  - 25 GameSymbol cells in 5×5 grid
  - 1 GameSpinTable (spinner) at bottom
```

#### GameSymbol (Grid Cell)
```
Asset:      'GameTable/Common/cell' (background)
Size:       ~140×140px (from texture)
Layout:     x = (index % 5) * (width + 9)
            y = floor(index / 5) * (height + 8)
Gap H:      9px
Gap V:      8px
Grid Total: (140 + 9) * 5 - 9 = 736px wide
            (140 + 8) * 5 - 8 = 732px tall
```

#### GameSpinTable (Horizontal Spinner)
```
Position:   x = 0 (relative to GameTable)
            y = symbolHeight * 5.5 - 4 = 140 * 5.5 - 4 = 766px
Contains:   5 GameSpinReel containers
Reel Gap:   9px horizontal
Mask:       width = (140 + 9) * 5 = 745px, height = 140px
```

#### GameButtons Panel (Right)
```
Position:   x = 1359
            y = height * 0.5 - panel.height * 0.5 + 109
Contents:   menuButton, spinButton, stakeButton, spinNumberButton
Layout:     Vertical stack with gaps
```

#### GameBottom (Bottom Bar)
```
Position:   x = 0, y = height - bar.height
Asset:      'GameBottom/bottom_shadowbar'
Contains:   stakeLabel, stakeValue, description, balanceLabel, balanceValue
```

### Reel Window / Spinner Details

The "reel window" in reference is the **GameSpinTable**:

```
Reel Window Rect (relative to GameTable):
  x:      0
  y:      766 (symbol_height * 5.5 - 4)
  width:  745 ((140 + 9) * 5)
  height: 140

Mask Rect (GameSpinTable):
  x:      0
  y:      0 (relative to spin table)
  width:  (140 + 9) * 5 - 9 = 736px
  height: 140px
```

### Animation & Feel

```javascript
REEL_SPEED = 0.2 // Base timing multiplier for animations

// Spin animation
- Start: back.in(1) easing
- Symbol moves down by 140px per symbol
- Mask clips to single row

// Reel stop stagger
- Sequential stop: reelId 0 → 4
- Delay: 150ms between each reel
- Sound: ReelStop_V1/V2/V3 rotation based on spinCnt % 3
```

---

## Template Current Layout Spec (slot-game-template)

### Design Size & Scaling

```
DESIGN_WIDTH:  1920 (from dimensions.width)
DESIGN_HEIGHT: 1080 (from dimensions.height)
Scaling Rule:  FIT (engine Game.handleResize)
```

**Engine Scaling** (from `Game.ts`):
- Renderer resizes to parent/window size
- Stage scales uniformly to fit
- Offset applied for centering
- Maintains aspect ratio

### Layer Hierarchy (Engine SlotScene)

```
SlotScene (Container)
├── backgroundView (BackgroundView) - solid/image/gradient
├── gameLayer (Container)
│   ├── [frame graphics if no custom frame]
│   └── reelsView (ReelsView) - 5 reels × 3 rows
├── overlayLayer (Container)
│   ├── slotFrameView (SlotFrameView) - if enabled
│   └── winPresenter overlay
└── uiContainer (Container) - for game UI
```

### Current Configuration

```javascript
// From slotConfig.ts
layout: {
  reelCount: 5,
  rowsPerReel: [3, 3, 3, 3, 3],
}

// From themeConfig.ts
dimensions: {
  width: 1920,
  height: 1080,
  symbolWidth: 140,
  symbolHeight: 140,
  symbolGap: 4,
  reelGap: 8,
}

// From spinFeelConfig.ts
symbolHeightPx: 140,
symbolGapPx: 4,
stopDelayMs: [0, 120, 240, 360, 480],
```

### Calculated Reels Dimensions

```
Reel Width:   140px (symbolWidth)
Reel Height:  3 * (140 + 4) = 432px
Reels Total:  5 * 140 + 4 * 8 = 732px wide
              432px tall

Reels Position (centered):
  x = (1920 - 732) / 2 = 594
  y = (1080 - 432) / 2 = 324
```

### Current Issues

1. **No Custom Game Scene**: Template uses engine's default `SlotGameScene`
2. **No 5×5 Grid**: Engine provides 5-reel slot, not Slingo grid
3. **No BonusInfo Panel**: No left-side win progress panel
4. **No Custom GameButtons**: No right-side button panel
5. **No GameBottom Bar**: No bottom HUD bar
6. **Standard Slot Layout**: Vertical spinning reels, not horizontal spinner

---

## Diff List: Reference vs Template

### P0 (Must Fix) - Fundamental Mismatches

| # | Reference Does | Template Does | Impact |
|---|----------------|---------------|--------|
| 1 | 5×5 fixed number grid | 5×3 spinning reels | **Game type mismatch** |
| 2 | 1-row horizontal spinner | 5 vertical reels | **Mechanic mismatch** |
| 3 | BonusInfo left panel at x:283 | No bonus panel | **Missing component** |
| 4 | GameButtons right panel at x:1359 | No button panel | **Missing component** |
| 5 | GameBottom bar at bottom | No bottom HUD | **Missing component** |
| 6 | Video background (mp4) | Solid color background | **Visual mismatch** |
| 7 | Door animation on game show | Direct scene transition | **Animation mismatch** |

### P1 (Polish) - Layout/Feel Adjustments

| # | Reference Does | Template Does | Impact |
|---|----------------|---------------|--------|
| 8 | Symbol gap: 9px H, 8px V | Gap: 4px all | Minor spacing |
| 9 | Reel gap: 9px | Reel gap: 8px | Minor spacing |
| 10 | stop sound rotation V1/V2/V3 | Already matches | ✓ OK |
| 11 | back.in(1) spin easing | Engine easing | Feel difference |
| 12 | gameContainer scale animation | No entry animation | Polish |
| 13 | Popup overlays (result, stake, menu) | No popups | Missing features |

---

## Required Architecture Decision

**The template cannot achieve visual parity with the reference using the engine's default `SlotGameScene`.**

Options:

### Option A: Custom Game Scene (Recommended)
Create a `CustomGameScene` in template that:
1. Implements the Slingo-style 5×5 grid
2. Adds horizontal 1-row spinner
3. Adds BonusInfo, GameButtons, GameBottom panels
4. Matches reference positions exactly

### Option B: Engine Extension
Extend the engine to support "Slingo mode":
1. Add grid-based game scene variant
2. Add configurable reel layout (horizontal spinner)
3. This is a significant engine change

### Option C: Visual Approximation Only
Keep standard slot layout but match:
1. Background (video)
2. Frame positioning
3. UI element positions (as close as possible)
4. Animation feel

**Recommendation**: Option A - Create a custom game scene factory that implements the Slingo layout. This preserves engine architecture while enabling full visual parity.

---

## Next Steps

1. Review this document
2. Decide on architecture approach (A/B/C)
3. Create `docs/GAME_SCREEN_PARITY_ISSUES.md` with root cause analysis
4. Implement chosen approach

---

## Appendix: Asset Mappings

### Reference Asset Keys (GameTable)
```
GameTable/Common/cell         - Grid cell background
GameTable/Common/red_cell     - Matched cell background
GameTable/Common/yellow_star  - Matched effect
GameTable/Common/green_star   - Selectable effect
GameTable/Table/dragon_appear/* - Match animation frames
GameTable/Spin/*              - Spinner symbol assets
```

### Reference Asset Keys (UI)
```
GameButtons/menu              - Menu button
GameButtons/bet_set           - Bet/stake button
GameBottom/bottom_shadowbar   - Bottom bar background
BonusInfo/bonus_info_box      - Bonus panel box
BonusInfo/*_blingo            - Bonus progress labels
```

### Template Asset Keys (Current)
```
Standard slot symbol sprites (FAN, LOTUS, etc.)
No grid/panel assets loaded
```

