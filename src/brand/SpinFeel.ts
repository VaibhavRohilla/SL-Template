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

    // Symbol dimensions (match layout)
    symbolHeightPx: 140,
    symbolGapPx: 4,

    // Spin speed – readable symbols while spinning (px/sec)
    spinSpeedPxPerSec: 2200,

    // Staggered reel stops (ms delay before each reel is allowed to stop)
    stopDelayMs: [0, 0, 0, 0, 480],

    // Optional: reel stop order (default left-to-right). e.g. [4,3,2,1,0] = right-to-left
    reelStopOrder: [0, 1, 2, 3, 4],

    // Minimum spin time so reels don’t stop too abruptly
    minSpinMs: 600,
    maxSpinMs: 10000,

    // Stop deceleration – duration and easing for smooth slide-in
    stopDecelMs: 280,
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
