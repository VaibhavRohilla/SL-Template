# Spinner Symbols and Paylines Analysis

## 1. Spinner (Moving Reel) Symbols

### ✅ YES - The spinner DOES have FS, PG, and J symbols

The spinner supports the following special symbols:

| Symbol Type | Code | Reference Key | Animation | Effect |
|------------|------|---------------|-----------|--------|
| **Free Spin** | `free_spin` | `FS` | ✅ Animated (16 frames) | Triggers free spin bonus |
| **Purple Gem** | `super_joker` | `PG` | ✅ Animated (16 frames) | Shows purple gem effect, triggers bonus if 3+ appear |
| **Joker** | `joker` | `J` | ✅ Animated (16 frames) | Shows green stars, allows choosing numbers |
| **Red Joker** | `devil` | `RJ` | ✅ Animated (16 frames) | Shows green stars, allows choosing numbers |
| **Super Joker** | `coin` | `SJ` | ✅ Animated (16 frames) | Shows green stars, allows choosing numbers |
| **Dragon** | `dragon` | `D` | ❌ Static image | Matches all DRAGON cells on grid |

### Symbol Implementation Details

**Animated Symbols (FS, PG, J, RJ, SJ):**
- **Texture Path**: `GameTable/Spin/{SYMBOL}/{SYMBOL}_1` to `GameTable/Spin/{SYMBOL}/{SYMBOL}_16`
- **Animation Speed**: 0.4 (matching reference)
- **Loop**: `true` (continuous animation)
- **Special Effects**:
  - J, RJ, SJ: Show **green stars** (choosed effect)
  - FS, PG: No green stars

**Static Symbol (Dragon):**
- **Texture Path**: `GameTable/Spin/D`
- **Type**: Static sprite (no animation)
- **Effect**: Matches all DRAGON symbol cells on the grid

### Symbol Generation

In `generateSpinResults()`:
- **80% chance**: Regular number (1-60)
- **20% chance**: Special symbol (FS, PG, J, RJ, SJ, D)

## 2. Paylines (Win Lines) Analysis

### What are Paylines in This Game?

**Paylines are NOT traditional slot paylines.** This is a **Slingo/Bingo-style game**, so paylines work differently:

### Payline Structure (12 Total Lines)

The game has **12 win lines** on the 5×5 grid:

#### Horizontal Lines (0-4):
- **Line 0**: Row 0 (cells 0, 1, 2, 3, 4)
- **Line 1**: Row 1 (cells 5, 6, 7, 8, 9)
- **Line 2**: Row 2 (cells 10, 11, 12, 13, 14)
- **Line 3**: Row 3 (cells 15, 16, 17, 18, 19)
- **Line 4**: Row 4 (cells 20, 21, 22, 23, 24)

#### Vertical Lines (5-9):
- **Line 5**: Column 0 (cells 0, 5, 10, 15, 20)
- **Line 6**: Column 1 (cells 1, 6, 11, 16, 21)
- **Line 7**: Column 2 (cells 2, 7, 12, 17, 22)
- **Line 8**: Column 3 (cells 3, 8, 13, 18, 23)
- **Line 9**: Column 4 (cells 4, 9, 14, 19, 24)

#### Diagonal Lines (10-11):
- **Line 10**: Top-left to bottom-right (cells 0, 6, 12, 18, 24)
- **Line 11**: Top-right to bottom-left (cells 4, 8, 12, 16, 20)

### How Paylines Work

1. **Cell Matching**: When spinner lands on a number/symbol, matching cells on the grid are marked
2. **Line Detection**: After all matches are processed, the game checks if any complete lines (5 cells) are formed
3. **Win Animation**: If a complete line is detected, a win line animation sweeps across that line
4. **Visual Feedback**: The animation provides visual confirmation of the win

### Payline Animation

**Animation Details:**
- **Texture**: `Winline_1` to `Winline_13` (or `winline_1` to `winline_13`)
- **Animation Speed**: 0.6
- **Loop**: `true`
- **Stagger**: 1000ms delay between each line animation
- **Duration**: 
  - Movement: `REEL_SPEED * 4` (800ms)
  - Fade out: `REEL_SPEED * 0.5` (100ms)

**Animation Types:**
- **Horizontal (0-4)**: Sweeps left to right, scale (-0.5, 0.5), rotation 0°
- **Vertical (5-9)**: Sweeps top to bottom, scale (-0.5, 0.5), rotation 90°
- **Diagonal (10)**: Sweeps top-left to bottom-right, scale (-0.5, 0.5), rotation 45°
- **Diagonal (11)**: Sweeps top-right to bottom-left, scale (0.5, 0.5), rotation -45°

### Payline Detection Logic

```typescript
// From CustomGameScene.calculateWinLineFromMatch()
// Checks if matched cells form a complete line (all 5 cells)
// Returns win line number (0-11) or null if no complete line
```

**Requirements:**
- Must have **at least 5 matched cells** in a line
- **All 5 cells** in the line must be matched (complete line)
- Multiple lines can win simultaneously

### Payline vs Traditional Slots

| Traditional Slots | This Slingo Game |
|-------------------|------------------|
| Paylines are fixed paths | Paylines are all possible lines (12 total) |
| Symbols must match on payline | Cells must be matched (any order) |
| Win calculated per payline | Win calculated per complete line |
| Paylines shown before spin | Lines detected after matches |
| Multiple paylines can win | Multiple lines can win simultaneously |

## 3. Game Flow with Symbols and Paylines

### Example Flow:

1. **Spin**: Player clicks spin button
2. **Spinner Stops**: Shows 5 results (numbers or symbols)
3. **Cell Matching**: 
   - Numbers → Match cells with that number
   - Symbols → Match cells with that symbol (DRAGON, BAR, etc.)
   - Jokers → Show green stars, allow player to choose
4. **Match Animation**: Each matched cell plays dragon_appear animation
5. **Line Detection**: Game checks if any complete lines (5 cells) are formed
6. **Win Animation**: If lines detected, win line animations sweep across
7. **Win Calculation**: Win amount calculated based on lines and bonus info

## 4. Summary

✅ **Spinner has FS, PG, J symbols**: Yes, all are animated sprites (16 frames each)
✅ **Paylines exist**: 12 total lines (5 horizontal, 5 vertical, 2 diagonal)
✅ **Paylines are visual feedback**: They show which lines won after matches
✅ **Multiple lines can win**: All complete lines trigger animations
✅ **Paylines are not traditional**: They're detected after matches, not fixed paths

