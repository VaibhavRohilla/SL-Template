/**
 * GameButtonsPanel - Right Panel Game Controls
 *
 * Contains menu, spin, stake buttons and spin counter.
 * Matches reference: blingo_front/ui/GameScreen/GameButtons.ts
 * Uses actual game assets: spin.png, spin_click.png, menu.png, menu_click.png, etc.
 */

import { PIXI } from 'slot-frontend-engine';
const { Container, Sprite, Text, TextStyle, Circle, Graphics } = PIXI;

/**
 * Texture resolver function type
 */
export type TextureResolver = (key: string) => PIXI.Texture | null;

/**
 * Circular image button (for menu and stake)
 */
export class ImageButton extends Container {
  private normalSprite: PIXI.Sprite | null = null;
  private clickSprite: PIXI.Sprite | null = null;
  private _enabled = true;

  public onClick: (() => void) | null = null;

  constructor(
    normalKey: string,
    clickKey: string,
    resolveTexture: TextureResolver,
  ) {
    super();

    const normalTexture = resolveTexture(normalKey);
    const clickTexture = resolveTexture(clickKey);

    if (normalTexture) {
      this.normalSprite = new Sprite(normalTexture);
      this.normalSprite.anchor.set(0.5);
      this.normalSprite.x = this.normalSprite.width / 2;
      this.normalSprite.y = this.normalSprite.height / 2;
      this.addChild(this.normalSprite);

      if (clickTexture) {
        this.clickSprite = new Sprite(clickTexture);
        this.clickSprite.anchor.set(0.5);
        this.clickSprite.x = this.normalSprite.x;
        this.clickSprite.y = this.normalSprite.y;
        this.clickSprite.visible = false;
        this.addChild(this.clickSprite);
      }

      // Set circular hit area
      this.hitArea = new Circle(
        this.normalSprite.width / 2,
        this.normalSprite.height / 2,
        this.normalSprite.width / 2,
      );
    }

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', this.handlePointerDown.bind(this));
    this.on('pointerup', this.handlePointerUp.bind(this));
    this.on('pointerupoutside', this.handlePointerUp.bind(this));
  }

  private handlePointerDown(): void {
    if (!this._enabled) return;
    if (this.normalSprite) this.normalSprite.visible = false;
    if (this.clickSprite) this.clickSprite.visible = true;
  }

  private handlePointerUp(): void {
    if (!this._enabled) return;
    if (this.normalSprite) this.normalSprite.visible = true;
    if (this.clickSprite) this.clickSprite.visible = false;
    this.onClick?.();
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.alpha = value ? 1 : 1;
    this.cursor = value ? 'pointer' : 'default';
  }

  get enabled(): boolean {
    return this._enabled;
  }
}

/**
 * Spin button with two modes: START GAME and SPIN FOR $X
 * Matches reference StartSpinButton
 */
export class StartSpinButton extends Container {
  private buttonBackground: PIXI.Sprite | null = null;
  private buttonType: boolean = true; // true = START GAME, false = SPIN FOR

  // Labels for START GAME mode
  private startLabel: PIXI.Text | null = null;
  private gameLabel: PIXI.Text | null = null;

  // Labels for SPIN FOR mode
  private spinLabel: PIXI.Text | null = null;
  private forLabel: PIXI.Text | null = null;
  private spinValueLabel: PIXI.Text | null = null;

  private _enabled = true;

  public onClick: (() => void) | null = null;
  private resolveTextureFn: TextureResolver | null = null;

