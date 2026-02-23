/**
 * Game Bootstrap
 *
 * Wires the Engine with config and UI. Uses engine built-in LoadingScene and
 * StartScene; game scene is engine SlotGameScene (reels, symbols, frame).
 */

import { Game, type GameOptions } from '@fnx/sl-engine';
import { slotConfig } from '../config/slotConfig.js';
import { spinFeelConfig } from '../brand/SpinFeel.js';
import { bootConfig as BOOTCONFIG, backgroundConfig, frameConfig, dimensions } from '../brand/BrandConfig.js';
import { GameUI } from '../ui/index.js';

export async function bootstrap(): Promise<void> {
  console.log('🚀 Booting Template Slot...');

  const gameUI = new GameUI({
    initialBalance: 1000.0,
    currencySymbol: '$',
    locale: 'en-US',
    decimals: 2,
  });

  const gameOptions = {
    canvas: 'game-canvas',
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: 0x000000,
    slotConfig,
    spinFeelConfig,
    bootConfig: BOOTCONFIG,
    background: backgroundConfig,
    frame: frameConfig,
    layout: {
      symbolWidth: dimensions.symbolWidth,
      symbolHeight: dimensions.symbolHeight,
      symbolGap: dimensions.symbolGap,
      reelGap: dimensions.reelGap,
    },
    gameUI,
    winFormatter: gameUI,
    logLevel: 'debug',
  } as GameOptions;

  const game = new Game(gameOptions);

  try {
    await game.start();
    hidePrePixiLoader();
    wireSpinButton(game);
    console.log('✅ Game started successfully');
  } catch (error) {
    console.error('❌ Failed to start game:', error);
  }
}

/**
 * Wire the DOM spin button to trigger game.spin()
 */
function wireSpinButton(game: Game): void {
  const spinBtn = document.getElementById('spin-button');
  if (spinBtn && typeof spinBtn.addEventListener === 'function') {
    spinBtn.addEventListener('click', () => {
      if (game.isRunning()) {
        game.spin();
      }
    });
  }
}

/**
 * Hides and removes the pre-Pixi loading wrapper once the game is mounted.
 * Uses both class and DOM removal so the loader is gone regardless of CSS/caching.
 */
function hidePrePixiLoader(): void {
  document.body.classList.add('game-started');
  const wrapper = document.querySelector('.wrapper');
  if (wrapper?.parentElement) {
    wrapper.remove();
  }
}
