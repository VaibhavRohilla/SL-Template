# Cheats Guide - Dragon Blingos

## Overview
This guide explains how to use the cheat system for testing and development.

## Keyboard Shortcuts

### Basic Controls
- `Space` - Spin
- `T` - Turbo spin
- `R` - Add 100 credits
- `Shift+R` - Reset game
- `B` - Cycle bet amount

### Simple Cheat Keys (Just press the number!)

#### Spin Result Cheats
- `1` - Set spin to numbers: 1, 2, 3, 4, 5
- `2` - Set spin to numbers: 10, 20, 30, 40, 50
- `3` - Set spin to all Jokers (J)
- `4` - Set spin to all Purple Gems (PG/SJ)
- `5` - Set spin to all Dragons (D)

#### Game State Cheats
- `6` - Set win number to 5
- `7` - Set spin count to 10
- `8` - Complete win line 0 (horizontal)
- `9` - Trigger purple gem bonus
- `0` - Show current game state (console)

## Console Access

You can also access cheats programmatically via the browser console:

```javascript
// Get scene instance
const scene = window.cheats?.getScene();

// Set spin results to specific numbers
scene?.cheatSetSpinNumbers([1, 2, 3, 4, 5]);

// Set spin results to specific symbols
scene?.cheatSetSpinSymbols(['joker', 'super_joker', 'free_spin', 'dragon', 'dragon']);

// Set win number
scene?.cheatSetWinNumber(5);

// Set spin count
scene?.cheatSetSpinCount(10);

// Match specific numbers
scene?.cheatMatchNumbers([1, 2, 3]);

// Complete a win line
scene?.cheatCompleteWinLine(0); // Horizontal line 0

// Trigger purple gem bonus
scene?.cheatTriggerPurpleGem();

// Reset game
scene?.cheatResetGame();

// Get current state
const state = scene?.cheatGetState();
console.log(state);
```

## Testing Scenarios

### Test All Symbols
1. Press `3` - Test Jokers
2. Press `4` - Test Purple Gems
3. Press `5` - Test Dragons
4. Spin and verify animations

### Test Win Lines
1. Press `8` - Complete horizontal line 0
2. Verify win line animation

### Test Purple Gem Bonus
1. Press `9` - Trigger purple gem bonus
2. Spin to see purple win font animation
3. Verify purple state updates on reels

### Test Win Number
1. Press `6` - Set win number to 5
2. Verify bonus panel updates
3. Verify Collect button appears (if winNumber > 2)

### Test Game Reset
1. Play a round
2. Press `Shift+R` - Reset game
3. Verify all state resets correctly

## Cheat Method Reference

### `cheatSetSpinNumbers(numbers: number[])`
Sets the next spin results to specific numbers.
- **Parameters**: Array of 5 numbers (1-60)
- **Example**: `cheatSetSpinNumbers([1, 2, 3, 4, 5])`

### `cheatSetSpinSymbols(symbols: Array<SymbolType>)`
Sets the next spin results to specific symbols.
- **Parameters**: Array of 5 symbol types
- **Symbol Types**: `'joker'`, `'super_joker'`, `'free_spin'`, `'dragon'`, `'devil'`, `'coin'`
- **Example**: `cheatSetSpinSymbols(['joker', 'joker', 'joker', 'joker', 'joker'])`

### `cheatSetWinNumber(winNumber: number)`
Sets the current win number (BLINGOS count).
- **Parameters**: Number (0-12)
- **Example**: `cheatSetWinNumber(5)`

### `cheatSetSpinCount(count: number)`
Sets the remaining spin count.
- **Parameters**: Number (0-10)
- **Example**: `cheatSetSpinCount(5)`

### `cheatMatchNumbers(numbers: number[])`
Forces match of specific numbers on the grid.
- **Parameters**: Array of numbers to match
- **Example**: `cheatMatchNumbers([1, 2, 3])`

### `cheatMatchCells(cellIndices: number[])`
Forces match of specific cells by index.
- **Parameters**: Array of cell indices (0-24)
- **Example**: `cheatMatchCells([0, 1, 2, 3, 4])`

### `cheatCompleteWinLine(lineIndex: number)`
Completes a win line by matching all cells in that line.
- **Parameters**: Line index (0-11)
- **Example**: `cheatCompleteWinLine(0)`

### `cheatTriggerPurpleGem()`
Forces 3 purple gems to appear (triggers bonus).
- **Parameters**: None
- **Example**: `cheatTriggerPurpleGem()`

### `cheatResetGame()`
Resets the game to initial state.
- **Parameters**: None
- **Example**: `cheatResetGame()`

### `cheatGetState()`
Returns current game state object.
- **Returns**: Object with `spinCount`, `winNumber`, `isSpinning`, `currentStake`, `purpleGemIndexes`, `pendingSpinResults`
- **Example**: `const state = cheatGetState()`

## Notes

- Cheats only work when the game scene is active
- Some cheats require the game to not be spinning
- All cheat methods log to console for debugging
- Cheats are for development/testing only - remove in production

---

**Last Updated**: 2024
**Version**: 1.0.0