  constructor(_resolveTexture: TextureResolver) {
    super();

    // Create labels first
    const labelStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 30,
      fontWeight: 'bold',
      fill: 0xffffff,
      letterSpacing: 3.5,
    });

    // START GAME labels
    this.startLabel = new Text({ text: 'START', style: labelStyle });
    this.startLabel.anchor.set(0.5);
    this.addChild(this.startLabel);

    this.gameLabel = new Text({ text: 'GAME', style: labelStyle });
    this.gameLabel.anchor.set(0.5);
    this.addChild(this.gameLabel);

    // SPIN FOR labels
    const spinLabelStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 30,
      fontWeight: 'bold',
      fill: 0xffffff,
      letterSpacing: 3,
    });

    this.spinLabel = new Text({ text: 'SPIN', style: spinLabelStyle });
    this.spinLabel.anchor.set(0.5);
    this.spinLabel.visible = false;
    this.addChild(this.spinLabel);

    this.forLabel = new Text({ text: 'FOR', style: spinLabelStyle });
    this.forLabel.anchor.set(0.5);
    this.forLabel.visible = false;
    this.addChild(this.forLabel);

    this.spinValueLabel = new Text({ text: '$0.00', style: spinLabelStyle });
    this.spinValueLabel.anchor.set(0.5);
    this.spinValueLabel.visible = false;
    this.addChild(this.spinValueLabel);

    // Set initial button type (START GAME)
    this.updateButtonType(true);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', this.handlePointerDown.bind(this));
    this.on('pointerup', this.handlePointerUp.bind(this));
    this.on('pointerupoutside', this.handlePointerUp.bind(this));
  }

  /**
   * Update button type: true = START GAME, false = SPIN FOR
   */
  updateButtonType(type: boolean, spinValue?: number): void {
    this.buttonType = type;

    // Remove old background
    if (this.buttonBackground) {
      this.removeChild(this.buttonBackground);
      this.buttonBackground = null;
    }

    if (type) {
      // START GAME mode
      const startTexture = this.resolveTextureFn?.('spin') ?? null;
      if (startTexture) {
        this.buttonBackground = new Sprite(startTexture);
        this.buttonBackground.anchor.set(0.5);
        this.buttonBackground.x = this.buttonBackground.width / 2;
        this.buttonBackground.y = this.buttonBackground.height / 2;
        this.addChildAt(this.buttonBackground, 0);
      }

      // Show START GAME labels
      if (this.startLabel) {
        this.startLabel.visible = true;
        this.startLabel.x = this.buttonBackground
          ? this.buttonBackground.width / 2
          : 70;
        this.startLabel.y = this.buttonBackground
          ? this.buttonBackground.height / 2 - this.startLabel.height / 4 + 2
          : 30;
      }
      if (this.gameLabel) {
        this.gameLabel.visible = true;
        this.gameLabel.x = this.buttonBackground
          ? this.buttonBackground.width / 2
          : 70;
        this.gameLabel.y = this.buttonBackground
          ? this.buttonBackground.height / 2 + this.gameLabel.height / 4 - 9
          : 50;
      }

      // Hide SPIN FOR labels
      if (this.spinLabel) this.spinLabel.visible = false;
      if (this.forLabel) this.forLabel.visible = false;
      if (this.spinValueLabel) this.spinValueLabel.visible = false;

      this.alpha = 1;
      this._enabled = true;
    } else {
      // SPIN FOR mode
      const spinTexture = this.resolveTextureFn?.('spin') ?? null;
      if (spinTexture) {
        this.buttonBackground = new Sprite(spinTexture);
        this.buttonBackground.anchor.set(0.5);
        this.buttonBackground.x = this.buttonBackground.width / 2;
        this.buttonBackground.y = this.buttonBackground.height / 2;
        this.addChildAt(this.buttonBackground, 0);
      }

      if (spinValue !== undefined && spinValue > 0) {
        // Show SPIN FOR labels with price
        if (this.spinLabel) {
          this.spinLabel.visible = true;
          this.spinLabel.x = this.buttonBackground
            ? this.buttonBackground.width / 2 + 1
            : 70;
          this.spinLabel.y = this.buttonBackground
            ? this.buttonBackground.height / 2 - this.spinLabel.height - 3
            : 20;
        }
        if (this.forLabel) {
          this.forLabel.visible = true;
          this.forLabel.x = this.buttonBackground
            ? this.buttonBackground.width / 2 + 2
            : 70;
          this.forLabel.y = this.buttonBackground
            ? this.buttonBackground.height / 2 - 3
            : 40;
        }
        if (this.spinValueLabel) {
          this.spinValueLabel.visible = true;
          this.spinValueLabel.text = `$${spinValue.toFixed(2)}`;
          this.spinValueLabel.x = this.buttonBackground
            ? this.buttonBackground.width / 2 - 5
            : 70;
          this.spinValueLabel.y = this.buttonBackground
            ? this.buttonBackground.height / 2 + this.spinValueLabel.height - 3
            : 60;
        }

        // Hide START GAME labels
        if (this.startLabel) this.startLabel.visible = false;
        if (this.gameLabel) this.gameLabel.visible = false;

        this.alpha = 1;
        this._enabled = true;
      } else {
        // Disabled state
        if (this.startLabel) this.startLabel.visible = false;
        if (this.gameLabel) this.gameLabel.visible = false;
        if (this.spinLabel) this.spinLabel.visible = false;
        if (this.forLabel) this.forLabel.visible = false;
        if (this.spinValueLabel) this.spinValueLabel.visible = false;

        this.alpha = 0.5;
        this._enabled = false;
      }
    }

    // Update hit area
    if (this.buttonBackground) {
      this.hitArea = new Circle(
        this.buttonBackground.width / 2,
        this.buttonBackground.height / 2,
        this.buttonBackground.width / 2,
      );
    }
  }

  setTextureResolver(resolver: TextureResolver): void {
    // Store resolver for use in updateButtonType
    this.resolveTextureFn = resolver;
  }

  private handlePointerDown(): void {
    if (!this._enabled) return;

    // Remove old background
    if (this.buttonBackground) {
      this.removeChild(this.buttonBackground);
    }

    const clickKey = this.buttonType ? 'start_click' : 'spin_click';
    const clickTexture = this.resolveTextureFn?.(clickKey) ?? null;
    if (clickTexture) {
      this.buttonBackground = new Sprite(clickTexture);
      this.buttonBackground.anchor.set(0.5);
      this.buttonBackground.x = this.buttonBackground.width / 2;
      this.buttonBackground.y = this.buttonBackground.height / 2;
      this.addChildAt(this.buttonBackground, 0);
    }
  }

  private handlePointerUp(): void {
    if (!this._enabled) return;

    // Restore normal background
    if (this.buttonBackground) {
      this.removeChild(this.buttonBackground);
    }

    const normalKey = this.buttonType ? 'start' : 'spin';
    const normalTexture = this.resolveTextureFn?.(normalKey) ?? null;
    if (normalTexture) {
      this.buttonBackground = new Sprite(normalTexture);
      this.buttonBackground.anchor.set(0.5);
      this.buttonBackground.x = this.buttonBackground.width / 2;
      this.buttonBackground.y = this.buttonBackground.height / 2;
      this.addChildAt(this.buttonBackground, 0);
    }

    this.onClick?.();
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.cursor = value ? 'pointer' : 'default';
    if (!value && this.buttonBackground) {
      this.alpha = 1;
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  updateLabel(value: string): void {
    if (this.spinValueLabel) {
      this.spinValueLabel.text = value;
    }
  }
}

/**
 * Spin counter display using spin_box.png
 */
export class SpinNumberButton extends Container {
  private spinBackground: PIXI.Sprite | null = null;
  private spinCoverBackground: PIXI.Sprite | null = null;
  private spinTypeLabel: PIXI.Text;
  private spinNumberLabel: PIXI.Text;
  private resolveTextureFn: TextureResolver;

  constructor(resolveTexture: TextureResolver, type: string = 'SPINS', remain: number = 0) {
    super();
    this.resolveTextureFn = resolveTexture;

    const boxTexture = resolveTexture('ui/spin_box');
    const coverTexture = resolveTexture('ui/spin_cover');

    if (boxTexture) {
      this.spinBackground = new Sprite(boxTexture);
      this.spinBackground.anchor.set(0.5);
      this.spinBackground.x = this.spinBackground.width / 2;
      this.spinBackground.y = this.spinBackground.height / 2;
      this.addChild(this.spinBackground);

      if (coverTexture) {
        this.spinCoverBackground = new Sprite(coverTexture);
        this.spinCoverBackground.anchor.set(0.5);
        this.spinCoverBackground.alpha = 1;
        this.spinCoverBackground.x = this.spinBackground.width / 2;
        this.spinCoverBackground.y = this.spinBackground.height / 2;
        this.addChild(this.spinCoverBackground);
      }
    }

    const width = boxTexture?.width ?? 140;
    const height = boxTexture?.height ?? 80;

    // Spin type label (SPINS / EXTRA SPINS)
    const typeStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 30,
      fill: 0xffd800,
      letterSpacing: 2,
    });
    this.spinTypeLabel = new Text({ text: type, style: typeStyle });
    this.spinTypeLabel.anchor.set(0.5);
    this.spinTypeLabel.x = width / 2;
    this.spinTypeLabel.y = height / 4;
    this.addChild(this.spinTypeLabel);

    // Spin number label
    const numberStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 45,
      fill: 0xffffff,
    });
    this.spinNumberLabel = new Text({ text: remain.toString(), style: numberStyle });
    this.spinNumberLabel.anchor.set(0.5);
    this.spinNumberLabel.x = width / 2;
    this.spinNumberLabel.y = (height / 4) * 3 - 10;
    this.addChild(this.spinNumberLabel);
  }

  updateSpinType(spinType: string): void {
    this.spinTypeLabel.text = spinType;
  }

  updateSpinNumber(spinNumber: number): void {
    this.spinNumberLabel.text = spinNumber.toString();
  }

  updateCover(state: boolean): void {
    // Update shine effect
    const shineTexture = this.resolveTextureFn?.('ui/spin_shine') ?? null;
    if (state && shineTexture && this.spinBackground) {
      this.spinBackground.texture = shineTexture;
    } else {
      const boxTexture = this.resolveTextureFn?.('ui/spin_box') ?? null;
      if (boxTexture && this.spinBackground) {
        this.spinBackground.texture = boxTexture;
      }
    }
  }

  setTextureResolver(_resolver: TextureResolver): void {
    // Already set in constructor
  }
}

