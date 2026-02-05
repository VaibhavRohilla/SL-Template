/**
 * Slot UI Shell
 * 
 * Orchestrates the standard slot interface elements.
 * 
 * Layout:
 * - TopBar (Top)
 * - Sidebar/Overlay (optional)
 * - BottomPanel (Bottom)
 */

import { Container } from 'pixi.js';
import type { TextureProvider } from './types.js';
import { TopBar } from './components/TopBar.js';
import { BottomPanel } from './components/BottomPanel.js';
import type { GameUI } from './GameUI.js';

export class SlotUIShell extends Container {
    private readonly layoutWidth: number;
    private readonly layoutHeight: number;
    private readonly resolveTexture: TextureProvider;

    public topBar!: TopBar;
    public bottomPanel!: BottomPanel;

    // External handlers
    public onSpin?: () => void;
    public onBetChange?: (delta: number) => void;
    public onMenu?: () => void;

    constructor(
        resolveTexture: TextureProvider,
        width: number,
        height: number,
    ) {
        super();
        this.resolveTexture = resolveTexture;
        this.layoutWidth = width;
        this.layoutHeight = height;

        this.createLayout();
    }

    private createLayout(): void {
        // 1. Top Bar
        this.topBar = new TopBar(this.resolveTexture, this.layoutWidth);
        this.topBar.x = 0;
        this.topBar.y = 0;
        this.addChild(this.topBar);

        // 2. Bottom Panel
        this.bottomPanel = new BottomPanel(this.resolveTexture, this.layoutWidth);
        this.bottomPanel.x = 0;
        this.bottomPanel.y = this.layoutHeight - this.bottomPanel.height;
        this.addChild(this.bottomPanel);

        // Wire up events
        this.bottomPanel.onSpinClick = () => this.onSpin?.();
        this.bottomPanel.onBetChange = (d) => this.onBetChange?.(d);
        this.topBar.onMenuClick = () => this.onMenu?.();
    }

    public updateFromGameUI(gameUI: GameUI): void {
        this.topBar.updateBalance(gameUI.formatBalance(gameUI.getBalance()));
        this.bottomPanel.updateBet(gameUI.formatBalance(gameUI.getCurrentBet()));
        this.bottomPanel.updateWin(gameUI.formatWin(gameUI.getLastWin()));
    }

    public setSpinningFn(isSpinning: boolean): void {
        this.bottomPanel.spinButton.setEnabled(!isSpinning); // Or allow stop
        this.bottomPanel.spinButton.setSpinningState(isSpinning);
    }
}
