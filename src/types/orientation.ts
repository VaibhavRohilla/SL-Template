/**
 * Orientation types aligned with @fnx/sl-engine (see SL-Engine docs/ORIENTATION_PRODUCTION_AUDIT.md).
 * When the template depends on an SDK build that exports these from the package, switch to:
 *   import type { ViewOrientationPayload, OrientationConfig } from '@fnx/sl-engine';
 *   import { DEFAULT_ORIENTATION_BREAKPOINT_PX } from '@fnx/sl-engine';
 * and remove this file.
 */

import type { BackgroundConfig, SlotFrameConfig } from '@fnx/sl-engine';

export type ViewOrientation = 'landscape' | 'portrait';

export interface ViewOrientationPayload {
  orientation: ViewOrientation;
  viewportWidth: number;
  viewportHeight: number;
  designWidth: number;
  designHeight: number;
}

export interface ViewportViewConfig {
  width: number;
  height: number;
  layout?: {
    symbolWidth?: number;
    symbolHeight?: number;
    symbolGap?: number;
    reelGap?: number;
  };
  background?: BackgroundConfig;
  frame?: SlotFrameConfig;
}

export interface OrientationConfig {
  enabled?: boolean;
  breakpointPx?: number;
  landscape?: ViewportViewConfig;
  portrait?: ViewportViewConfig;
}

/** Default breakpoint (px): viewport width >= this = landscape, below = portrait. Matches SDK DEFAULT_ORIENTATION_BREAKPOINT_PX. */
export const DEFAULT_ORIENTATION_BREAKPOINT_PX = 768;