/**
 * CollectEndButton - END GAME / COLLECT button
 * Matches reference: blingo_front/ui/Common/Buttons.ts CollectEndButton
 */
export class CollectEndButton extends Container {
  private background: PIXI.Sprite | PIXI.Graphics;
  private buttonTypeLabel: PIXI.Text;
  private collectSymbol: PIXI.Sprite | null = null;
  private winSpinLabel: PIXI.Text | null = null;
  private readonly resolveTexture: TextureResolver;
  private _buttonType: boolean = false; // false = END, true = COLLECT

  public onClick: (() => void) | null = null;
  
  get buttonType(): boolean {
    return this._buttonType;
  }

  constructor(resolveTexture: TextureResolver) {
    super();
    this.resolveTexture = resolveTexture;
    this.label = 'CollectEndButton';

    // Try to use green_button texture, fallback to Graphics
    const greenButtonTexture = resolveTexture('GameTable/Spin/green_button');
    if (greenButtonTexture) {
      this.background = new Sprite(greenButtonTexture);
      this.background.anchor.set(0.5);
      this.background.x = this.background.width / 2;
      this.background.y = this.background.height / 2;
      this.addChild(this.background);
    } else {
      // Fallback: create green button using Graphics
      this.background = new Graphics();
      (this.background as PIXI.Graphics).roundRect(0, 0, 250, 70, 8);
      (this.background as PIXI.Graphics).fill({ color: 0x00aa00, alpha: 1 });
      this.background.x = 0;
      this.background.y = 0;
      this.addChild(this.background);
    }

    // Button text (END GAME or COLLECT)
    const buttonStyle = new TextStyle({
      fontFamily: 'Gang, Arial, sans-serif',
      fontSize: 49,
      fill: 0xffffff,
      letterSpacing: 0.5,
      dropShadow: {
        angle: 90,
        color: '#000000',
        distance: 5,
      },
    });

    this.buttonTypeLabel = new Text({ text: 'END GAME', style: buttonStyle });
    this.buttonTypeLabel.anchor.set(0.5);
    const bgWidth = this.background instanceof Sprite ? this.background.width : 250;
    const bgHeight = this.background instanceof Sprite ? this.background.height : 70;
    this.buttonTypeLabel.x = bgWidth / 2;
    this.buttonTypeLabel.y = bgHeight / 2;
    this.addChild(this.buttonTypeLabel);
    
    // Collect symbol (matching reference) - initially hidden
    const collectSymbolTexture = resolveTexture('bonus/8_blingo'); // Default to 8_blingo
    if (collectSymbolTexture) {
      this.collectSymbol = new Sprite(collectSymbolTexture);
      this.collectSymbol.anchor.set(0.5);
      this.collectSymbol.visible = false;
      this.addChild(this.collectSymbol);
    }
    
    // WIN SPIN label (matching reference)
    const winSpinStyle = new TextStyle({
      fontFamily: 'Roboto, Arial, sans-serif',
      fontSize: 12,
      fill: 0xffffff,
      letterSpacing: 0.5,
    });
    this.winSpinLabel = new Text({ text: 'WIN SPIN', style: winSpinStyle });
    this.winSpinLabel.anchor.set(0.5);
    this.winSpinLabel.visible = false;
    this.addChild(this.winSpinLabel);

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', this.handleDown.bind(this));
    this.on('pointerup', this.handleUp.bind(this));
    this.on('pointerupoutside', this.handleUp.bind(this));
  }

