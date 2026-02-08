/**
 * Design Layout - Reference Parity Constants
 *
 * This module encodes the exact layout numbers from the reference (blingo_front)
 * to ensure visual parity with the target game.
 *
 * All values are in design coordinates (1920×1080).
 */

// =============================================================================
// DESIGN SIZE
// =============================================================================

/** Design width in pixels */
export const DESIGN_W = 1920;

/** Design height in pixels */
export const DESIGN_H = 1080;

// =============================================================================
// SYMBOL / CELL DIMENSIONS
// =============================================================================

/** Symbol/cell width (from 'GameTable/Common/cell' texture) */
export const SYMBOL_W = 140;

/** Symbol/cell height */
export const SYMBOL_H = 140;

/** Horizontal gap between grid cells */
export const SYMBOL_GAP_H = 9;

/** Vertical gap between grid cells */
export const SYMBOL_GAP_V = 8;

// =============================================================================
// GRID LAYOUT (5×5 Slingo Grid)
// =============================================================================

/** Number of columns in the grid */
export const GRID_COLS = 5;

/** Number of rows in the grid (Matching Reference) */
export const GRID_ROWS = 4;

/** Total grid width: (140 + 9) * 5 - 9 = 736 */
export const GRID_W = (SYMBOL_W + SYMBOL_GAP_H) * GRID_COLS - SYMBOL_GAP_H;

/** Total grid height: (140 + 8) * 5 - 8 = 732 */
export const GRID_H = (SYMBOL_H + SYMBOL_GAP_V) * GRID_ROWS - SYMBOL_GAP_V;

// =============================================================================
// SPINNER LAYOUT (1-row horizontal spinner below grid)
// =============================================================================

/** Number of spinner reels */
export const SPINNER_REELS = 5;

/** Spinner reel gap (horizontal) */
export const SPINNER_GAP = 9;

/** Spinner visible height (1 symbol) */
export const SPINNER_H = SYMBOL_H; // 140

/** Spinner width: (140 + 9) * 5 - 9 = 736 */
export const SPINNER_W = (SYMBOL_W + SPINNER_GAP) * SPINNER_REELS - SPINNER_GAP;

/** Spinner Y offset from grid top (matching reference: height * 5.5 - 4 = 140 * 5.5 - 4 = 766) */
export const SPINNER_Y_OFFSET = 766; // Matching reference GameTable.ts line 45

// =============================================================================
// COMPONENT POSITIONS (Reference exact values)
// =============================================================================

/**
 * GameTable (grid + spinner) position
 * Reference: x = width * 0.5 - 365.5, y = height * 0.5 - 453 + 7
 */
export const GAME_TABLE_X = DESIGN_W * 0.5 - 365.5; // 594.5
export const GAME_TABLE_Y = DESIGN_H * 0.5 - 453 + 7; // 94

/**
 * BonusInfo panel position (left side)
 * Reference: x = 283, y = 31
 */
export const BONUS_INFO_X = 283;
export const BONUS_INFO_Y = 31;

/** BonusInfo box count */
export const BONUS_INFO_COUNT = 11;

/** BonusInfo box gap */
export const BONUS_INFO_GAP = 9;

/**
 * GameButtons panel position (right side)
 * Reference: x = 1359, y = height * 0.5 - height * 0.5 + 109
 */
export const GAME_BUTTONS_X = 1359;
export const GAME_BUTTONS_Y = 109;

/**
 * GameBottom bar position
 * Reference: y = height - bar.height (anchored to bottom)
 */
export const GAME_BOTTOM_Y_FROM_BOTTOM = 0; // Sits at bottom edge

// =============================================================================
// LAYOUT RECTS - Structured accessors
// =============================================================================

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get layout rect by name
 */
