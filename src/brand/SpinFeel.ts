/**
 * Spin Feel Configuration — Template Slot
 *
 * Controls the feel and timing of the slot reel animations.
 * Tuned for visible symbols during spin and smooth, satisfying stops.
 */

import { premiumPreset, type SpinFeelConfig } from '@fnx/sl-engine';

/**
 * Spin feel configuration
 */
export const spinFeelConfig: SpinFeelConfig = {
    ...premiumPreset,
    presetName: 'template-premium',

    // Scroll-math units: independent of the layout cell size in BrandConfig.dimensions.
    symbolHeightPx: 10,
    symbolGapPx: 3,

    spinSpeedPxPerSec: 5100,

    stopDelayMs: [0, 0, 0, 0, 0],
    reelStopOrder: [0, 1, 2, 3, 4],

    minSpinMs: 400,
    maxSpinMs: 10000,
    startDelayMs: 100,

    stopTravelSymbolsMin: 3,
    stopTravelSymbolsMax: 6,

    snap: {
        thresholdPx: 0,
        durationMs: 0,
    },

    stopMotion: {
        style: 'smooth',
        durationMs: 510,
        ease: 'backOutStrong',
        overshootStrength: 0,
    },

    audioCues: {
        spinStart: 'ReelStart',
        spinLoop: 'ReelSpinLoop',
        spinLoopFadeOutMs: 200,
        reelStop: ['ReelStop_V1', 'ReelStop_V2', 'ReelStop_V3'],
        anticipation: 'dragon_1',
        winSmall: 'OneWinSpin',
        winMedium: 'BSWin',
        winBig: 'dragon_2',
        winMega: 'MassiveDoorOpen',
    },
};
