/**
 * Main Entry Point - Dragon Blingos
 *
 * Initializes and starts the slot game using the Slot Frontend Engine.
 * Visual parity with reference project (blingo_front).
 */

import { Game, type GameOptions } from 'slot-frontend-engine';
import {
  slotConfig,
  spinFeelConfig,
  bootConfig,
  backgroundConfig,
  frameConfig,
  dimensions,
} from './config/index.js';
import { sceneFactories } from './scenes/index.js';
import { GameUI } from './ui/index.js';

/**
 * Initialize and start the game
 */
async function main(): Promise<void> {
  console.log('🐉 Starting Dragon Blingos...');

  // Create game UI handler
  const gameUI = new GameUI({
    initialBalance: 1000.0,
    currencySymbol: '$',
    locale: 'en-US',
    decimals: 2,
  });

  // Game configuration - using reference 1920×1080 design size
  const gameOptions: GameOptions = {
    canvas: 'game-canvas',
    width: dimensions.width,   // 1920
    height: dimensions.height, // 1080
    backgroundColor: 0x000000, // Black (reference uses black for letterbox)

    // Game config
    slotConfig,
    spinFeelConfig,

    // Boot config
    bootConfig,

    // View layers
    background: backgroundConfig,
    frame: frameConfig,

    // UI handlers (REQUIRED)
    gameUI,
    winFormatter: gameUI,

    // Custom scenes (reference visual parity)
    scenes: sceneFactories,

    // Log level
    logLevel: 'info',
  };

  // Create and start game
  const game = new Game(gameOptions);

  try {
    await game.start();
    console.log('✅ Dragon Blingos started successfully');

    // Make game instance available for debugging (DEV ONLY)
    if (typeof window !== 'undefined') {
      (window as unknown as { game: Game }).game = game;
    }

    // Setup keyboard controls (DEV ONLY)
    setupDevControls(game, gameUI);
  } catch (error) {
    console.error('❌ Failed to start game:', error);
  }
}

/**
 * Development keyboard controls with cheats
 */