export function layoutRect(name: string): LayoutRect {
  switch (name) {
    case 'background':
      return {
        x: 0,
        y: 0,
        width: DESIGN_W,
        height: DESIGN_H,
      };

    case 'gameTable':
      return {
        x: GAME_TABLE_X,
        y: GAME_TABLE_Y,
        width: GRID_W,
        height: GRID_H + SPINNER_Y_OFFSET - GRID_H + SPINNER_H, // Grid + gap + spinner
      };

    case 'grid':
      return {
        x: GAME_TABLE_X,
        y: GAME_TABLE_Y,
        width: GRID_W,
        height: GRID_H,
      };

    case 'spinner':
    case 'reelWindow':
      return {
        x: GAME_TABLE_X,
        y: GAME_TABLE_Y + SPINNER_Y_OFFSET,
        width: SPINNER_W,
        height: SPINNER_H,
      };

    case 'bonusInfo':
      return {
        x: BONUS_INFO_X,
        y: BONUS_INFO_Y,
        width: 200, // Approximate, depends on asset
        height: 800, // Approximate, 11 boxes
      };

    case 'gameButtons':
      return {
        x: GAME_BUTTONS_X,
        y: GAME_BUTTONS_Y,
        width: 200, // Approximate
        height: 600, // Approximate
      };

    case 'gameBottom':
      return {
        x: 0,
        y: DESIGN_H - 80, // Approximate bar height
        width: DESIGN_W,
        height: 80,
      };

    case 'frame':
      // Frame overlays the entire game table area with padding
      return {
        x: GAME_TABLE_X - 20,
        y: GAME_TABLE_Y - 20,
        width: GRID_W + 40,
        height: GRID_H + SPINNER_Y_OFFSET - GRID_H + SPINNER_H + 40,
      };

    default:
      throw new Error(`Unknown layout rect: ${name}`);
  }
}

// =============================================================================
// COORDINATE HELPERS
// =============================================================================

/**
 * Convert grid cell index to position
 * @param index Cell index (0-24)
 * @returns Position relative to grid container
 */
export function gridCellPosition(index: number): { x: number; y: number } {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return {
    x: col * (SYMBOL_W + SYMBOL_GAP_H),
    y: row * (SYMBOL_H + SYMBOL_GAP_V),
  };
}

/**
 * Convert spinner reel index to position
 * @param index Reel index (0-4)
 * @returns Position relative to spinner container
 */
export function spinnerReelPosition(index: number): { x: number; y: number } {
  return {
    x: index * (SYMBOL_W + SPINNER_GAP),
    y: 0,
  };
}

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

/** Base reel speed multiplier (reference: REEL_SPEED = 0.2) */
export const REEL_SPEED = 0.2;

/** Game container initial scale for reveal animation */
export const GAME_REVEAL_SCALE_START = 0.9;

/** Game container final scale */
export const GAME_REVEAL_SCALE_END = 1.0;

/** Reveal animation duration (REEL_SPEED * 4) */
export const GAME_REVEAL_DURATION_MS = REEL_SPEED * 4 * 1000; // 800ms

/** Delay before reveal starts (REEL_SPEED * 12) */
export const GAME_REVEAL_DELAY_MS = REEL_SPEED * 12 * 1000; // 2400ms

// =============================================================================
// Z-INDEX CONSTANTS
// =============================================================================

export const Z_INDEX = {
  BACKGROUND: 0,
  GAME_LAYER: 1,
  EXTRA_SYMBOLS: 10,
  GAME_BOTTOM: 10,
  DOOR_SYMBOL: 11,
  ROTATE_ALERT: 50,
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  DESIGN_W,
  DESIGN_H,
  SYMBOL_W,
  SYMBOL_H,
  SYMBOL_GAP_H,
  SYMBOL_GAP_V,
  GRID_COLS,
  GRID_ROWS,
  GRID_W,
  GRID_H,
  SPINNER_REELS,
  SPINNER_GAP,
  SPINNER_H,
  SPINNER_W,
  SPINNER_Y_OFFSET,
  GAME_TABLE_X,
  GAME_TABLE_Y,
  BONUS_INFO_X,
  BONUS_INFO_Y,
  GAME_BUTTONS_X,
  GAME_BUTTONS_Y,
  REEL_SPEED,
  Z_INDEX,
  layoutRect,
  gridCellPosition,
  spinnerReelPosition,
};

