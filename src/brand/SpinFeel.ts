/**
 * Spin Feel Configuration — Template Slot
 *
 * Controls the feel and timing of the slot reel animations.
 * Tuned for visible symbols during spin and smooth, satisfying stops.
 */

import {  type SpinFeelConfig } from '@fnx/sl-engine';

/**
 * Spin feel configuration
 */
export const spinFeelConfig: SpinFeelConfig = {
    presetName: 'template-premium',
    spinSpeedPxPerSec: 3400,
    maxScrollPerFrame: 0.95,
    startDelayMs: 0,
    reelStopOrder: [4, 0, 3, 1, 2],
    // Delay (ms) before each reel is requested to stop. Smaller step = reels stop closer together.
    // [0, 80, 160, 240, 320] = 80 ms between each reel (was 140 ms for a tighter cascade).
    stopDelayMs: [0, 120, 240, 360, 480] ,
    minSpinMs: 800,
    maxSpinMs: 10000,
    spinEase: 'linear',
    stopMotion: {
        style: 'spring',
        durationMs: 480,
        overshootStrength: 1.4,
    },
    snap: {
        thresholdPx: 3,
        durationMs: 35,
    },
    turbo: {
        timeScale: 1.2,
        skipWinAnimations: false,
        stopDelayMs: 60,
    },
    anticipation: {
        enabled: true,
        triggerReelOffset: 1,
        slowdownFactor: 1,
        delayMs: 1,
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
    stopTravelSymbolsMin: 2,
    stopTravelSymbolsMax: 4,
    symbolHeightPx: 100,
    symbolGapPx: 0,
};


