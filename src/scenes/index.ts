/**
 * Custom Scenes
 *
 * Export scene factories for engine customization.
 */

import type { SceneContext, ILoadingScene, IStartScene, IScene, SceneFactories } from 'slot-frontend-engine';
import { CustomLoadingScene } from './CustomLoadingScene.js';
import { CustomStartScene } from './CustomStartScene.js';
import { CustomGameScene } from './CustomGameScene.js';

/**
 * Loading scene factory
 */
export function createLoadingScene(ctx: SceneContext): ILoadingScene {
  return CustomLoadingScene.create(ctx);
}

/**
 * Start scene factory
 */
export function createStartScene(ctx: SceneContext): IStartScene {
  return CustomStartScene.create(ctx);
}

/**
 * Game scene factory - Slingo-style layout matching reference
 */
export function createGameScene(ctx: SceneContext): IScene {
  return CustomGameScene.create(ctx);
}

/**
 * All custom scene factories bundled for engine config
 */
export const sceneFactories: SceneFactories = {
  loading: createLoadingScene,
  start: createStartScene,
  game: createGameScene, // Use CustomGameScene for reference parity
};

export { CustomLoadingScene } from './CustomLoadingScene.js';
export { CustomStartScene } from './CustomStartScene.js';
export { CustomGameScene } from './CustomGameScene.js';

