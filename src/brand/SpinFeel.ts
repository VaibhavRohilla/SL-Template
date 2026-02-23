/**
 * Spin Feel Configuration - Template Slot
 *
 * Controls the feel and timing of the slot reel animations.
 * Tuned for visible symbols during spin and smooth, satisfying stops.
 */

import { premiumPreset, type SpinFeelConfig } from '@fnx/sl-engine';

/** SpinFeelConfig plus optional reelStopOrder (supported by engine; type may not be in older package) */
type SpinFeelConfigWithStopOrder = SpinFeelConfig & { reelStopOrder?: number[] };

/**
 * Spin feel configuration
 */
export const spinFeelConfig: SpinFeelConfigWithStopOrder = {
    ...premiumPreset,
    presetName: 'template-premium',

    // Scroll-math units: these drive scroll speed, cycle-height, and stop planning
    // in ReelMechanicClassic — they are intentionally independent of the layout
    // cell size in BrandConfig.dimensions (symbolHeight=200, symbolGap=60).
    symbolHeightPx: 10,
    symbolGapPx: 3,

    // Spin speed – readable symbols while spinning (px/sec)
    spinSpeedPxPerSec: 2200,

    // Per-reel stagger: ms delay before that reel is allowed to stop. [0,0,0,0,0] = no stagger.
    stopDelayMs: [0, 0, 0, 0, 0],

    // Optional: reel stop order (default left-to-right). e.g. [4,3,2,1,0] = right-to-left
    reelStopOrder: [4,3,2,1,0],

    // Minimum spin time so reels don’t stop too abruptly
    minSpinMs: 300,
    maxSpinMs: 10000,

    // Stop deceleration – duration (ms) per reel to slide to stop. Lower = snappier.
    stopDecelMs: 50,
    stopEase: 'cubicOut',

    // Bounce after stop (overshoot then settle)
    bounce: {
        enabled: true,
        amplitudePx: 10,
        settleMs: 140,
        oscillations: 1,
    },
    bounceEase: 'backOut',

    // Snap to grid at end
    snap: {
        thresholdPx: 4,
        durationMs: 40,
    },

    // Audio cues mapped to sound assets
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