  private handleDown(): void {
    if (this.background instanceof Sprite && this.background.texture) {
      // Could swap to click texture if available
    }
  }

  private handleUp(): void {
    if (this.onClick) {
      this.onClick();
    }
  }

  updateButtonType(type: boolean): void {
    this._buttonType = type;
    const bgWidth = this.background instanceof Sprite ? this.background.width : 250;
    const bgHeight = this.background instanceof Sprite ? this.background.height : 70;
    
    if (type) {
      // COLLECT mode (matching reference)
      this.buttonTypeLabel.text = 'COLLECT';
      this.buttonTypeLabel.x = bgWidth / 2 - this.buttonTypeLabel.width / 2 + 65 - 8;
      this.buttonTypeLabel.y = (bgHeight - 10) / 2;
      
      if (this.collectSymbol) {
        this.collectSymbol.visible = true;
        this.collectSymbol.x = this.buttonTypeLabel.x + this.buttonTypeLabel.width / 2 + 12 + 65 / 2;
        this.collectSymbol.y = (bgHeight - 10) / 2;
      }
      
      if (this.winSpinLabel) {
        this.winSpinLabel.visible = true;
        if (this.collectSymbol) {
          this.winSpinLabel.x = this.collectSymbol.x + 1;
          this.winSpinLabel.y = this.collectSymbol.y + 18;
        }
      }
    } else {
      // END GAME mode
      this.buttonTypeLabel.text = 'END GAME';
      this.buttonTypeLabel.x = bgWidth / 2;
      this.buttonTypeLabel.y = (bgHeight - 10) / 2;
      
      if (this.collectSymbol) {
        this.collectSymbol.visible = false;
      }
      
      if (this.winSpinLabel) {
        this.winSpinLabel.visible = false;
      }
    }
  }
  
