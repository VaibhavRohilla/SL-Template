/**
 * Development Controls
 * 
 * Cheats and keyboard shortcuts for development use.
 * This should ONLY be imported in development environments.
 */

import { Game } from '@fnx/sl-engine';

export class DevControls {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public setupKeyboardControls(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Expose cheats to console
        (window as any).game = this.game;
        (window as any).cheats = this.getCheats();

        console.log('[DEV] Keyboard controls enabled. Press Space to spin.');
    }

    private async handleKeyDown(event: KeyboardEvent): Promise<void> {


        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.game.isRunning()) {
                    await this.game.spin();
                }
                break;

            case 'KeyT':
                event.preventDefault();
                if (this.game.isRunning()) {
                    await this.game.spin(undefined, true);
                }
                break;

            // Add more cheats as needed
        }
    }

    private getCheats(): any {
        return {
            getScene: () => this.getSceneWithCheats(),
        };
    }

    private getSceneWithCheats(): any {
        try {
            // Access scene manager via Game API
            const sceneManager = this.game.getSceneManager?.();
            // @ts-ignore
            return sceneManager?.currentScene;
        } catch (e) {
            return undefined;
        }
    }
}
