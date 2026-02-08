/**
 * Slot Configuration - Dragon Blingos
 *
 * Defines the game's symbols, paytable, reels, and layout.
 */

import type { SlotConfig } from '@fnx/sl-engine';

/**
 * Symbol IDs - Dragon Theme
 */
/**
 * Symbol IDs - Piggy Theme (Matching Reference Project)
 */
export const SymbolId = {
  // Low pay symbols
  NINE: 46,
  TEN: 45,
  JACK: 44,
  QUEEN: 43,
  KING: 42,
  ACE: 41,
  // High pay symbols
  BRONZE_PIGGY: 54,
  SILVER_PIGGY: 53,
  GOLD_PIGGY: 52,
  ROSE_GOLD_PIGGY: 51,
  COPPER_PIGGY: 55,
  // Special symbols
  WILD: 90,
  SCATTER: 91,
} as const;

/**
 * Main slot configuration - Piggy Bank
 */
export const slotConfig: SlotConfig = {
  gameId: 'Piggy Bank',
  gameName: 'Piggy Bank',
  version: '1.0.0',
  evaluationMode: 'lines',
  reelMechanic: 'classic',

  // 5x4 standard layout (Matching Reference)
  layout: {
    reelCount: 5,
    rowsPerReel: [4, 4, 4, 4, 4],
  },

  // Reel strips - Extracted from Reference reelPanel.json
  reels: {
    strips: [
      // Reel 1
      [45, 52, 41, 54, 91, 91, 55, 51, 43, 44, 52, 53, 45, 55, 51, 52, 46, 53, 54, 41, 51, 52, 91, 91, 53, 54, 55, 51, 52, 53, 54, 55, 41, 42, 43, 44, 52, 46, 51, 42, 43, 54, 45, 46, 41, 42, 51, 44, 45, 46, 55, 42, 43, 44, 45, 55, 41, 42, 43, 55, 45, 46, 54, 42, 43, 44, 45, 45],
      // Reel 2
      [51, 52, 53, 54, 91, 91, 55, 51, 52, 53, 51, 55, 51, 52, 53, 54, 55, 51, 52, 91, 91, 53, 43, 55, 43, 54, 53, 54, 42, 41, 43, 51, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 43, 43, 44, 45, 46, 41, 42, 43, 44, 45, 43, 41, 42, 43, 44, 45, 46, 46, 54, 44, 45, 46, 44, 45, 46, 45],
      // Reel 3
      [51, 52, 53, 54, 91, 91, 55, 51, 52, 53, 54, 55, 51, 52, 51, 54, 55, 51, 52, 91, 91, 53, 54, 55, 51, 52, 53, 54, 55, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 41, 46, 41, 42, 43, 44, 45, 53, 41, 53, 55, 41, 43, 46, 45, 46, 45],
      // Reel 4
      [51, 52, 53, 54, 91, 91, 55, 51, 52, 53, 54, 55, 51, 52, 51, 54, 55, 51, 52, 91, 91, 53, 54, 55, 51, 52, 53, 54, 55, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 41, 46, 41, 42, 43, 44, 45, 53, 41, 53, 55, 41, 43, 46, 45, 46, 45],
      // Reel 5
      [51, 52, 53, 54, 91, 91, 55, 51, 52, 53, 54, 55, 51, 52, 51, 54, 55, 51, 52, 91, 91, 53, 54, 55, 51, 52, 53, 54, 55, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 45, 46, 41, 42, 43, 44, 41, 46, 41, 42, 43, 44, 45, 53, 41, 53, 55, 41, 43, 46, 45, 46, 45],
    ],
  },

  // Symbol definitions - spriteKeys must match manifest.json asset keys
  symbols: [
    {
      id: SymbolId.NINE,
      name: 'Nine',
      displayType: 'sprite',
      spriteKey: 'symbols/9',
      isHighValue: false,
    },
    {
      id: SymbolId.TEN,
      name: 'Ten',
      displayType: 'sprite',
      spriteKey: 'symbols/10',
      isHighValue: false,
    },
    {
      id: SymbolId.JACK,
      name: 'Jack',
      displayType: 'sprite',
      spriteKey: 'symbols/J',
      isHighValue: false,
    },
    {
      id: SymbolId.QUEEN,
      name: 'Queen',
      displayType: 'sprite',
      spriteKey: 'symbols/Q',
      isHighValue: false,
    },
    {
      id: SymbolId.KING,
      name: 'King',
      displayType: 'sprite',
      spriteKey: 'symbols/K',
      isHighValue: false,
    },
    {
      id: SymbolId.ACE,
      name: 'Ace',
      displayType: 'sprite',
      spriteKey: 'symbols/A',
      isHighValue: true,
    },
    {
      id: SymbolId.BRONZE_PIGGY,
      name: 'Bronze Piggy',
      displayType: 'sprite',
      spriteKey: 'symbols/Bronze_Piggy',
      isHighValue: true,
    },
    {
      id: SymbolId.SILVER_PIGGY,
      name: 'Silver Piggy',
      displayType: 'sprite',
      spriteKey: 'symbols/Silver_Piggy',
      isHighValue: true,
    },
    {
      id: SymbolId.GOLD_PIGGY,
      name: 'Gold Piggy',
      displayType: 'sprite',
      spriteKey: 'symbols/Gold_Piggy',
      isHighValue: true,
    },
    {
      id: SymbolId.ROSE_GOLD_PIGGY,
      name: 'Rose Gold Piggy',
      displayType: 'sprite',
      spriteKey: 'symbols/Rose_Gold_Piggy',
      isHighValue: true,
    },
    {
      id: SymbolId.COPPER_PIGGY,
      name: 'Copper Piggy',
      displayType: 'sprite',
      spriteKey: 'symbols/high_payout_1_1x', // Map to high payout atlas texture
      isHighValue: true,
    },
    {
      id: SymbolId.WILD,
      name: 'Wild',
      displayType: 'sprite',
      spriteKey: 'symbols/WILD',
      isHighValue: true,
    },
    {
      id: SymbolId.SCATTER,
      name: 'Scatter',
      displayType: 'sprite',
      spriteKey: 'symbols/SCATTER',
      isHighValue: true,
    },
  ],

  // Paytable - payouts for symbol counts (multiplier of bet)
  // Aligned with Reference winTable (values are for 1-coin bet, we use them as multipliers)
  paytable: [
    { symbolId: SymbolId.NINE, payouts: { '3': 5, '4': 10, '5': 100 } },
    { symbolId: SymbolId.TEN, payouts: { '3': 5, '4': 10, '5': 100 } },
    { symbolId: SymbolId.JACK, payouts: { '3': 5, '4': 15, '5': 100 } },
    { symbolId: SymbolId.QUEEN, payouts: { '3': 5, '4': 15, '5': 100 } },
    { symbolId: SymbolId.KING, payouts: { '3': 5, '4': 50, '5': 100 } },
    { symbolId: SymbolId.ACE, payouts: { '3': 5, '4': 50, '5': 100 } },
    { symbolId: SymbolId.BRONZE_PIGGY, payouts: { '3': 5, '4': 50, '5': 150 } },
    { symbolId: SymbolId.SILVER_PIGGY, payouts: { '3': 5, '4': 75, '5': 200 } },
    { symbolId: SymbolId.GOLD_PIGGY, payouts: { '3': 5, '4': 75, '5': 200 } },
    { symbolId: SymbolId.COPPER_PIGGY, payouts: { '3': 5, '4': 75, '5': 200 } }, // H5
    { symbolId: SymbolId.ROSE_GOLD_PIGGY, payouts: { '3': 50, '4': 100, '5': 300 } }, // H2 in ref? mapping L1-L6, H1-H5
    { symbolId: SymbolId.WILD, payouts: { '3': 100, '4': 200, '5': 1000 } },
    { symbolId: SymbolId.SCATTER, payouts: { '3': 0, '4': 0, '5': 0 } },
  ],

  // Wild configuration
  wild: {
    wildIds: [SymbolId.WILD],
    substitutesForAll: true,
    excludeIds: [SymbolId.SCATTER], // Usually wild doesn't substitute for scatter
    multiplier: 1,
  },

  // Bet configuration
  betConfig: {
    minBet: 0.20,
    maxBet: 100.00,
    defaultBet: 1.00,
    betSteps: [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00],
  },

  // Target RTP (informational only)
  targetRtp: 96.5,

  // Paylines - Extracted from Reference initConfig.json
  paylines: [
    { id: 1, pattern: [0, 0, 0, 0, 0] },
    { id: 2, pattern: [1, 1, 1, 1, 1] },
    { id: 3, pattern: [2, 2, 2, 2, 2] },
    { id: 4, pattern: [3, 3, 3, 3, 3] },
    { id: 5, pattern: [1, 2, 1, 2, 1] },
    { id: 6, pattern: [2, 1, 2, 1, 2] },
    { id: 7, pattern: [0, 1, 2, 1, 0] },
    { id: 8, pattern: [3, 2, 1, 2, 3] },
    { id: 9, pattern: [1, 2, 2, 2, 1] },
    { id: 10, pattern: [2, 1, 1, 1, 2] },
    { id: 11, pattern: [0, 0, 1, 0, 0] },
    { id: 12, pattern: [3, 3, 2, 3, 3] },
    { id: 13, pattern: [1, 1, 0, 1, 1] },
    { id: 14, pattern: [2, 2, 3, 2, 2] },
    { id: 15, pattern: [1, 2, 0, 2, 1] },
    { id: 16, pattern: [2, 1, 3, 1, 2] },
    { id: 17, pattern: [0, 1, 1, 1, 0] },
    { id: 18, pattern: [3, 2, 2, 2, 3] },
    { id: 19, pattern: [1, 0, 0, 0, 1] },
    { id: 20, pattern: [2, 3, 3, 3, 2] },
    { id: 21, pattern: [0, 0, 2, 1, 0] },
    { id: 22, pattern: [3, 3, 1, 2, 3] },
    { id: 23, pattern: [1, 1, 1, 2, 1] },
    { id: 24, pattern: [2, 2, 2, 1, 2] },
    { id: 25, pattern: [1, 0, 2, 0, 1] },
    { id: 26, pattern: [2, 3, 1, 3, 2] },
    { id: 27, pattern: [0, 1, 2, 0, 0] },
    { id: 28, pattern: [3, 2, 1, 3, 3] },
    { id: 29, pattern: [1, 2, 1, 1, 1] },
    { id: 30, pattern: [2, 1, 2, 2, 2] },
    { id: 31, pattern: [0, 0, 2, 0, 0] },
    { id: 32, pattern: [3, 3, 1, 3, 3] },
    { id: 33, pattern: [1, 1, 2, 1, 1] },
    { id: 34, pattern: [2, 2, 1, 2, 2] },
    { id: 35, pattern: [0, 1, 0, 1, 0] },
    { id: 36, pattern: [3, 2, 3, 2, 3] },
    { id: 37, pattern: [0, 0, 1, 1, 0] },
    { id: 38, pattern: [3, 3, 2, 2, 3] },
    { id: 39, pattern: [0, 1, 1, 0, 0] },
    { id: 40, pattern: [3, 2, 2, 3, 3] },
    { id: 41, pattern: [0, 1, 0, 0, 0] },
    { id: 42, pattern: [3, 2, 3, 3, 3] },
    { id: 43, pattern: [1, 0, 1, 1, 1] },
    { id: 44, pattern: [2, 3, 2, 2, 2] },
    { id: 45, pattern: [1, 0, 1, 0, 1] },
    { id: 46, pattern: [2, 3, 2, 3, 2] },
    { id: 47, pattern: [0, 0, 0, 1, 0] },
    { id: 48, pattern: [3, 3, 3, 2, 3] },
    { id: 49, pattern: [1, 1, 1, 0, 1] },
    { id: 50, pattern: [2, 2, 2, 3, 2] },
  ],
};

export default slotConfig;
