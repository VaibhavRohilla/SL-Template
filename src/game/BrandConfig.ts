/**
 * Brand Configuration - Template Slot
 *
 * Visual theme settings (Colors, Fonts, Assets).
 */

import type { BackgroundConfig, SlotFrameConfig, BootConfig } from '@fnx/sl-engine';
import { UI_ASSETS } from '../ui/reference/AssetMap.js';

/**
 * Color palette - Template Example (Gold/Red)
 */
export const colors = {
    // Primary colors
    primary: 0x0d0500, // Gold
    primaryLight: 0x0d0500,
    primaryDark: 0x0d0500,

    // Accent
    accent: 0xc41e3a, // Dragon red
    accentLight: 0xe74c3c,

    // Background colors
    bgDark: 0x000000,
    bgMedium: 0x000000,
    bgLight: 0x000000,

    // Text colors
    textPrimary: 0xffffff,
    textSecondary: 0xcccccc,
    textGold: 0xffd700,

    // UI colors
    success: 0x4ade80,
    warning: 0xfbbf24,
    error: 0xf87171,
} as const;

/**
 * Background configuration for the game scene
 */
export const backgroundConfig: BackgroundConfig = {
    type: 'solid',
    color: colors.bgDark,
    scaleMode: 'cover',
    opacity: 1,
    gradientAngle: 0,
};

/**
 * Slot frame overlay configuration
 */
export const frameConfig: SlotFrameConfig = {
    enabled: true,
    imageKey: UI_ASSETS.SCENE.FRAME,
    anchor: 'center',
    scaleMode: 'fit',
    offset: [0, 0],
    scale: 1,
    zIndex: 100,
    opacity: 1,
};

/**
 * Boot screen configuration (loading + start screens)
 */
export const bootConfig: Partial<BootConfig> = {
    // Boot bundle loads before loading screen appears
    bootBundle: 'boot',
    // Main bundle loads while loading screen is visible
    mainBundle: 'main',

    // Loading screen - engine config
    loading: {
        background: {
            type: 'color',
            value: colors.bgDark,
        },
        logo: {
            type: 'image',
            value: UI_ASSETS.LOADING.LOGO,
            yPositionPct: 0.462,
            maxWidthPct: 0.5,
        },
        loader: {
            type: 'bar',
        },
        labels: {
            showPercent: false,
            showStatus: false,
            textColor: colors.textGold,
            fontFamily: UI_ASSETS.FONTS.MAIN,
            percentFontSize: 18,
            statusFontSize: 14,
        },
    },

    // Start screen - engine config
    start: {
        background: {
            type: 'color',
            value: colors.bgDark,
        },
        logo: {
            type: 'image',
            value: UI_ASSETS.LOADING.LOGO,
            yPositionPct: 0.462,
            maxWidthPct: 0.5,
        },
        ctaText: 'CLICK TO START',
        ctaTextColor: 0xfb0058,
        ctaFontFamily: UI_ASSETS.FONTS.MAIN,
        ctaFontSize: 35,
        ctaPulseAnimation: true,
        requireTap: true,
    },

    // Transition timing
    transitionDurationMs: 500,
    skipStartScreen: false,
};

/**
 * Game dimensions - Standard 1080p
 */
export const dimensions = {
    // Design size (always render at this resolution)
    width: 1920,
    height: 1080,
    // Symbol dimensions
    symbolWidth: 140,
    symbolHeight: 140,
    symbolGap: 4,
    reelGap: 8,
} as const;

/**
 * Custom visual config for reference parity
 * Used by CustomLoadingScene and CustomStartScene
 */
export const referenceVisualConfig = {
    // Split-door background asset keys (must match manifest.json boot bundle)
    Locker: {
        assetKey: UI_ASSETS.LOADING.BACKGROUND,
    },
    // Logo positioning (reference: height/2 - 41px at 1080 height)
    logo: {
        assetKey: UI_ASSETS.LOADING.LOGO,
        yOffset: -41, // Pixels from center
    },
    // Text reveal loader
    loader: {
        text: 'LOADING...',
        fontFamily: UI_ASSETS.FONTS.MAIN,
        fontSize: 35,
        textColor: 0xffffff,
        fillColor: 0xfeee36, // Pink accent
        yOffset: 433, // Pixels below center
    },
    // Start screen CTA
    cta: {
        text: 'CLICK TO START',
        fontFamily: UI_ASSETS.FONTS.MAIN,
        fontSize: 35,
        textColor: 0xffffff,
        fillColor: 0xfeee36,
        yOffset: 433,
    },
    // Door animation
    doorAnimation: {
        durationMs: 2000,
        easing: 'power1.in' as const,
        doorSound: UI_ASSETS.AUDIO.CLICK,
        logoScaleTo: 1.2,
        doorScaleTo: 1.2,
    },
} as const;

export default {
    colors,
    backgroundConfig,
    frameConfig,
    bootConfig,
    dimensions,
    referenceVisualConfig,
};
