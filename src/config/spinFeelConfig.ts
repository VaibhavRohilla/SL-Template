/**
 * Spin Feel Configuration - Dragon Blingos
 *
 * Controls the feel and timing of the slot reel animations.
 */

import { premiumPreset, type SpinFeelConfig } from '@fnx/sl-engine';

/**
 * Spin feel configuration for Dragon Blingos.
 * Based on the premium preset with game-specific overrides.
 */
export const spinFeelConfig: SpinFeelConfig = {
  ...premiumPreset,
  presetName: 'dragon-premium',

  // Override symbol dimensions for this game
  symbolHeightPx: 140,
  symbolGapPx: 4,

  // Customize stop timing for 5 reels
  stopDelayMs: [0, 120, 240, 360, 480],

  // Audio cues mapped to Dragon game's sound assets
  audioCues: {
    spinStart: 'ReelStart',
    // Spin loop plays while reels are spinning (fades out on stop)
    spinLoop: 'ReelSpinLoop',
    spinLoopFadeOutMs: 200,
    // Reel stop sounds - array enables rotation (V1→V2→V3→V1→V2...)
    reelStop: ['ReelStop_V1', 'ReelStop_V2', 'ReelStop_V3'],
    anticipation: 'dragon_1',
    winSmall: 'OneWinSpin',
    winMedium: 'BSWin',
    winBig: 'dragon_2',
    winMega: 'MassiveDoorOpen',
  },

  // Satisfying bounce
  bounce: {
    enabled: true,
    amplitudePx: 12,
    settleMs: 140,
    oscillations: 1,
  },

  // Quick snap
  snap: {
    thresholdPx: 4,
    durationMs: 35,
  },
};

export default spinFeelConfig;
