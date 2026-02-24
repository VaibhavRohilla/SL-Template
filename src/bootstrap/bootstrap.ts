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
import { DemoResultSource } from '../demo/demoResultSource.js';

const SKIP_ANIMATIONS_STORAGE_KEY = 'slot_skip_animations';
const TURBO_STORAGE_KEY_LEGACY = 'slot_turbo_mode'; // backward compat: read if new key missing
const TURBO_FAST_STORAGE_KEY = 'slot_turbo_fast';

function getSkipAnimations(): boolean {
  try {
    const v = localStorage.getItem(SKIP_ANIMATIONS_STORAGE_KEY);
    if (v !== null) return v === 'true';
    return localStorage.getItem(TURBO_STORAGE_KEY_LEGACY) === 'true';
  } catch {
    return false;
  }
}

function setSkipAnimations(value: boolean): void {
  try {
    localStorage.setItem(SKIP_ANIMATIONS_STORAGE_KEY, value ? 'true' : 'false');
    if (typeof console !== 'undefined') {
      console.log('[SKIP_ANIMATIONS] set to', value);
    }
  } catch {
    // ignore
  }
}

function getTurboFast(): boolean {
  try {
    return localStorage.getItem(TURBO_FAST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setTurboFast(value: boolean): void {
  try {
    localStorage.setItem(TURBO_FAST_STORAGE_KEY, value ? 'true' : 'false');
    if (typeof console !== 'undefined') {
      console.log('[TURBO_FAST] set to', value);
    }
  } catch {
    // ignore
  }
}

export async function bootstrap(): Promise<void> {
  console.log('🚀 Booting Template Slot...');

  const gameUI = new GameUI({
    initialBalance: 1000.0,
    currencySymbol: '$',
    locale: 'en-US',
    decimals: 2,
  });

  const gameOptions: GameOptions = {
    canvas: 'game-canvas',
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: 0x000000,
    slotConfig,
    spinFeelConfig,
    resultSource: new DemoResultSource(slotConfig),
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
  };

  const game = new Game(gameOptions);

  try {
    await game.start();
    hidePrePixiLoader();
    wireSpinButton(game);
    wireSkipAnimationsButton();
    wireTurboFastButton();
    console.log('✅ Game started successfully');
  } catch (error) {
    console.error('❌ Failed to start game:', error);
  }
}

/**
 * Wire the DOM spin button to trigger game.spin(bet, skipAnimations).
 * When Turbo Fast is ON, sets speed profile to 'turbo' before spin (animated but faster).
 */
function wireSpinButton(game: Game): void {
  const spinBtn = document.getElementById('spin-button');
  if (spinBtn && typeof spinBtn.addEventListener === 'function') {
    spinBtn.addEventListener('click', () => {
      if (game.isRunning()) {
        const skipAnimations = getSkipAnimations();
        if (skipAnimations && typeof console !== 'undefined') {
          console.log('[SKIP] enabled → Turbo speed profile ignored for this spin');
        }
        const turboFast = getTurboFast();
        const gameWithProfile = game as Game & { setSpeedProfile?(profile: 'normal' | 'turbo'): void };
        if (typeof gameWithProfile.setSpeedProfile === 'function') {
          gameWithProfile.setSpeedProfile(turboFast ? 'turbo' : 'normal');
        }
        game.spin(undefined, skipAnimations);
      }
    });
  }
}

/**
 * Wire the Skip Animations toggle: persist preference and update button label.
 */
function wireSkipAnimationsButton(): void {
  const btn = document.getElementById('skip-animations-button');
  if (!btn || typeof btn.addEventListener !== 'function') return;

  const updateLabel = (): void => {
    btn.textContent = getSkipAnimations() ? 'Skip Animations ON' : 'Skip Animations OFF';
  };

  updateLabel();
  btn.addEventListener('click', () => {
    setSkipAnimations(!getSkipAnimations());
    updateLabel();
  });
}

/**
 * Wire the Turbo (fast) toggle: persist preference and update button label.
 */
function wireTurboFastButton(): void {
  const btn = document.getElementById('turbo-fast-button');
  if (!btn || typeof btn.addEventListener !== 'function') return;

  const updateLabel = (): void => {
    btn.textContent = getTurboFast() ? 'Turbo ON' : 'Turbo OFF';
  };

  updateLabel();
  btn.addEventListener('click', () => {
    setTurboFast(!getTurboFast());
    updateLabel();
  });
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
