/**
 * Brand Configuration - Template Slot
 *
 * Visual theme and boot config for engine LoadingScene, StartScene, and game scene.
 */

import type { BackgroundConfig, SlotFrameConfig, BootConfig } from '@fnx/sl-engine';
import type { OrientationConfig } from '../types/orientation.js';
import { DEFAULT_ORIENTATION_BREAKPOINT_PX } from '../types/orientation.js';
import { UI_ASSETS } from '../ui/reference/AssetMap.js';

/**
 * Color palette - Template Example (Gold/Red)
 */
export const colors = {
  primary: 0x0d0500,
  primaryLight: 0x0d0500,
  primaryDark: 0x0d0500,
  accent: 0xc41e3a,
  accentLight: 0xe74c3c,
  bgDark: 0x000000,
  bgMedium: 0x000000,
  bgLight: 0x000000,
  textPrimary: 0xffffff,
  textSecondary: 0xcccccc,
  textGold: 0xffd700,
  success: 0x4ade80,
  warning: 0xfbbf24,
  error: 0xf87171,
} as const;

/**
 * Background for the game scene (engine SlotGameScene).
 * Use image for a visible themed background; solid black (0x000000) is invisible on the default canvas.
 */
export const backgroundConfig: BackgroundConfig = {
  type: 'image',
  imageKey: UI_ASSETS.SCENE.BACKGROUND,
  scaleMode: 'cover',
  opacity: 1,
  gradientAngle: 0,
};

/**
 * Frame overlay for the game scene (asset key must exist in manifest).
 * layer: 'game' draws frame behind reels so symbols show on top (for opaque-center assets).
 * Cast to SlotFrameConfig so layer is accepted when engine package includes it.
 */
export const frameConfig = {
  enabled: true,
  imageKey: UI_ASSETS.SCENE.FRAME,
  layer: 'game' as const,
  anchor: 'center' as const,
  scaleMode: 'fill' as const,
  offset: [0, 40] as [number, number],
  scale: 1,
  zIndex: 100,
  opacity: 1,
} as SlotFrameConfig;

/**
 * Boot config for engine LoadingScene and StartScene.
 * bootBundle loads first; mainBundle loads while loading screen is visible.
 */
export const bootConfig: Partial<BootConfig> = {
  bootBundle: 'boot',
  mainBundle: 'main',
  loading: {
    background: { type: 'color', value: colors.bgDark },
    logo: {
      type: 'image',
      value: UI_ASSETS.LOADING.LOGO,
      yPositionPct: 0.462,
      maxWidthPct: 0.5,
    },
    loader: { type: 'bar' },
    labels: {
      showPercent: false,
      showStatus: false,
      textColor: colors.textGold,
      fontFamily: UI_ASSETS.FONTS.MAIN,
      percentFontSize: 18,
      statusFontSize: 14,
    },
  },
  start: {
    background: { type: 'color', value: colors.bgDark },
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
  transitionDurationMs: 500,
  skipStartScreen: false,
};

/**
 * Game dimensions (viewport). Game scene uses engine defaults for symbol layout.
 */
export const dimensions = {
  width: 1920,
  height: 1080,
  symbolWidth: 180,
  symbolHeight: 150,
  symbolGap: 10,
  reelGap: 70,
} as const;

/**
 * Orientation detection and per-orientation view config.
 * When landscape/portrait are set, the engine switches background, frame, and layout on orientation change.
 * Also emits 'view:orientationChange' and calls onOrientationChange hook for bet bar / custom UI.
 */
export const orientationConfig: OrientationConfig = {
  enabled: true,
  breakpointPx: DEFAULT_ORIENTATION_BREAKPOINT_PX,
  landscape: {
    width: dimensions.width,
    height: dimensions.height,
    layout: {
      symbolWidth: dimensions.symbolWidth,
      symbolHeight: dimensions.symbolHeight,
      symbolGap: dimensions.symbolGap,
      reelGap: dimensions.reelGap,
    },
    background: backgroundConfig,
    frame: frameConfig,
  },
  portrait: {
    width: 1080,
    height: 1920,
    layout: {
      symbolWidth: 140,
      symbolHeight: 120,
      symbolGap: 8,
      reelGap: 40,
    },
    background: {
      type: 'image',
      imageKey: UI_ASSETS.SCENE.BACKGROUND_PORTRAIT,
      scaleMode: 'cover',
      opacity: 1,
      gradientAngle: 0,
    },
    frame: {
      ...frameConfig,
      offset: [0, 20] as [number, number],
    },
  },
};

export default {
  colors,
  backgroundConfig,
  frameConfig,
  bootConfig,
  dimensions,
  orientationConfig,
};
