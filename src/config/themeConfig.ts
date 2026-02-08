/**
 * Theme Configuration - Dragon Blingos
 *
 * Visual theme settings for the Dragon-themed slot game.
 */

import type { BackgroundConfig, SlotFrameConfig, BootConfig } from '@fnx/sl-engine';

/**
 * Color palette - Dragon Theme (rich reds and golds)
 */
export const colors = {
  // Primary colors
  primary: 0xd4af37, // Gold
  primaryLight: 0xf4d03f,
  primaryDark: 0xa67c00,

  // Accent
  accent: 0xc41e3a, // Dragon red
  accentLight: 0xe74c3c,

  // Background colors
  bgDark: 0xFFFFFF,
  bgMedium: 0x2d1515,
  bgLight: 0x4a2020,

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
  enabled: false, // Disable for now, game uses custom UI
  imageKey: 'Locker',
  anchor: 'center',
  scaleMode: 'fit',
  offset: [0, 0],
  scale: 1,
  zIndex: 100,
  opacity: 1,
};

/**
 * Boot screen configuration (loading + start screens)
 * 
 * NOTE: Engine BootConfig supports basic types. Custom visuals
 * (split-doors, text-reveal loader) are implemented in CustomLoadingScene
 * and CustomStartScene using these reference-matching configs below.
 */
export const bootConfig: Partial<BootConfig> = {
  // Boot bundle loads before loading screen appears
  bootBundle: 'boot',
  // Main bundle loads while loading screen is visible
  mainBundle: 'main',

  // Loading screen - engine config (custom scene overrides visuals)
  loading: {
    background: {
      type: 'color',
      value: colors.bgDark,
    },
    logo: {
      type: 'image',
      value: 'Logo',
      yPositionPct: 0.462,
      maxWidthPct: 0.0,
    },
    loader: {
      type: 'circle',
    },
    labels: {
      showPercent: true,
      showStatus: true,
      textColor: colors.textGold,
      fontFamily: 'Gang',
      percentFontSize: 18,
      statusFontSize: 14,
    },
  },

  // Start screen - engine config (custom scene overrides visuals)
  start: {
    background: {
      type: 'color',
      value: colors.bgDark,
    },
    logo: {
      type: 'image',
      value: 'Logo',
      yPositionPct: 0.462,
      maxWidthPct: 1,
    },
    ctaText: 'CLICK TO START',
    ctaTextColor: 0xfcf243, // Pink to match reference
    ctaFontFamily: 'Gang',
    ctaFontSize: 35,
    ctaPulseAnimation: true,
    requireTap: false, // ALWAYS true in production (audio unlock)
  },

  // Transition timing
  transitionDurationMs: -1,
  skipStartScreen: true,
};

/**
 * Custom visual config for reference parity
 * Used by CustomLoadingScene and CustomStartScene
 */
export const referenceVisualConfig = {
  // Split-door background asset keys (must match manifest.json boot bundle)
  doors: {
    leftImage: 'bg_left',
    rightImage: 'bg_right',
  },
  // Logo positioning (reference: height/2 - 41px at 1080 height)
  logo: {
    assetKey: 'Logo',
    yOffset: -41, // Pixels from center
  },
  // Text reveal loader
  loader: {
    text: 'LOADING...',
    fontFamily: 'fonts/MotleyForces',
    fontSize: 35,
    textColor: 0xffffff,
    fillColor: 0xfcf243, // Pink accent
    yOffset: 433, // Pixels below center
  },
  // Start screen CTA
  cta: {
    text: 'CLICK TO START',
    fontFamily: 'fonts/MotleyForces',
    fontSize: 35,
    textColor: 0xffffff,
    fillColor: 0xfcf243,
    yOffset: 433,
  },
  // Door animation
  doorAnimation: {
    durationMs: 2000,
    easing: 'power1.in' as const,
    doorSound: 'audio/MassiveDoorOpen',
    logoScaleTo: 1.2,
    doorScaleTo: 1.2,
  },
} as const;

/**
 * Game dimensions - matches reference 1920×1080 design size
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

export default {
  colors,
  backgroundConfig,
  frameConfig,
  bootConfig,
  dimensions,
  referenceVisualConfig,
};
