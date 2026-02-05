

/**
 * Base class for all detailed overlays (Paytable, Rules, Settings)
 * Provides common functionality:
 * - Fullscreen blocked background
 * - Close button
 * - Content container
 * - Show/Hide animations
*/
import { Container, Graphics, TextStyle, Text } from "pixi.js";
export abstract class BaseOverlay extends Container {
    protected background: Graphics;
    protected contentContainer: Container;
    protected closeButton: Container;
    protected titleText: Text;

    constructor(
        protected layoutWidth: number,
        protected layoutHeight: number,
        protected title: string = ''
    ) {
        super();

        // 1. Blocker Background (semi-transparent black)
        this.background = new Graphics();
        this.background.rect(0, 0, layoutWidth, layoutHeight);
        this.background.fill({ color: 0x000000, alpha: 0.85 });
        this.background.eventMode = 'static'; // Block clicks
        this.addChild(this.background);

        // 2. Content Container (centered)
        this.contentContainer = new Container();
        this.contentContainer.position.set(layoutWidth / 2, layoutHeight / 2);
        this.addChild(this.contentContainer);

        // 3. Title
        this.titleText = new Text({
            text: title,
            style: new TextStyle({
                fontFamily: 'Verdana, sans-serif',
                fontSize: 36,
                fontWeight: 'bold',
                fill: '#ffffff',
                dropShadow: {
                    alpha: 0.5,
                    angle: 45,
                    blur: 4,
                    distance: 2,
                    color: 0x000000,
                },
            }),
        });
        this.titleText.anchor.set(0.5, 0); // Top centered
        this.titleText.position.set(layoutWidth / 2, 40);
        this.addChild(this.titleText);

        // 4. Close Button (Top Right)
        this.closeButton = this.createCloseButton();
        this.closeButton.position.set(layoutWidth - 60, 60);
        this.addChild(this.closeButton);

        // Default hidden
        this.visible = false;
        this.alpha = 0;
    }

    /**
     * Create standard close button (X)
     */
    private createCloseButton(): Container {
        const btn = new Container();
        const bg = new Graphics();
        bg.circle(0, 0, 25);
        bg.fill({ color: 0xffffff, alpha: 0.2 });
        bg.stroke({ width: 2, color: 0xffffff });

        // Hover effect
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerover', () => bg.fill({ color: 0xffffff, alpha: 0.4 }));
        btn.on('pointerout', () => bg.fill({ color: 0xffffff, alpha: 0.2 }));
        btn.on('pointertap', () => this.hide());

        const xMark = new Text({
            text: '✕',
            style: {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: '#ffffff',
                fontWeight: 'bold'
            }
        });
        xMark.anchor.set(0.5);

        btn.addChild(bg, xMark);
        return btn;
    }

    /**
     * Show the overlay
     */
    public show(): void {
        this.visible = true;
        this.alpha = 0;

        // Simple fade in
        this.alpha = 1;
    }

    /**
     * Hide the overlay
     */
    public hide(): void {
        this.visible = false;
    }
}