function setupDevControls(game: Game, gameUI: GameUI): void {
  if (typeof window === 'undefined') return;

  // Get scene instance for cheats
  const getScene = () => {
    try {
      // Access scene manager via Game API
      const sceneManager = game.getSceneManager?.();
      if (!sceneManager) {
        console.warn('[CHEAT] Scene manager not available');
        return undefined;
      }
      
      // Use currentScene property (getter) from SceneManager
      const scene = (sceneManager as { currentScene?: unknown }).currentScene;
      
      if (!scene) {
        console.warn('[CHEAT] Active scene not found. Current scene ID:', (sceneManager as { currentSceneId?: string }).currentSceneId);
        return undefined;
      }
      
      // Check if scene has cheat methods
      const sceneWithCheats = scene as { 
        cheatSetSpinNumbers?: (nums: number[]) => void;
        cheatSetSpinSymbols?: (symbols: Array<'joker' | 'super_joker' | 'free_spin' | 'dragon' | 'devil' | 'coin'>) => void;
        cheatSetWinNumber?: (num: number) => void;
        cheatSetSpinCount?: (count: number) => void;
        cheatMatchNumbers?: (nums: number[]) => void;
        cheatCompleteWinLine?: (line: number) => void;
        cheatTriggerPurpleGem?: () => void;
        cheatResetGame?: () => void;
        cheatGetState?: () => unknown;
      };
      
      if (!sceneWithCheats.cheatSetSpinNumbers) {
        console.warn('[CHEAT] Scene does not have cheat methods. Scene type:', (scene as { constructor?: { name?: string } }).constructor?.name);
        return undefined;
      }
      
      return sceneWithCheats;
    } catch (error) {
      console.warn('[CHEAT] Could not access scene:', error);
      return undefined;
    }
  };
  
  // Make cheats available globally for console access
  if (typeof window !== 'undefined') {
    (window as unknown as { 
      game: Game;
      cheats?: {
        getScene: () => ReturnType<typeof getScene>;
      };
    }).cheats = {
      getScene,
    };
  }

  document.addEventListener('keydown', async (event) => {
    const scene = getScene();
    
    switch (event.code) {
      // Basic controls
      case 'Space':
        event.preventDefault();
        if (game.isRunning()) {
          await game.spin();
        }
        break;

      case 'KeyT':
        event.preventDefault();
        if (game.isRunning()) {
          await game.spin(undefined, true);
        }
        break;

      case 'KeyR':
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+R: Reset game
          if (scene?.cheatResetGame) {
            scene.cheatResetGame();
            console.log('[CHEAT] Game reset');
          }
        } else {
          // R: Add credits
          gameUI.setBalance(gameUI.getBalance() + 100);
          console.log('[DEV] Added 100 credits');
        }
        break;

      case 'KeyB':
        event.preventDefault();
        const currentBet = gameUI.getCurrentBet();
        const betSteps = slotConfig.betConfig.betSteps ?? [1, 2, 5, 10];
        const currentIndex = betSteps.indexOf(currentBet);
        const nextIndex = (currentIndex + 1) % betSteps.length;
        gameUI.setBet(betSteps[nextIndex] ?? 1);
        console.log(`[DEV] Bet changed to ${gameUI.getCurrentBet()}`);
        break;

      // SIMPLE CHEATS - Just press number keys (1-9, 0)
      case 'Digit1':
        event.preventDefault();
        console.log('[CHEAT] Key 1 pressed, scene:', scene ? 'found' : 'not found');
        if (scene?.cheatSetSpinNumbers) {
          scene.cheatSetSpinNumbers([1, 2, 3, 4, 5]);
          console.log('[CHEAT] Spin: 1, 2, 3, 4, 5');
        } else {
          console.warn('[CHEAT] cheatSetSpinNumbers not available');
        }
        break;
      case 'Digit2':
        event.preventDefault();
        if (scene?.cheatSetSpinNumbers) {
          scene.cheatSetSpinNumbers([10, 20, 30, 40, 50]);
          console.log('[CHEAT] Spin: 10, 20, 30, 40, 50');
        }
        break;
      case 'Digit3':
        event.preventDefault();
        if (scene?.cheatSetSpinSymbols) {
          scene.cheatSetSpinSymbols(['joker', 'joker', 'joker', 'joker', 'joker']);
          console.log('[CHEAT] Spin: All Jokers');
        }
        break;
      case 'Digit4':
        event.preventDefault();
        if (scene?.cheatSetSpinSymbols) {
          scene.cheatSetSpinSymbols(['super_joker', 'super_joker', 'super_joker', 'super_joker', 'super_joker']);
          console.log('[CHEAT] Spin: All Purple Gems');
        }
        break;
      case 'Digit5':
        event.preventDefault();
        if (scene?.cheatSetSpinSymbols) {
          scene.cheatSetSpinSymbols(['dragon', 'dragon', 'dragon', 'dragon', 'dragon']);
          console.log('[CHEAT] Spin: All Dragons');
        }
        break;
      case 'Digit6':
        event.preventDefault();
        if (scene?.cheatSetWinNumber) {
          scene.cheatSetWinNumber(5);
          console.log('[CHEAT] Win number: 5');
        }
        break;
      case 'Digit7':
        event.preventDefault();
        if (scene?.cheatSetSpinCount) {
          scene.cheatSetSpinCount(10);
          console.log('[CHEAT] Spin count: 10');
        }
        break;
      case 'Digit8':
        event.preventDefault();
        if (scene?.cheatCompleteWinLine) {
          scene.cheatCompleteWinLine(0);
          console.log('[CHEAT] Complete line 0');
        }
        break;
      case 'Digit9':
        event.preventDefault();
        if (scene?.cheatTriggerPurpleGem) {
          scene.cheatTriggerPurpleGem();
          console.log('[CHEAT] Purple gem bonus');
        }
        break;
      case 'Digit0':
        event.preventDefault();
        if (scene?.cheatGetState) {
          const state = scene.cheatGetState();
          console.log('[CHEAT] Game state:', state);
        }
        break;
    }
  });

  console.log('[DEV] Keyboard controls:');
  console.log('  Space - Spin');
  console.log('  T - Turbo spin');
  console.log('  R - Add 100 credits');
  console.log('  Shift+R - Reset game');
  console.log('  B - Cycle bet amount');
  console.log('');
  console.log('[CHEAT] Simple number keys:');
  console.log('  1 - Spin: 1,2,3,4,5');
  console.log('  2 - Spin: 10,20,30,40,50');
  console.log('  3 - Spin: All Jokers');
  console.log('  4 - Spin: All Purple Gems');
  console.log('  5 - Spin: All Dragons');
  console.log('  6 - Set win number: 5');
  console.log('  7 - Set spin count: 10');
  console.log('  8 - Complete win line 0');
  console.log('  9 - Trigger purple gem bonus');
  console.log('  0 - Show game state');
}

// Start when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
}

export { main };
