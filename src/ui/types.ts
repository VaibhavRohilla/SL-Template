/**
 * UI Shared Types
 */

import { Texture } from 'pixi.js';

export interface UIComponentOptions {
    width: number;
    height: number;
}

export interface TextureProvider {
    (key: string): Texture | null;
}
