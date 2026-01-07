# Dragon Blingos - Game Design & Logic Documentation

## Table of Contents
1. [Game Overview](#game-overview)
2. [Game Mechanics](#game-mechanics)
3. [Game Flow](#game-flow)
4. [Components](#components)
5. [Symbols & Special Features](#symbols--special-features)
6. [Win Conditions](#win-conditions)
7. [State Management](#state-management)
8. [Animation Sequences](#animation-sequences)
9. [Audio System](#audio-system)
10. [Testing & Cheats](#testing--cheats)

---

## Game Overview

**Dragon Blingos** is a Slingo-style casino game that combines elements of Bingo and Slot machines. Players spin 5 reels to get numbers (1-60) or special symbols, which match against a 5×5 grid of numbers.

### Core Concept
- **Grid**: 5×5 grid (25 cells) with numbers 1-60
- **Spinner**: 5 horizontal reels that spin and stop on numbers or special symbols
- **Objective**: Match numbers on the grid to complete lines (horizontal, vertical, diagonal)
- **Spins**: 10 spins per round
- **Wins**: Based on number of matches (BLINGOS) achieved

---

## Game Mechanics

### 1. Grid System

#### Grid Structure
- **Size**: 5 rows × 5 columns = 25 cells
- **Number Range**: Each cell contains a number from 1-60
- **Cell States**:
  - `NORMAL`: Default state (white background, Dragon Gold font)
  - `SELECTABLE`: Highlighted (green star, Dragon Deep font)
  - `MATCHED`: Matched (red background, dragon animation, then hidden)

#### Cell Indexing
```
Row 0:  0,  1,  2,  3,  4
Row 1:  5,  6,  7,  8,  9
Row 2: 10, 11, 12, 13, 14
Row 3: 15, 16, 17, 18, 19
Row 4: 20, 21, 22, 23, 24
```

### 2. Spinner System

#### Reel Structure
- **Count**: 5 horizontal reels (left to right: 0, 1, 2, 3, 4)
- **Symbol Types**:
  - **Numbers**: 1-60 (displayed as text)
  - **Joker (J)**: Wild symbol (matches any number)
  - **Super Joker (SJ/PG)**: Purple Gem (special bonus)
  - **Free Spin (FS)**: Free spin symbol
  - **Dragon (D)**: Dragon symbol (matches DRAGON symbol on grid)
  - **Red Joker (RJ)**: Devil symbol (matches BAR symbol)
  - **Coin (SJ)**: Super Joker variant

#### Spinner States
- **IDLE**: Not spinning, showing last result
- **SPINNING**: Reels scrolling with blur effect
- **STOPPING**: Reels stopping one by one
- **STOPPED**: All reels stopped, showing results

### 3. Spin Mechanics

#### Spin Process
1. **Start Spin**:
   - Deduct bet from balance
   - Decrement spin count
   - Start reel spinning animation
   - Play spin loop sound

2. **Generate Results**:
   - 80% chance: Random number (1-60)
   - 20% chance: Special symbol (J, SJ, FS, D, RJ, SJ)

3. **Stop Reels**:
   - Reels stop sequentially (150ms delay between each)
   - Play stop sound (varies by spin count: V1, V2, V3)
   - Show result symbol (clear, no blur)

4. **Process Results**:
   - Numbers: Mark matching cells as selectable
   - Jokers: Choose random unmatched cells
   - Special symbols: Match by symbol type

---

## Game Flow

### Round Start
1. Initialize game state:
   - Spin count: 10
   - Win number: 0
   - Grid: All cells in NORMAL state
   - Spinner: Reset to initial state
   - Balance: Deduct bet

2. Display:
   - "SELECT ANY HIGHLIGHTED NUMBER"
   - Spin button: "START GAME"
   - Bonus panel: Reset (all boxes empty)

### During Round

#### Spin Sequence
1. Player clicks "SPIN" or presses Space
2. Spinner starts spinning (blurred numbers)
3. After ~1 second, reels stop with results
4. Results processed:
   - Numbers → Mark matching cells
   - Jokers → Choose random cells
   - Special symbols → Match by type

#### Match Sequence
1. **Selectable State**:
   - Matching cells show green star
   - Font changes to Dragon Deep
   - Player can click to match

2. **Match Animation** (when clicked):
   - Yellow star scales up (0 → 1)
   - Dragon animation plays
   - Text fades out
   - Red background fades in
   - Win number increments

3. **Win Line Detection**:
   - After matches, check for complete lines
   - 12 possible win lines:
     - 5 horizontal (rows 0-4)
     - 5 vertical (columns 0-4)
     - 2 diagonal (TL-BR, TR-BL)

4. **Win Line Animation**:
   - Sweeping effect across completed lines
   - Fade out after display

### Round End

#### End Conditions
- **Spin count reaches 0**: Game over
- **Player clicks "END GAME"**: End early
- **Player clicks "COLLECT"**: Collect winnings (if winNumber > 2)

#### End Game Flow
1. Show "END GAME" or "COLLECT" button
2. If "COLLECT":
   - Calculate win amount
   - Add to balance
   - Reset game for next round
3. If "END GAME":
   - Show game over
   - Reset game for next round

---

## Components

### 1. SlingoGrid
- **Purpose**: 5×5 number grid
- **Features**:
  - Cell state management
  - Match detection
  - Win line detection
  - Animation system (dragon, stars, backgrounds)

### 2. SlingoSpinner
- **Purpose**: 5-reel horizontal spinner
- **Features**:
  - Reel scrolling animation
  - Symbol display (numbers, animated sprites)
  - Match animations
  - Purple gem bonus

### 3. BonusInfoPanel
- **Purpose**: Left panel showing win progress
- **Features**:
  - 11 boxes (1-11 BLINGOS)
  - Symbol display per box
  - Progress highlighting

### 4. GameButtonsPanel
- **Purpose**: Right panel with game controls
- **Features**:
  - Spin button (START GAME / SPIN)
  - Spin count display
  - Stake selector
  - Menu button

### 5. GameBottomBar
- **Purpose**: Bottom HUD bar
- **Features**:
  - Balance display
  - Stake display
  - Description text

### 6. CollectEndButton
- **Purpose**: End game / Collect button
- **Features**:
  - "END GAME" mode (winNumber ≤ 2)
  - "COLLECT" mode (winNumber > 2)
  - Symbol display based on win number

---

## Symbols & Special Features

### Number Symbols (1-60)
- **Type**: `number`
- **Display**: BitmapText (Dragon Gold font)
- **Behavior**: Matches cells with same number
- **Animation**: Yellow star → Dragon → Fade out

### Joker (J)
- **Type**: `joker`
- **Display**: Animated sprite (16 frames, looping)
- **Behavior**: Chooses 3-5 random unmatched cells
- **Visual**: Green stars appear on chosen cells

### Super Joker / Purple Gem (PG)
- **Type**: `super_joker`
- **Display**: Animated sprite (16 frames, looping)
- **Behavior**: 
  - If 3+ appear: Triggers purple gem bonus
  - Shows purple win font animation
  - Updates purple state on reels

### Free Spin (FS)
- **Type**: `free_spin`
- **Display**: Animated sprite (16 frames, looping)
- **Behavior**: Grants free spin (not fully implemented)

### Dragon (D)
- **Type**: `dragon`
- **Display**: Static sprite
- **Behavior**: Matches DRAGON symbol on grid

### Red Joker / Devil (RJ)
- **Type**: `devil`
- **Display**: Animated sprite (16 frames, looping)
- **Behavior**: Matches BAR symbol on grid

### Coin / Super Joker (SJ)
- **Type**: `coin`
- **Display**: Animated sprite (16 frames, looping)
- **Behavior**: Similar to Super Joker

---

## Win Conditions

### Win Number (BLINGOS)
- **Range**: 0-12
- **Calculation**: Number of matched cells
- **Display**: Shown in BonusInfoPanel
- **Effect**: Determines bonus amount and button state

### Win Lines
- **Total**: 12 possible lines
- **Types**:
  - **Horizontal (0-4)**: Complete row
  - **Vertical (5-9)**: Complete column
  - **Diagonal (10)**: Top-left to bottom-right
  - **Diagonal (11)**: Top-right to bottom-left

### Bonus Calculation
- **Formula**: `baseWin = currentStake * 0.5`
- **Total Win**: `baseWin * winNumber`
- **Display**: Shown in Collect button symbol

---

## State Management

### Game State Variables
```typescript
{
  isSpinning: boolean;           // Is spinner currently spinning?
  spinCount: number;              // Remaining spins (0-10)
  winNumber: number;              // Current BLINGOS count (0-12)
  pendingSpinResults: SpinnerReelResult[];  // Results from last spin
  purpleGemIndexes: number[];      // Reel indices with purple gems
  currentStake: number;           // Current bet amount
}
```

### Cell State
```typescript
enum CellState {
  NORMAL = 0,      // Default state
  SELECTABLE = 1,  // Can be clicked
  MATCHED = 2      // Already matched
}
```

### Button States
- **START GAME**: Initial state (spinCount = 10, winNumber = 0)
- **SPIN**: During round (spinCount > 0)
- **END GAME**: Available after spin (winNumber ≤ 2)
- **COLLECT**: Available after spin (winNumber > 2)

---

## Animation Sequences

### 1. Spin Animation
1. Reels start scrolling (blurred numbers)
2. After delay, reels stop sequentially
3. Blur removed, clear symbol shown
4. Cell background fades in

### 2. Match Animation
1. **Yellow Star**: Scales from 0 to 1 (duration: 500ms)
2. **Dragon Animation**: Plays after yellow star completes
3. **Text Fade**: Fades out (duration: REEL_SPEED * 1000ms)
4. **Red Background**: Fades in (parallel with text fade)
5. **Yellow Star Fade**: Fades out after text

### 3. Win Line Animation
1. Sweeping effect across line
2. Fade out after display
3. Duration: ~2 seconds

### 4. Purple Gem Bonus
1. 3+ purple gems trigger bonus
2. Purple win font animation (2 second delay)
3. Update purple state on each reel (500ms stagger)

---

## Audio System

### Sound Effects
- **ReelSpinLoop**: Continuous loop during spin
- **ReelStop_V1/V2/V3**: Reel stop sound (varies by spin count)
- **SymbolClick**: Cell/match sound
- **OneWinSpin**: Win sound
- **dragon_1/dragon_2**: Dragon animation sounds
- **BSWin**: Bonus slot win
- **GameOverFS**: Game over sound

### Audio Channels
- **sfx**: Sound effects
- **bgm**: Background music (not implemented)

---

## Testing & Cheats

### Cheat System
All cheats are accessible via keyboard shortcuts (Shift + Key).

#### Available Cheats

1. **Set Spin Results**:
   - `Shift+1`: Numbers 1,2,3,4,5
   - `Shift+2`: Numbers 10,20,30,40,50
   - `Shift+3`: All Jokers
   - `Shift+4`: All Purple Gems
   - `Shift+5`: All Dragons

2. **Set Win Number**:
   - `Shift+W`: Prompt for win number (0-12)

3. **Set Spin Count**:
   - `Shift+S`: Prompt for spin count

4. **Match Numbers**:
   - `Shift+M`: Prompt for comma-separated numbers to match

5. **Complete Win Line**:
   - `Shift+L`: Prompt for line index (0-11)

6. **Trigger Purple Gem**:
   - `Shift+P`: Force 3 purple gems

7. **Reset Game**:
   - `Shift+R`: Reset game state

8. **Get State**:
   - `Shift+G`: Log current game state to console

### Programmatic Cheats
Access via scene instance:
```typescript
const scene = game.sceneManager.getActiveScene();
scene.cheatSetSpinNumbers([1, 2, 3, 4, 5]);
scene.cheatSetWinNumber(5);
scene.cheatCompleteWinLine(0);
```

---

## Game Design Verification Checklist

### ✅ Core Mechanics
- [x] 5×5 grid with numbers 1-60
- [x] 5-reel horizontal spinner
- [x] 10 spins per round
- [x] Match numbers on grid
- [x] Win line detection (12 lines)

### ✅ Symbols
- [x] Numbers (1-60)
- [x] Joker (J) - wild
- [x] Super Joker (PG) - purple gem
- [x] Free Spin (FS)
- [x] Dragon (D)
- [x] Red Joker (RJ) - devil
- [x] Coin (SJ)

### ✅ Animations
- [x] Spin animation with blur
- [x] Match animation (yellow star → dragon → fade)
- [x] Win line animation
- [x] Purple gem bonus animation

### ✅ UI Components
- [x] Grid display
- [x] Spinner display
- [x] Bonus info panel
- [x] Game buttons panel
- [x] Bottom bar (balance, stake, description)
- [x] Collect/End game button

### ✅ State Management
- [x] Spin count tracking
- [x] Win number tracking
- [x] Cell state management
- [x] Button state management

### ✅ Audio
- [x] Spin loop sound
- [x] Reel stop sounds
- [x] Match sounds
- [x] Win sounds

### ✅ Game Flow
- [x] Round start
- [x] Spin sequence
- [x] Match sequence
- [x] Win line detection
- [x] Round end
- [x] Game reset

---

## Notes

### Implementation Status
- ✅ Core game mechanics implemented
- ✅ All symbols implemented
- ✅ Animations implemented
- ✅ Win line detection implemented
- ⚠️ Free spin feature not fully implemented
- ⚠️ Bonus slot not fully implemented
- ⚠️ Server integration pending (currently using mock data)

### Reference Implementation
This game is based on the reference project: `@rglstudios-blingo_front-d0c9af389d34`

### Testing Recommendations
1. Test all symbol types (numbers, J, PG, FS, D, RJ, SJ)
2. Test win line completion (all 12 lines)
3. Test purple gem bonus (3+ purple gems)
4. Test game reset after round end
5. Test balance updates (bet deduction, win addition)
6. Test edge cases (0 spins, 12 BLINGOS, etc.)

---

**Last Updated**: 2024
**Version**: 1.0.0