  /**
   * Update collect button symbol (matching reference updateCollectButton)
   */
  updateCollectButton(winNumber: number): void {
    if (!this.resolveTexture) return;
    
    // Remove old symbol if it exists
    if (this.collectSymbol && this.collectSymbol.parent) {
      this.removeChild(this.collectSymbol);
    }
    
    // Calculate bonus info index (matching reference: winNumber >= 12 ? 0 : 11 - winNumber)
    // Reference uses: BONUS_INFO[winNumber >= 12 ? 0 : 11 - winNumber]
    // BONUS_INFO array: ['symbol_amulet_dragon', 'symbol_amulet_eight', 'symbol_amulet_pig', ...]
    // Reference texture path: 'BonusInfo/' + BONUS_INFO[index]
    const bonusIndex = winNumber >= 12 ? 0 : 11 - winNumber;
    
    // Try reference format first: 'BonusInfo/symbol_amulet_dragon', etc.
    // Then try simplified format: 'BonusInfo/X_blingo' or 'X_blingo'
    const bonusInfoKeys = [
      'symbol_amulet_dragon',    // 0
      'symbol_amulet_eight',      // 1
      'symbol_amulet_pig',        // 2
      'symbol_eight',             // 3
      'symbol_pig',               // 4
      'symbol_yinyang',           // 5
      'symbol_bar',               // 6
      'symbol_lotus',             // 7
      'symbol_fan',               // 8
      'symbol_arrow',             // 9
      'symbol_arrow',             // 10
    ];
    
    const referenceKey = `BonusInfo/${bonusInfoKeys[bonusIndex] ?? bonusInfoKeys[8]}`;
    const fallbackKey1 = `BonusInfo/${bonusIndex + 1}_blingo`;
    const fallbackKey2 = `${bonusIndex + 1}_blingo`;
    const defaultKey = 'BonusInfo/8_blingo';
    
    const collectSymbolTexture = 
      this.resolveTexture(referenceKey) || 
      this.resolveTexture(fallbackKey1) || 
      this.resolveTexture(fallbackKey2) ||
      this.resolveTexture(defaultKey) ||
      this.resolveTexture('bonus/8_blingo');
    
    if (collectSymbolTexture) {
      this.collectSymbol = new Sprite(collectSymbolTexture);
      this.collectSymbol.anchor.set(0.5);
      this.collectSymbol.visible = this._buttonType;
      this.addChild(this.collectSymbol);
      
      // Reposition based on button type
      if (this._buttonType) {
        const bgHeight = this.background instanceof Sprite ? this.background.height : 70;
        this.collectSymbol.x = this.buttonTypeLabel.x + this.buttonTypeLabel.width / 2 + 12 + 65 / 2;
        this.collectSymbol.y = (bgHeight - 10) / 2;
        
        if (this.winSpinLabel) {
          this.winSpinLabel.x = this.collectSymbol.x + 1;
          this.winSpinLabel.y = this.collectSymbol.y + 18;
        }
      }
    }
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

/**
 * GameButtonsPanel - Container for all game buttons
 * Matches reference layout and behavior
 */
export class GameButtonsPanel extends Container {
  public readonly menuButton: ImageButton;
  public readonly spinButton: StartSpinButton;
  public readonly stakeButton: ImageButton;
  public readonly spinNumberButton: SpinNumberButton;

  // Callbacks
  public onMenuClick: (() => void) | null = null;
  public onSpinClick: (() => void) | null = null;
  public onStakeClick: (() => void) | null = null;

  constructor(resolveTexture: TextureResolver) {
    super();
    this.label = 'GameButtonsPanel';

    // Menu button (circular, top) - matching reference: centered with -6 offset
    this.menuButton = new ImageButton('ui/menu', 'ui/menu_click', resolveTexture);
    // Position will be set in resize() to match reference centering
    this.menuButton.y = 0;
    this.menuButton.onClick = () => this.onMenuClick?.();
    this.addChild(this.menuButton);

    // Spin button (large circular, middle) - matching reference: centered with -6 offset
    this.spinButton = new StartSpinButton(resolveTexture);
    this.spinButton.setTextureResolver(resolveTexture);
    // Position will be set in resize() to match reference centering
    this.spinButton.y = (this.menuButton.height ?? 60) + 47; // After menu button + gap
    this.spinButton.onClick = () => this.onSpinClick?.();
    this.addChild(this.spinButton);

    // Stake button (circular, below spin) - matching reference: centered with -6 offset
    this.stakeButton = new ImageButton('ui/bet_set', 'ui/bet_set_click', resolveTexture);
    // Position will be set in resize() to match reference centering
    this.stakeButton.y =
      this.spinButton.y + (this.spinButton.height ?? 140) + 44; // After spin button + gap
    this.stakeButton.onClick = () => this.onStakeClick?.();
    this.addChild(this.stakeButton);

    // Spin number button (below stake) - matching reference: x = 0 (left-aligned)
    this.spinNumberButton = new SpinNumberButton(resolveTexture, 'SPINS', 0);
    this.spinNumberButton.setTextureResolver(resolveTexture);
    this.spinNumberButton.x = 0; // Matching reference: x = 0
    this.spinNumberButton.y =
      this.stakeButton.y + (this.stakeButton.height ?? 60) + 73; // After stake button + gap
    this.addChild(this.spinNumberButton);

    // Call resize to set initial positions (matching reference behavior)
    this.resize(1920, 1080);
  }

  /**
   * Resize handler (matching reference GameButtons.resize)
   */
  resize(width: number, height: number): void {
    if (width > height) {
      // Landscape mode layout (matching reference)
      this.menuButton.x = this.width / 2 - (this.menuButton.width ?? 60) / 2 - 6;
      this.menuButton.y = 0;

      this.spinButton.x = this.width / 2 - (this.spinButton.width ?? 140) / 2 - 6;
      this.spinButton.y = (this.menuButton.height ?? 60) + 47;

      this.stakeButton.x = this.width / 2 - (this.stakeButton.width ?? 60) / 2 - 6;
      this.stakeButton.y = this.spinButton.y + (this.spinButton.height ?? 140) + 44;

      this.spinNumberButton.x = 0; // Matching reference: x = 0
      this.spinNumberButton.y = this.stakeButton.y + (this.stakeButton.height ?? 60) + 73;
    } else {
      // Portrait mode layout (matching reference)
      const scale = Math.min(width / 1920, height / 1080) * 0.8;
      this.scale.set(scale);

      this.menuButton.x = this.width / 2 - (this.menuButton.width ?? 60) / 2;
      this.menuButton.y = 0;

      this.spinButton.x = this.width / 2 - (this.spinButton.width ?? 140) / 2;
      this.spinButton.y = (this.menuButton.height ?? 60) + 20;

      this.stakeButton.x = this.width / 2 - (this.stakeButton.width ?? 60) / 2;
      this.stakeButton.y = this.spinButton.y + (this.spinButton.height ?? 140) + 20;

      this.spinNumberButton.x = this.width / 2 - (this.spinNumberButton.width ?? 200) / 2;
      this.spinNumberButton.y = this.stakeButton.y + (this.stakeButton.height ?? 60) + 20;
    }
  }

  setSpinEnabled(enabled: boolean): void {
    this.spinButton.enabled = enabled;
  }

  updateSpinCount(count: number, type: 'SPINS' | 'EXTRA SPINS' = 'SPINS'): void {
    this.spinNumberButton.updateSpinNumber(count);
    this.spinNumberButton.updateSpinType(type);
  }

  /**
   * Update spin button to purchase mode (SPIN FOR $X)
   */
  setPurchaseMode(price: number): void {
    this.spinButton.updateButtonType(false, price);
  }

  /**
   * Update spin button to normal mode (START GAME)
   */
  setNormalMode(): void {
    this.spinButton.updateButtonType(true);
  }

  /**
   * Update spin button label (for SPIN FOR mode)
   */
  updateSpinLabel(value: string): void {
    this.spinButton.updateLabel(value);
  }

  override destroy(): void {
    super.destroy({ children: true });
  }
}

export default GameButtonsPanel;
