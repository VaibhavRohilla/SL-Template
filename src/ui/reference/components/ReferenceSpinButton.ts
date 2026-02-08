import { Container, Sprite, Texture } from 'pixi.js';
import { UI_ASSETS } from '../AssetMap.js';

export class ReferenceSpinButton extends Container {
    private mainSprite: Sprite;
    private textures: {
        idle: Texture;
        over: Texture;
        down: Texture;
        disabled: Texture;
    };

    public onClick?: () => void;
    private _isEnabled: boolean = true;

    constructor(resolver: (key: string) => Texture) {
        super();

        this.textures = {
            idle: resolver(UI_ASSETS.SPIN_BTN.IDLE),
            over: resolver(UI_ASSETS.SPIN_BTN.OVER),
            down: resolver(UI_ASSETS.SPIN_BTN.DOWN),
            disabled: resolver(UI_ASSETS.SPIN_BTN.DISABLED),
        };

        this.mainSprite = new Sprite(this.textures.idle);
        this.mainSprite.anchor.set(0.5);
        this.addChild(this.mainSprite);

        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.on('pointerover', () => this.updateState('over'));
        this.on('pointerout', () => this.updateState('idle'));
        this.on('pointerdown', () => this.updateState('down'));
        this.on('pointerup', () => {
            this.updateState('over');
            if (this._isEnabled) this.onClick?.();
        });
        this.on('pointerupoutside', () => this.updateState('idle'));
    }

    private updateState(state: 'idle' | 'over' | 'down' | 'disabled'): void {
        if (!this._isEnabled && state !== 'disabled') return;

        switch (state) {
            case 'idle': this.mainSprite.texture = this.textures.idle; break;
            case 'over': this.mainSprite.texture = this.textures.over; break;
            case 'down': this.mainSprite.texture = this.textures.down; break;
            case 'disabled': this.mainSprite.texture = this.textures.disabled; break;
        }
    }

    public setEnabled(enabled: boolean): void {
        this._isEnabled = enabled;
        this.eventMode = enabled ? 'static' : 'none';
        this.cursor = enabled ? 'pointer' : 'default';
        this.updateState(enabled ? 'idle' : 'disabled');
    }

    public updateTextures(textures: { idle: Texture; over: Texture; down: Texture; disabled: Texture }): void {
        this.textures = textures;
        this.updateState(this._isEnabled ? 'idle' : 'disabled');
    }
}
