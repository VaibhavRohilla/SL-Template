/**
 * Game Configuration - Template Slot
 *
 * Defines the game's symbols, paytable, reels, and layout.
 * This is the primary extension point for game math and mechanics.
 */

import type { SlotConfig } from 'slot-frontend-engine';

/**
 * Symbol IDs - Template Example (Dragon Theme)
 */
export const SymbolId = {
    // Low pay symbols
    FAN: 0,
    LOTUS: 1,
    EIGHT: 2,
    PIG: 3,
    YINYANG: 4,
    // High pay symbols
    BAR: 5,
    EIGHT_AMULET: 6,
    PIG_AMULET: 7,
    // Special symbols
    DRAGON: 8, // Wild
} as const;

/**
 * Main slot configuration
 */
export const slotConfig: SlotConfig = {
    gameId: 'template-slot',
    gameName: 'Template Slot',
    version: '1.0.0',
    evaluationMode: 'lines',
    reelMechanic: 'classic',

    // 5x3 standard layout
    layout: {
        reelCount: 5,
        rowsPerReel: [3, 3, 3, 3, 3],
    },

    // Reel strips
    reels: {
        strips: [
            // Reel 1
            [0, 1, 2, 3, 4, 0, 1, 5, 2, 3, 6, 4, 0, 7, 1, 2, 8, 3, 4, 5, 0, 1, 2, 4],
            // Reel 2
            [1, 2, 3, 4, 0, 5, 1, 2, 6, 3, 0, 4, 7, 1, 2, 3, 5, 0, 4, 8, 1, 2, 3, 4],
            // Reel 3
            [2, 3, 4, 0, 1, 2, 5, 3, 0, 6, 4, 1, 2, 7, 3, 4, 0, 5, 1, 8, 2, 3, 4, 0],
            // Reel 4
            [3, 4, 0, 1, 2, 3, 5, 4, 6, 0, 1, 2, 7, 3, 4, 0, 5, 1, 2, 8, 3, 4, 0, 1],
            // Reel 5
            [4, 0, 1, 2, 3, 5, 4, 0, 6, 1, 2, 3, 7, 4, 0, 5, 1, 2, 8, 3, 4, 0, 1, 2],
        ],
    },

    // Symbol definitions - spriteKeys must match manifest.json asset keys
    symbols: [
        {
            id: SymbolId.FAN,
            name: 'Fan',
            displayType: 'sprite',
            spriteKey: 'FAN',
            isHighValue: false,
        },
        {
            id: SymbolId.LOTUS,
            name: 'Lotus',
            displayType: 'sprite',
            spriteKey: 'LOTUS',
            isHighValue: false,
        },
        {
            id: SymbolId.EIGHT,
            name: 'Eight',
            displayType: 'sprite',
            spriteKey: 'EIGHT',
            isHighValue: false,
        },
        {
            id: SymbolId.PIG,
            name: 'Pig',
            displayType: 'sprite',
            spriteKey: 'PIG',
            isHighValue: false,
        },
        {
            id: SymbolId.YINYANG,
            name: 'Yin Yang',
            displayType: 'sprite',
            spriteKey: 'YINYANG',
            isHighValue: false,
        },
        {
            id: SymbolId.BAR,
            name: 'Bar',
            displayType: 'sprite',
            spriteKey: 'BAR',
            isHighValue: true,
        },
        {
            id: SymbolId.EIGHT_AMULET,
            name: 'Eight Amulet',
            displayType: 'sprite',
            spriteKey: 'EIGHT_AMULET',
            isHighValue: true,
        },
        {
            id: SymbolId.PIG_AMULET,
            name: 'Pig Amulet',
            displayType: 'sprite',
            spriteKey: 'PIG_AMULET',
            isHighValue: true,
        },
        {
            id: SymbolId.DRAGON,
            name: 'Dragon (Wild)',
            displayType: 'sprite',
            spriteKey: 'DRAGON',
            isHighValue: true,
        },
    ],

    // Paytable - payouts for symbol counts (multiplier of bet)
    paytable: [
        { symbolId: SymbolId.FAN, payouts: { '3': 5, '4': 15, '5': 40 } },
        { symbolId: SymbolId.LOTUS, payouts: { '3': 5, '4': 15, '5': 40 } },
        { symbolId: SymbolId.EIGHT, payouts: { '3': 8, '4': 20, '5': 50 } },
        { symbolId: SymbolId.PIG, payouts: { '3': 8, '4': 20, '5': 50 } },
        { symbolId: SymbolId.YINYANG, payouts: { '3': 10, '4': 30, '5': 75 } },
        { symbolId: SymbolId.BAR, payouts: { '3': 15, '4': 50, '5': 150 } },
        { symbolId: SymbolId.EIGHT_AMULET, payouts: { '3': 25, '4': 100, '5': 250 } },
        { symbolId: SymbolId.PIG_AMULET, payouts: { '3': 50, '4': 200, '5': 500 } },
        { symbolId: SymbolId.DRAGON, payouts: { '3': 100, '4': 500, '5': 1000 } },
    ],

    // Wild configuration - Dragon is wild
    wild: {
        wildIds: [SymbolId.DRAGON],
        substitutesForAll: true,
        excludeIds: [], // Substitutes for everything
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

    // Debug/Test flags

};
