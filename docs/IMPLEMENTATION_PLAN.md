# Implementation Plan - Missing Features

## Critical Features to Implement (P0)

### 1. Choosed Pattern Handling ✅ (Just Added)
- ✅ `updateChoosedSymbol()` method in SlingoCell
- ✅ `updateChoosedTable()` method in SlingoGrid
- ✅ `removeAllChoosed()` method in SlingoGrid
- ⏳ Integration in CustomGameScene when joker/super joker appears

### 2. Win Line Animations (Next Priority)
- Need to create WinLineAnimation component
- AnimatedSprite with textures Popup/Winline/1-13
- Support for:
  - Horizontal lines (0-4): Left to right sweep
  - Vertical lines (5-9): Top to bottom sweep
  - Diagonal lines (10-11): Diagonal sweep
- Timing: Staggered by 1000ms per line
- Duration: REEL_SPEED * 4 for movement, REEL_SPEED * 0.5 for fade

### 3. ExtraSymbols Component
- Dragon logo (Extra/dragon_logo)
- Time display (HH:MM format)
- AM/PM indicator
- Position changes during bonus mode

## Important Features (P1)

### 4. Audio Integration
- BGM (music_loop.mp3)
- SFX (SymbolClick, ReelStop, etc.)
- Mute/unmute functionality

### 5. Background Component
- Verify video background works
- Fallback to static background

## Nice to Have (P2)

### 6. BonusSlot
- Bonus slot machine feature
- Bonus animations

### 7. Popups
- ResultBox
- StakeBox
- MenuBox
- FreeSpinBox

### 8. Purple Gem Feature
- Purple gem indexes
- Purple win font display

## Implementation Order

1. ✅ Choosed pattern handling (DONE)
2. ⏳ Win line animations (IN PROGRESS)
3. ⏳ ExtraSymbols component
4. ⏳ Audio integration
5. ⏳ Background verification
6. ⏳ BonusSlot (if needed)
7. ⏳ Popups (if needed)

