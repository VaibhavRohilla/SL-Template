import { Container, Sprite, Texture } from 'pixi.js';
import { UI_ASSETS } from './AssetMap.js';
import { ReferenceSpinButton } from './components/ReferenceSpinButton.js';
import { ReferenceBetPanel } from './components/ReferenceBetPanel.js';
import { BalanceMeter, WinMeter } from './components/ReferenceMeters.js';
import { ReferenceFastPlayToggle } from './components/ReferenceFastPlayToggle.js';
import type { GameUI } from '../GameUI.js';

export class ReferenceUIRoot extends Container {
    private bg: Sprite;
    private buttonsContainer: Container;

    public spinButton: ReferenceSpinButton;
    public spinStopButton: ReferenceSpinButton; // Reusing ReferenceSpinButton for Stop
    public autoSpinButton: ReferenceSpinButton; // Reusing for Auto for now or create specific
    public betPanel: ReferenceBetPanel;
    public balanceMeter: BalanceMeter;
    public winMeter: WinMeter;
    public turboToggle: ReferenceFastPlayToggle;

    constructor(resolver: (key: string) => Texture) {
        super();

        // 1. Background
        this.bg = new Sprite(resolver(UI_ASSETS.SCENE.CONSOLE_BAND));
        this.bg.anchor.set(0.5);
        this.bg.scale.x = 10; // As per json
        this.bg.y = -42;
        this.addChild(this.bg);

        // 2. Buttons Container (Absolute Design Coordinates 1920x1080)
        this.buttonsContainer = new Container();
        this.addChild(this.buttonsContainer);

        // 3. Components
        this.balanceMeter = new BalanceMeter(resolver(UI_ASSETS.LABELS.BALANCE));
        this.buttonsContainer.addChild(this.balanceMeter);

        this.betPanel = new ReferenceBetPanel(resolver);
        this.buttonsContainer.addChild(this.betPanel);

        this.winMeter = new WinMeter(resolver(UI_ASSETS.LABELS.WIN));
        this.buttonsContainer.addChild(this.winMeter);

        this.spinButton = new ReferenceSpinButton(resolver);
        this.buttonsContainer.addChild(this.spinButton);

        this.spinStopButton = new ReferenceSpinButton(resolver);
        this.spinStopButton.visible = false;
        // Re-mapping textures for STOP manually for now or update component to accept texture map
        (this.spinStopButton as any).updateTextures({
            idle: resolver(UI_ASSETS.STOP_BTN.IDLE),
            over: resolver(UI_ASSETS.STOP_BTN.OVER),
            down: resolver(UI_ASSETS.STOP_BTN.DOWN),
            disabled: resolver(UI_ASSETS.STOP_BTN.DISABLED),
        });
        this.buttonsContainer.addChild(this.spinStopButton);

        this.autoSpinButton = new ReferenceSpinButton(resolver);
        (this.autoSpinButton as any).updateTextures({
            idle: resolver(UI_ASSETS.AUTO_BTN.IDLE),
            over: resolver(UI_ASSETS.AUTO_BTN.OVER),
            down: resolver(UI_ASSETS.AUTO_BTN.DOWN),
            disabled: resolver(UI_ASSETS.AUTO_BTN.DISABLED),
        });
        this.buttonsContainer.addChild(this.autoSpinButton);

        this.turboToggle = new ReferenceFastPlayToggle(resolver);
        this.buttonsContainer.addChild(this.turboToggle);

        // Initial layout
        this.updateLayout('landscape');
    }

    public updateLayout(orientation: 'landscape' | 'portrait'): void {
        if (orientation === 'landscape') {
            this.buttonsContainer.position.set(-960, -1080);

            this.balanceMeter.position.set(-2, 1044);
            this.betPanel.position.set(903, 1045);
            this.winMeter.position.set(80, 2);
            this.spinButton.position.set(1524, 922);
            this.spinButton.scale.set(1);
            this.spinStopButton.position.set(1524, 922);
            this.spinStopButton.scale.set(1);
            this.autoSpinButton.position.set(1708, 993);
            this.autoSpinButton.scale.set(1);
            this.turboToggle.position.set(1819, 994);
            this.turboToggle.scale.set(1);
        } else {
            this.buttonsContainer.position.set(-542, -1927);

            this.balanceMeter.position.set(80, 1857);
            this.betPanel.position.set(384, 1856);
            this.winMeter.position.set(300, 1867);
            this.spinButton.position.set(418, 1325);
            this.spinButton.scale.set(1.45);
            this.spinStopButton.position.set(418, 1325);
            this.spinStopButton.scale.set(1.45);
            this.autoSpinButton.position.set(700, 1400);
            this.autoSpinButton.scale.set(1.32);
            this.turboToggle.position.set(273, 1400);
            this.turboToggle.scale.set(1.32);
        }
    }

    public updateFromGameUI(gameUI: GameUI): void {
        this.balanceMeter.updateValue(gameUI.formatBalance(gameUI.getBalance()));
        this.betPanel.updateBet(gameUI.formatBalance(gameUI.getCurrentBet()));
        this.winMeter.updateValue(gameUI.formatWin(gameUI.getLastWin()));
    }

    public setSpinningState(isSpinning: boolean): void {
        this.spinButton.visible = !isSpinning;
        this.spinStopButton.visible = isSpinning;

        this.spinButton.setEnabled(!isSpinning);
        this.betPanel.setEnabled(!isSpinning);
    }

    public resize(width: number, height: number): void {
        const orientation = width > height ? 'landscape' : 'portrait';
        this.updateLayout(orientation);

        // Center at bottom
        this.position.set(width / 2, height);

        // Scale to fit width
        const designWidth = orientation === 'landscape' ? 1920 : 1080;
        const scale = width / designWidth;
        this.scale.set(scale);
    }
}
