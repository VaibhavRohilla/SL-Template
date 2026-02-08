/**
 * Game Bootstrap
 * 
 * Wires together the Engine, UI, and Game Logic.
 * This is the production entry point.
 */

import { Game, type GameOptions } from '@fnx/sl-engine';
import { GameBootstrap } from '../app/GameBootstrap';
import { slotConfig } from '../config/slotConfig.js';
import { spinFeelConfig } from './SpinFeel.js';
import { bootConfig as BOOTCONFIG, backgroundConfig, frameConfig, dimensions } from './BrandConfig.js';
import { GameUI } from '../ui/index.js';
import { sceneFactories } from '../scenes/index.js';

export async function bootstrap(): Promise<void> {
    console.log('🚀 Booting Template Slot...');

    // Create game UI handler
    const gameUI = new GameUI({
        initialBalance: 1000.0,
        currencySymbol: '$',
        locale: 'en-US',
        decimals: 2,
    });

    // Game configuration
    const gameOptions: GameOptions = {
        canvas: 'game-canvas',
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: 0x000000,

        // Core Configs
        slotConfig: slotConfig,
        spinFeelConfig: spinFeelConfig,
        bootConfig: BOOTCONFIG,

        // View layers
        background: backgroundConfig,
        frame: frameConfig,

        // UI handlers
        gameUI,
        winFormatter: gameUI,

        // Custom scenes
        scenes: sceneFactories,

        // Log level
        logLevel: 'debug'
    };

    // Initialize GameBootstrap (SDK services)
    const sdk = GameBootstrap.get();
    await sdk.initialize();

    // Create and start game
    const game = new Game(gameOptions);

    try {
        await game.start();
        console.log('✅ Game started successfully');

        // Make game instance available for debugging (DEV ONLY)
        // In production this should be stripped
        // if (import.meta.env?.DEV || typeof window !== 'undefined') {
        //     const { DevControls } = await import('../dev/DevControls.js');
        //     const devControls = new DevControls(game);
        //     devControls.setupKeyboardControls();
        // }

    } catch (error) {
        console.error('❌ Failed to start game:', error);
    }
}
