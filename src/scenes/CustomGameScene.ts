/**
 * CustomGameScene - Slingo-Style Game Scene
 *
 * Implements the reference (blingo_front) game screen layout:
 * - 5×5 number grid
 * - 1-row horizontal spinner
 * - BonusInfo panel (left)
 * - GameButtons panel (right)
 * - GameBottom HUD bar
 *
 * Layer order (bottom to top):
 * 1. Background (video or solid)
 * 2. Game layer (grid + spinner)
 * 3. Frame/overlay layer
 * 4. UI layer (panels, HUD)
 *
 * Uses actual game assets via texture resolver from SceneContext.
 */

import {
  SceneState,
  PIXI,
  type SceneContext,
  type IScene,
  type ITweenService,
} from 'slot-frontend-engine';

const { Container, Graphics, Sprite } = PIXI;

import {
  DESIGN_W,
  DESIGN_H,
  GAME_TABLE_X,
  GAME_TABLE_Y,
  BONUS_INFO_X,
  BONUS_INFO_Y,
  GAME_BUTTONS_X,
  SPINNER_Y_OFFSET,
  GRID_W,
  GAME_REVEAL_SCALE_START,
  GAME_REVEAL_SCALE_END,
  GAME_REVEAL_DURATION_MS,
  layoutRect,
} from '../layout/DesignLayout.js';

import { SlingoGrid, type TextureResolver } from '../components/SlingoGrid.js';
import { SlingoSpinner, type SpinnerReelResult } from '../components/SlingoSpinner.js';
import { BonusInfoPanel } from '../components/BonusInfoPanel.js';
import { GameButtonsPanel, CollectEndButton } from '../components/GameButtonsPanel.js';
import { GameBottomBar } from '../components/GameBottomBar.js';
import { ExtraSymbols } from '../components/ExtraSymbols.js';
import { BonusSlot } from '../components/BonusSlot/BonusSlot.js';
import GameUI from '@/ui/GameUI.js';

/**
 * Debug mode configuration
 */
interface DebugConfig {
  showLayoutRects: boolean;
  showFPS: boolean;
}

// Interface for audio bus (simplified from engine internal)
interface IAudioBus {
  play(key: string, options?: { loop?: boolean; channel?: string }): void;
  stop(key: string): void;
}

// Interface for logger (simplified)
interface ILogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * CustomGameScene implementing Slingo-style layout
 */
export class CustomGameScene implements IScene {
  public readonly id = 'custom-game';
  public readonly container: PIXI.Container;

  private _state: SceneState = SceneState.CREATED;

  // Services (accessed from context)
  private readonly tweenService: ITweenService;
  private readonly audioBus: IAudioBus;
  private readonly logger: ILogger;
  private readonly gameUI: GameUI;
  private readonly resolveTexture: TextureResolver;

  // Layer containers
  private backgroundLayer!: PIXI.Container;
  private gameLayer!: PIXI.Container;
  private overlayLayer!: PIXI.Container;
  private uiLayer!: PIXI.Container;

  // Game components
  private grid!: SlingoGrid;
  private spinner!: SlingoSpinner;
  private bonusPanel!: BonusInfoPanel;
  private buttonsPanel!: GameButtonsPanel;
  private bottomBar!: GameBottomBar;
  private endGameButton!: CollectEndButton;
  private extraSymbols!: ExtraSymbols;
  private bonusSlot!: BonusSlot;

  // Background video element (if using video)
  private videoSprite: PIXI.Sprite | null = null;

  // Debug overlay
  private debugOverlay: PIXI.Container | null = null;
  private debugConfig: DebugConfig = {
    showLayoutRects: false,
    showFPS: false,
  };

  // Game state
  private isSpinning = false;
  private spinCount = 10;
  private winNumber = 0;
  private pendingSpinResults: SpinnerReelResult[] = [];
  private purpleGemIndexes: number[] = []; // Track purple gem positions
  private currentStake = 2.16; // Current stake amount

  /**
   * Factory method for SceneContext
   */
  static create(ctx: SceneContext): CustomGameScene {
    return new CustomGameScene(ctx);
  }

  constructor(ctx: SceneContext) {
    this.tweenService = ctx.tweenService;
    this.audioBus = ctx.audioBus as IAudioBus;
    this.logger = ctx.logger as ILogger;
    this.gameUI = ctx.gameUI;

    // Create texture resolver that wraps SceneContext.resolveTexture
    this.resolveTexture = (key: string) => ctx.resolveTexture(key);

    this.container = new Container();
    this.container.label = 'CustomGameScene';
  }

  get state(): SceneState {
    return this._state;
  }

  /**
   * Mount the scene
   */
  async mount(): Promise<void> {
    if (this._state === SceneState.DESTROYED || this._state === SceneState.DESTROYING) {
      return;
    }

    this._state = SceneState.MOUNTING;
    this.logger.info('CustomGameScene: Mounting');

    // Create layer structure
    this.createLayers();

    // Create background (try video first, fallback to solid)
    await this.createBackground();

    // Create game components
    this.createGameComponents();

    // Create UI panels
    this.createUIPanels();

    // Setup event handlers
    this.setupEventHandlers();

    // Initialize game state
    this.initializeGameState();

    // Play reveal animation
    await this.playRevealAnimation();

    if (this._state === SceneState.MOUNTING) {
      this._state = SceneState.ACTIVE;
      this.logger.info('CustomGameScene: Mounted');
    }
  }

  /**
   * Create the layer hierarchy
   */
  private createLayers(): void {
    // Background layer (z=0)
    this.backgroundLayer = new Container();
    this.backgroundLayer.label = 'BackgroundLayer';
    this.container.addChild(this.backgroundLayer);

    // Game layer (z=1) - contains grid and spinner
    this.gameLayer = new Container();
    this.gameLayer.label = 'GameLayer';
    this.container.addChild(this.gameLayer);

    // Overlay layer (z=2) - frame, effects
    this.overlayLayer = new Container();
    this.overlayLayer.label = 'OverlayLayer';
    this.container.addChild(this.overlayLayer);

    // UI layer (z=3) - panels, HUD
    this.uiLayer = new Container();
    this.uiLayer.label = 'UILayer';
    this.container.addChild(this.uiLayer);
  }

  /**
   * Create background - try video first, fallback to solid color
   */
  private async createBackground(): Promise<void> {
    // Try to create video background using HTML5 video
    const videoCreated = await this.tryCreateVideoBackground();

    if (!videoCreated) {
      // Fallback to dark solid background
      const bg = new Graphics();
      bg.rect(0, 0, DESIGN_W, DESIGN_H);
      bg.fill({ color: 0x1a0a0a });
      this.backgroundLayer.addChild(bg);
    }
  }

  /**
   * Try to create video background from assets/main/backgrounds/background.mp4
   */
  private async tryCreateVideoBackground(): Promise<boolean> {
    try {
      // Create HTML5 video element
      const video = document.createElement('video');
      video.src = 'assets/main/backgrounds/background.mp4';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        video.oncanplaythrough = () => resolve();
        video.onerror = () => reject(new Error('Video load failed'));
        video.load();

        // Timeout after 3 seconds
        setTimeout(() => reject(new Error('Video load timeout')), 3000);
      });

      // Start playback
      await video.play();

      // Create PIXI texture from video
      const videoTexture = PIXI.Texture.from(video);
      this.videoSprite = new Sprite(videoTexture);

      // Scale to fill design area
      this.videoSprite.width = DESIGN_W;
      this.videoSprite.height = DESIGN_H;

      this.backgroundLayer.addChild(this.videoSprite);
      this.logger.info('CustomGameScene: Video background created');

      return true;
    } catch (error) {
      this.logger.warn('CustomGameScene: Video background failed, using fallback', error);
      return false;
    }
  }

  /**
   * Create game components (grid + spinner) with actual textures
   * Matching reference GameTable structure
   */
  private createGameComponents(): void {
    // Game container (for scale animation) - matching reference gameContainer
    // Reference: gameContainer.pivot.set(width/2, height/2), position.set(width/2, height/2)
    const gameContainer = new Container();
    gameContainer.label = 'GameContainer';
    gameContainer.pivot.set(DESIGN_W / 2, DESIGN_H / 2);
    gameContainer.position.set(DESIGN_W / 2, DESIGN_H / 2);

    // Grid - matching reference GameTable
    // Reference: gameTable.x = width * 0.5 - 365.5 = 594.5, y = height * 0.5 - 453 + 7 = 94
    // These are absolute positions, but since gameContainer is centered at (960, 540),
    // we position grid at (594.5, 94) relative to gameContainer's local origin
    this.grid = new SlingoGrid(this.resolveTexture, this.tweenService);
    this.grid.x = GAME_TABLE_X; // 594.5 (matching reference)
    this.grid.y = GAME_TABLE_Y; // 94 (matching reference)
    gameContainer.addChild(this.grid);

    // Spinner - matching reference GameTable.gameSpinReel
    // Reference: gameSpinReel.x = 0, y = height * 5.5 - 4 = 766 (relative to GameTable)
    // Since grid is at (594.5, 94), spinner should be at (594.5 + 0, 94 + 766) = (594.5, 860)
    this.spinner = new SlingoSpinner(this.resolveTexture, this.tweenService);
    this.spinner.x = GAME_TABLE_X; // Same X as grid (matching reference: x = 0 relative to GameTable)
    this.spinner.y = GAME_TABLE_Y + SPINNER_Y_OFFSET; // grid.y + 766 = 94 + 766 = 860
    gameContainer.addChild(this.spinner);

    // END GAME button - matching reference GameTable.gameStopButton
    // Reference: gameStopButton.x = this.width / 2 - this.gameStopButton.width / 2
    // Reference: gameStopButton.y = this.gameSpinReel.y - 3 = 766 - 3 = 763 (relative to GameTable)
    // Since grid is at (594.5, 94), button should be at (594.5 + GRID_W/2 - button.width/2, 94 + 763) = (594.5 + 368 - button.width/2, 857)
    this.endGameButton = new CollectEndButton(this.resolveTexture);
    // Position relative to gameContainer (matching reference: this.width / 2)
    // Reference uses GameTable.width which is grid width (GRID_W)
    this.endGameButton.x = GAME_TABLE_X + GRID_W / 2 - (this.endGameButton.width ?? 250) / 2;
    // Position relative to grid (matching reference: gameSpinReel.y - 3)
    this.endGameButton.y = GAME_TABLE_Y + SPINNER_Y_OFFSET - 3; // 94 + 766 - 3 = 857
    this.endGameButton.visible = false; // Initially hidden, shown via showStopButton()
    this.endGameButton.onClick = () => {
      this.handleEndGameClick();
    };
    gameContainer.addChild(this.endGameButton);

    // Setup spinner callbacks
    this.spinner.onReelStopped = (reelIndex, result) => {
      this.handleReelStopped(reelIndex, result);
    };
    this.spinner.onAllReelsStopped = () => {
      this.handleAllReelsStopped();
    };
    
    // Setup grid cell click callback
    this.grid.onCellClick = (cellIndex, value) => {
      this.handleCellClick(cellIndex, value);
    };

    this.gameLayer.addChild(gameContainer);
  }

  /**
   * Create UI panels with actual textures
   */
  private createUIPanels(): void {
    // Bonus info panel (left) - pass texture resolver
    this.bonusPanel = new BonusInfoPanel(this.resolveTexture);
    this.bonusPanel.x = BONUS_INFO_X;
    this.bonusPanel.y = BONUS_INFO_Y;
    this.uiLayer.addChild(this.bonusPanel);

    // Game buttons panel (right) - pass texture resolver
    this.buttonsPanel = new GameButtonsPanel(this.resolveTexture);
    this.buttonsPanel.x = GAME_BUTTONS_X;
    // Calculate Y position matching reference: height * 0.5 - gameButtons.height * 0.5 + 109
    // Need to wait for layout to calculate height, so use approximate for now
    // Reference uses actual height after layout, but we'll use approximate: ~600px
    const buttonsPanelHeight = 600; // Approximate height based on button layout
    this.buttonsPanel.y = DESIGN_H * 0.5 - buttonsPanelHeight * 0.5 + 109;
    this.uiLayer.addChild(this.buttonsPanel);

    // Bottom bar - pass texture resolver
    this.bottomBar = new GameBottomBar(this.resolveTexture);
    this.bottomBar.x = 0;
    this.bottomBar.y = DESIGN_H - this.bottomBar.getHeight();
    this.uiLayer.addChild(this.bottomBar);

    // Extra symbols (logo + time) - matching reference zIndex 10
    this.extraSymbols = new ExtraSymbols(this.resolveTexture);
    this.extraSymbols.zIndex = 10;
    this.uiLayer.addChild(this.extraSymbols);

    // Bonus slot (initially hidden, shown when bonus is triggered)
    this.bonusSlot = new BonusSlot(this.resolveTexture, this.tweenService);
    this.bonusSlot.visible = false;
    this.bonusSlot.zIndex = 20; // Above other UI
    this.uiLayer.addChild(this.bonusSlot);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Spin button
    this.buttonsPanel.onSpinClick = () => {
      this.startSpin();
    };

    // Menu button
    this.buttonsPanel.onMenuClick = () => {
      this.logger.info('Menu button clicked');
      // TODO: Show menu popup
    };

    // Stake button
    this.buttonsPanel.onStakeClick = () => {
      this.logger.info('Stake button clicked');
      // TODO: Show stake selection popup
    };
  }

  /**
   * Initialize game state
   */
  private initializeGameState(): void {
    // Initialize grid with random numbers
    this.grid.initializeWithNumbers();

    // Reset spinner
    this.spinner.reset();
    this.logger.info('CustomGameScene: Initializing game state');
    this.logger.info('CustomGameScene: Spin count: ' + this.spinCount);
    this.logger.info('CustomGameScene: Win number: ' + this.winNumber);
    this.logger.info('CustomGameScene: Pending spin results: ' + this.pendingSpinResults.length);
    this.logger.info('CustomGameScene: Purple gem indexes: ' + this.purpleGemIndexes.length);
    this.logger.info('CustomGameScene: Current stake: ' + this.currentStake);
    this.logger.info('CustomGameScene: Game UI current bet: ' + this.gameUI.getCurrentBet?.());
    this.logger.info('CustomGameScene: Game UI deduct bet: ' + this.gameUI.deductBet?.(this.gameUI.getCurrentBet?.() ?? 1));
    // Update UI
    this.buttonsPanel.updateSpinCount(this.spinCount);
    this.bottomBar.updateBalance(this.gameUI.getBalance() ?? 100);
    this.bottomBar.updateStake(0);
    this.bottomBar.updateDescription('SELECT ANY HIGHLIGHTED NUMBER'); // Matching reference
    this.bonusPanel.reset();
    
    // Hide END GAME button initially
    this.endGameButton.visible = false;
  }

  /**
   * Play reveal animation (reference: scale 0.9→1.0 + fade)
   */
  private async playRevealAnimation(): Promise<void> {
    const gameContainer = this.gameLayer.getChildAt(0) as PIXI.Container | undefined;
    if (!gameContainer) return;

    // Set initial state
    gameContainer.scale.set(GAME_REVEAL_SCALE_START);
    gameContainer.alpha = 0;
    this.bottomBar.alpha = 0;

    // Use proxy object pattern for tweening
    const tweenProxy = { progress: 0 };
    const startScale = GAME_REVEAL_SCALE_START;
    const endScale = GAME_REVEAL_SCALE_END;

    // Store references
    const containerRef = gameContainer;
    const bottomBarRef = this.bottomBar;

    await this.tweenService.to(
      tweenProxy,
      { progress: 1 },
      {
        duration: GAME_REVEAL_DURATION_MS,
        easing: 'easeOutQuad',
        onUpdate: () => {
          const p = tweenProxy.progress;
          // Lerp scale and alpha
          const currentScale = startScale + (endScale - startScale) * p;
          containerRef.scale.set(currentScale);
          containerRef.alpha = p;
          bottomBarRef.alpha = p;
        },
      }
    );
  }

  /**
   * Start a spin
   */
  private startSpin(): void {
    if (this.isSpinning || this.spinCount <= 0) return;

    this.isSpinning = true;
    this.buttonsPanel.setSpinEnabled(false);

    // Deduct spin
    this.spinCount--;
    this.buttonsPanel.updateSpinCount(this.spinCount);

    // Update stake
    const bet = this.gameUI.getCurrentBet?.() ?? 1;
    this.gameUI.deductBet?.(bet);
    this.bottomBar.updateStake(bet);

    // Play spin sound
    this.audioBus.play('ReelSpinLoop', { loop: true, channel: 'sfx' });

    // Update current stake
    this.currentStake = bet;

    // Start spinner
    this.spinner.startSpin();

    // Generate random results (in real game, this comes from server)
    const results: SpinnerReelResult[] = this.generateSpinResults();

    // Stop with results after delay
    setTimeout(() => {
      this.spinner.stopWithResults(results, 150);
    }, 1000);
  }

  /**
   * Generate spin results (mock - would come from server)
   * Matching reference: generates numbers 1-60 or special symbols (FS, PG, D, RJ, SJ, J)
   */
  private generateSpinResults(): SpinnerReelResult[] {
    const results: SpinnerReelResult[] = [];
    this.purpleGemIndexes = []; // Reset purple gems

    for (let i = 0; i < 5; i++) {
      // 80% chance of number, 20% chance of special symbol (matching typical game flow)
      if (Math.random() > 0.2) {
        // Generate random number 1-60 (matching reference tablePattern range)
        const randomNum = Math.floor(Math.random() * 60) + 1;
        results.push({
          type: 'number',
          value: randomNum,
        });
      } else {
        // Special symbols (matching reference: FS, PG, D, RJ, SJ, J)
        const specials: Array<SpinnerReelResult['type']> = [
          'joker',      // J
          'super_joker', // SJ (purple gem)
          'free_spin',  // FS
          'dragon',     // D
        ];
        const specialType = specials[Math.floor(Math.random() * specials.length)];
        results.push({
          type: specialType ?? 'joker',
        });

        // Track purple gems (super_joker = purple gem)
        // In real game, this comes from server purpleGemIndexes
        if (specialType === 'super_joker') {
          this.purpleGemIndexes.push(i);
        }
      }
    }

    return results;
  }

  /**
   * Handle single reel stopped (matching reference logic)
   */
  private handleReelStopped(reelIndex: number, result: SpinnerReelResult): void {
    // Play stop sound (matching reference - uses spinCnt % 3)
    const stopSounds = ['ReelStop_V1', 'ReelStop_V2', 'ReelStop_V3'] as const;
    const soundIndex = this.spinCount % 3; // Match reference: gameState.currentState.spinCnt % 3
    this.audioBus.play(stopSounds[soundIndex] ?? 'ReelStop_V1', { channel: 'sfx' });

    // If result is a number, update matched symbol text immediately (matching reference updateMatchedSingleSymbolTable)
    if (result.type === 'number' && result.value !== undefined) {
      // Update cell text style (yellow star appears, font changes to Dragon Deep)
      // This happens BEFORE the full match animation
      this.grid.updateMatchedSymbolText(result.value);
      
      // Also update spinner reel to show matched text
      this.spinner.updateMatchedText(reelIndex);
    } else if (result.type === 'joker' || result.type === 'super_joker') {
      // Joker/Super Joker - show choosed pattern (matching reference)
      // In real game, this comes from server: jokerCells or superJokerCells
      // For now, we'll simulate by choosing random numbers from grid
      const choosedNumbers: number[] = [];
      this.grid.cells.forEach((cell) => {
        if (!cell.isMatched && Math.random() > 0.7) {
          choosedNumbers.push(cell.value);
        }
      });
      // Limit to 3-5 choosed numbers
      const limitedChoosed = choosedNumbers.slice(0, Math.min(5, Math.max(3, choosedNumbers.length)));
      if (limitedChoosed.length > 0) {
        this.grid.updateChoosedTable(limitedChoosed);
      }
    } else {
      // Special symbols - match by symbol key
      const symbolMap: Record<string, string> = {
        'devil': 'BAR',
        'dragon': 'DRAGON',
        'coin': 'EIGHT',
        'free_spin': 'FAN',
      };

      const symbolKey = symbolMap[result.type];
      if (symbolKey) {
        // For special symbols, mark matches immediately
        const matched = this.grid.markMatchesBySymbol(symbolKey);
        if (matched.length > 0) {
          this.winNumber += matched.length;
          this.bonusPanel.updateWinProgress(this.winNumber);
        }
      }
    }
  }

  /**
   * Handle all reels stopped (matching reference logic)
   */
  private handleAllReelsStopped(): void {
    // Stop spin loop sound
    this.audioBus.stop('ReelSpinLoop');

    this.isSpinning = false;

    // Process purple gems first (if 3+ appear)
    if (this.purpleGemIndexes.length >= 3) {
      // Show purple win font animation
      setTimeout(() => {
        this.spinner.showPurpleWinFont(this.purpleGemIndexes, this.currentStake);
        
        // Update purple state for each purple gem reel (staggered)
        this.purpleGemIndexes.forEach((reelIndex, index) => {
          setTimeout(() => {
            this.spinner.updatePurpleState(reelIndex);
          }, index * 500); // 500ms delay per reel
        });
      }, 2000); // 2 second delay matching reference
    }

    // Process matches from spinner results (matching reference updateMatchedTable)
    // In real game, this comes from server matchedPattern
    // For now, we'll process the results we have
    const matchedNumbers: number[] = [];
    this.pendingSpinResults.forEach((result) => {
      if (result.type === 'number' && result.value !== undefined) {
        matchedNumbers.push(result.value);
      }
    });

    // Play full match animations for numbers (with delay, matching reference)
    if (matchedNumbers.length > 0) {
      let delayTime = 0;
      const winLines: number[] = []; // Collect win lines for animation
      
      matchedNumbers.forEach((number) => {
        setTimeout(() => {
          // Play match sound (matching reference)
          this.audioBus.play('SymbolClick', { channel: 'sfx' });
          
          // Play full match animation (dragon animation, fade out, red background)
          const matched = this.grid.markMatches(number);
          if (matched.length > 0) {
            this.winNumber += matched.length;
            this.bonusPanel.updateWinProgress(this.winNumber);
            
            // Calculate win lines from matched cells
            // In real game, this comes from server matchedPattern
            // For now, we'll detect simple patterns (rows, columns, diagonals)
            const winLine = this.calculateWinLineFromMatch(matched);
            if (winLine !== null) {
              winLines.push(winLine);
            }
          }

          // Also animate spinner reel match
          const reelIndex = this.pendingSpinResults.findIndex(
            (r) => r.type === 'number' && r.value === number
          );
          if (reelIndex >= 0) {
            this.spinner.markReelMatched(reelIndex);
          }
        }, delayTime);

        // Stagger delays (matching reference: (pattern.length + 1) * 1500)
        delayTime += 1500; // 1.5 seconds per match
      });
      
      // Show win line animations after all matches are processed
      if (winLines.length > 0) {
        const uniqueWinLines = [...new Set(winLines)];
        setTimeout(() => {
          this.grid.showWinAnimation(uniqueWinLines);
        }, delayTime + 500); // Small delay after last match
      }
    }

    // Clear pending results
    this.pendingSpinResults = [];

    // Check if game over or can continue
    if (this.spinCount > 0) {
      this.buttonsPanel.setSpinEnabled(true);
      // Show END GAME button after all matches are processed
      this.showStopButton();
    } else {
      // Game over - show results
      this.bottomBar.updateDescription('GAME OVER');
      this.showStopButton();
      // TODO: Show result popup
    }
  }
  
  /**
   * Show END GAME button (matching reference showStopButton)
   */
  private showStopButton(): void {
    setTimeout(() => {
      this.endGameButton.visible = true;
      this.endGameButton.updateButtonType(this.winNumber > 2); // COLLECT if winNumber > 2, else END GAME
    }, 500); // Small delay matching reference
  }
  
  /**
   * Handle cell click (matching reference setSymbolMatched -> callAPI)
   */
  private handleCellClick(cellIndex: number, value: number): void {
    // Play click sound (matching reference)
    this.audioBus.play('SymbolClick', { channel: 'sfx' });
    
    // Update win number
    this.winNumber += 1;
    this.bonusPanel.updateWinProgress(this.winNumber);
    
    // Update END GAME button state (matching reference updateStopButtonState)
    this.endGameButton.updateButtonType(this.winNumber > 2);
    if (this.winNumber > 2) {
      this.endGameButton.updateCollectButton(this.winNumber);
    }
    
    // In real game, this would call API with { type: 3, value: value }
    this.logger.info(`CustomGameScene: Cell clicked - index: ${cellIndex}, value: ${value}`);
  }
  
  /**
   * Handle END GAME button click
   */
  private handleEndGameClick(): void {
    if (this.endGameButton.buttonType) {
      // COLLECT mode - collect winnings
      this.logger.info('CustomGameScene: Collect clicked');
      
      // Calculate win amount (matching reference: winNumber determines bonus)
      // In real game, this comes from server response
      const winAmount = this.calculateWinAmount(this.winNumber);
      
      // Add win to balance
      this.gameUI.addWin?.(winAmount);
      this.bottomBar.updateBalance(this.gameUI.getBalance() ?? 0);
      
      // TODO: Call API to collect winnings
      
      // After collect, reset game for next round
      this.resetGame();
    } else {
      // END GAME mode - end the game
      this.logger.info('CustomGameScene: End game clicked');
      // TODO: Call API to end game
      // After end game, reset game for next round
      this.resetGame();
    }
  }

  /**
   * Calculate win amount based on win number (matching reference bonus calculation)
   * In real game, this comes from server response
   */
  private calculateWinAmount(winNumber: number): number {
    // Simplified calculation - in real game this comes from server
    // Matching reference: bonus info shows different amounts based on winNumber
    // For now, use a simple multiplier
    const baseWin = this.currentStake * 0.5; // Base win is 50% of stake
    return baseWin * winNumber; // Multiply by win number
  }

  /**
   * Reset game after round completion (matching reference reset behavior)
   */
  private resetGame(): void {
    // Reset game state
    this.isSpinning = false;
    this.winNumber = 0;
    this.purpleGemIndexes = [];
    this.pendingSpinResults = [];
    
    // Reset grid (clear all matches)
    this.grid.resetAll();
    
    // Reset spinner
    this.spinner.reset();
    
    // Reset bonus panel
    this.bonusPanel.reset();
    
    // Reset spin count (in real game, this comes from server)
    this.spinCount = 10;
    this.buttonsPanel.updateSpinCount(this.spinCount);
    
    // Hide END GAME button
    this.endGameButton.visible = false;
    
    // Clear win line animations
    this.grid.clearWinAnimations();
    
    // Update UI
    this.bottomBar.updateDescription('SELECT ANY HIGHLIGHTED NUMBER');
    this.buttonsPanel.setSpinEnabled(true);
    
    // Reset button to START GAME mode
    this.buttonsPanel.setNormalMode();
    
    this.logger.info('CustomGameScene: Game reset');
  }

  /**
   * Calculate win line from matched cell indices (simplified version)
   * In real game, this comes from server matchedPattern
   * @param matchedIndices Array of matched cell indices (0-24)
   * @returns Win line number (0-11) or null if no pattern detected
   */
  private calculateWinLineFromMatch(matchedIndices: number[]): number | null {
    if (matchedIndices.length < 5) return null; // Need at least 5 matches for a line

    // Check for horizontal lines (0-4)
    for (let row = 0; row < 5; row++) {
      const rowCells = Array.from({ length: 5 }, (_, i) => row * 5 + i);
      if (rowCells.every((idx) => matchedIndices.includes(idx))) {
        return row; // Horizontal line 0-4
      }
    }

    // Check for vertical lines (5-9)
    for (let col = 0; col < 5; col++) {
      const colCells = Array.from({ length: 5 }, (_, i) => i * 5 + col);
      if (colCells.every((idx) => matchedIndices.includes(idx))) {
        return col + 5; // Vertical line 5-9
      }
    }

    // Check for diagonal (10): top-left to bottom-right
    const diag1 = [0, 6, 12, 18, 24];
    if (diag1.every((idx) => matchedIndices.includes(idx))) {
      return 10;
    }

    // Check for diagonal (11): top-right to bottom-left
    const diag2 = [4, 8, 12, 16, 20];
    if (diag2.every((idx) => matchedIndices.includes(idx))) {
      return 11;
    }

    return null; // No complete line detected
  }

  /**
   * CHEAT METHODS - For testing and development
   */
  
  /**
   * Force specific spin results (cheat)
   */
  cheatSetSpinResults(results: SpinnerReelResult[]): void {
    if (this.isSpinning) {
      this.logger.warn('CustomGameScene: Cannot set spin results while spinning');
      return;
    }
    this.pendingSpinResults = results;
    this.logger.info(`CustomGameScene: [CHEAT] Set spin results: ${JSON.stringify(results)}`);
  }

  /**
   * Force specific numbers in spin results (cheat)
   */
  cheatSetSpinNumbers(numbers: number[]): void {
    if (numbers.length !== 5) {
      this.logger.warn('CustomGameScene: [CHEAT] Must provide exactly 5 numbers');
      return;
    }
    const results: SpinnerReelResult[] = numbers.map(num => ({
      type: 'number',
      value: num,
    }));
    this.cheatSetSpinResults(results);
  }

  /**
   * Force specific symbols in spin results (cheat)
   */
  cheatSetSpinSymbols(symbols: Array<'joker' | 'super_joker' | 'free_spin' | 'dragon' | 'devil' | 'coin'>): void {
    if (symbols.length !== 5) {
      this.logger.warn('CustomGameScene: [CHEAT] Must provide exactly 5 symbols');
      return;
    }
    const results: SpinnerReelResult[] = symbols.map(symbol => ({
      type: symbol,
    }));
    this.cheatSetSpinResults(results);
    // Update purple gem indexes
    this.purpleGemIndexes = [];
    symbols.forEach((symbol, index) => {
      if (symbol === 'super_joker') {
        this.purpleGemIndexes.push(index);
      }
    });
  }

  /**
   * Force win number (cheat)
   */
  cheatSetWinNumber(winNumber: number): void {
    this.winNumber = Math.max(0, Math.min(12, winNumber)); // Clamp 0-12
    this.bonusPanel.updateWinProgress(this.winNumber);
    this.endGameButton.updateButtonType(this.winNumber > 2);
    if (this.winNumber > 2) {
      this.endGameButton.updateCollectButton(this.winNumber);
    }
    this.logger.info(`CustomGameScene: [CHEAT] Set win number to ${this.winNumber}`);
  }

  /**
   * Force spin count (cheat)
   */
  cheatSetSpinCount(count: number): void {
    this.spinCount = Math.max(0, count);
    this.buttonsPanel.updateSpinCount(this.spinCount);
    this.logger.info(`CustomGameScene: [CHEAT] Set spin count to ${this.spinCount}`);
  }

  /**
   * Force match specific numbers on grid (cheat)
   */
  cheatMatchNumbers(numbers: number[]): void {
    numbers.forEach(num => {
      const matched = this.grid.markMatches(num);
      if (matched.length > 0) {
        this.winNumber += matched.length;
      }
    });
    this.bonusPanel.updateWinProgress(this.winNumber);
    this.endGameButton.updateButtonType(this.winNumber > 2);
    if (this.winNumber > 2) {
      this.endGameButton.updateCollectButton(this.winNumber);
    }
    this.logger.info(`CustomGameScene: [CHEAT] Matched numbers: ${numbers.join(', ')}`);
  }

  /**
   * Force match specific cells by index (cheat)
   */
  cheatMatchCells(cellIndices: number[]): void {
    cellIndices.forEach(index => {
      if (index >= 0 && index < 25) {
        const cell = this.grid.cells[index];
        if (cell && !cell.isMatched) {
          this.grid.markMatches(cell.value);
          this.winNumber += 1;
        }
      }
    });
    this.bonusPanel.updateWinProgress(this.winNumber);
    this.endGameButton.updateButtonType(this.winNumber > 2);
    if (this.winNumber > 2) {
      this.endGameButton.updateCollectButton(this.winNumber);
    }
    this.logger.info(`CustomGameScene: [CHEAT] Matched cells: ${cellIndices.join(', ')}`);
  }

  /**
   * Force complete a win line (cheat)
   */
  cheatCompleteWinLine(lineIndex: number): void {
    if (lineIndex < 0 || lineIndex > 11) {
      this.logger.warn('CustomGameScene: [CHEAT] Invalid line index (0-11)');
      return;
    }
    
    let cellIndices: number[] = [];
    
    // Horizontal lines (0-4)
    if (lineIndex < 5) {
      cellIndices = Array.from({ length: 5 }, (_, i) => lineIndex * 5 + i);
    }
    // Vertical lines (5-9)
    else if (lineIndex < 10) {
      const col = lineIndex - 5;
      cellIndices = Array.from({ length: 5 }, (_, i) => i * 5 + col);
    }
    // Diagonal 1 (10): top-left to bottom-right
    else if (lineIndex === 10) {
      cellIndices = [0, 6, 12, 18, 24];
    }
    // Diagonal 2 (11): top-right to bottom-left
    else if (lineIndex === 11) {
      cellIndices = [4, 8, 12, 16, 20];
    }
    
    this.cheatMatchCells(cellIndices);
    // Show win line animation
    setTimeout(() => {
      this.grid.showWinAnimation([lineIndex]);
    }, 500);
    this.logger.info(`CustomGameScene: [CHEAT] Completed win line ${lineIndex}`);
  }

  /**
   * Force trigger purple gem bonus (cheat)
   */
  cheatTriggerPurpleGem(): void {
    this.purpleGemIndexes = [0, 1, 2]; // Force 3 purple gems
    this.logger.info('CustomGameScene: [CHEAT] Triggered purple gem bonus');
  }

  /**
   * Reset game state (cheat)
   */
  cheatResetGame(): void {
    this.resetGame();
    this.logger.info('CustomGameScene: [CHEAT] Game reset');
  }

  /**
   * Get current game state (cheat)
   */
  cheatGetState(): {
    spinCount: number;
    winNumber: number;
    isSpinning: boolean;
    currentStake: number;
    purpleGemIndexes: number[];
    pendingSpinResults: SpinnerReelResult[];
  } {
    return {
      spinCount: this.spinCount,
      winNumber: this.winNumber,
      isSpinning: this.isSpinning,
      currentStake: this.currentStake,
      purpleGemIndexes: [...this.purpleGemIndexes],
      pendingSpinResults: [...this.pendingSpinResults],
    };
  }

  /**
   * Update (called each frame)
   */
  update(deltaMs: number): void {
    if (this._state !== SceneState.ACTIVE) return;

    // Update spinner
    this.spinner?.update(deltaMs);

    // Update grid animations
    this.grid?.update(deltaMs);

    // Buttons panel doesn't need update (no animations)
  }

  /**
   * Enable/disable debug overlay
   */
  setDebugMode(config: Partial<DebugConfig>): void {
    this.debugConfig = { ...this.debugConfig, ...config };

    if (this.debugConfig.showLayoutRects) {
      this.createDebugOverlay();
    } else {
      this.removeDebugOverlay();
    }
  }

  /**
   * Create debug overlay showing layout rects
   */
  private createDebugOverlay(): void {
    if (this.debugOverlay) return;

    this.debugOverlay = new Container();
    this.debugOverlay.label = 'DebugOverlay';

    const rectNames = ['grid', 'spinner', 'bonusInfo', 'gameButtons', 'gameBottom'];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00];

    rectNames.forEach((name, i) => {
      const rect = layoutRect(name);
      const g = new Graphics();
      g.rect(rect.x, rect.y, rect.width, rect.height);
      g.stroke({ color: colors[i % colors.length], width: 2 });
      this.debugOverlay!.addChild(g);
    });

    this.container.addChild(this.debugOverlay);
  }

  /**
   * Remove debug overlay
   */
  private removeDebugOverlay(): void {
    if (this.debugOverlay) {
      this.container.removeChild(this.debugOverlay);
      this.debugOverlay.destroy({ children: true });
      this.debugOverlay = null;
    }
  }

  /**
   * Destroy the scene
   */
  destroy(): void {
    if (this._state === SceneState.DESTROYED) return;

    this._state = SceneState.DESTROYING;
    this.logger.info('CustomGameScene: Destroying');

    // Stop any playing sounds
    this.audioBus.stop('ReelSpinLoop');

    // Stop video if playing
    if (this.videoSprite) {
      const videoSource = this.videoSprite.texture.source;
      if (videoSource && 'resource' in videoSource) {
        const video = videoSource.resource as HTMLVideoElement;
        if (video && video.pause) {
          video.pause();
        }
      }
    }

    // Cleanup components
    this.grid?.destroy();
    this.spinner?.destroy();
    this.bonusPanel?.destroy();
    this.buttonsPanel?.destroy();
    this.bottomBar?.destroy();
    this.extraSymbols?.destroy();
    this.bonusSlot?.destroy();

    // Remove debug overlay
    this.removeDebugOverlay();

    // Destroy container
    this.container.destroy({ children: true });

    this._state = SceneState.DESTROYED;
    this.logger.info('CustomGameScene: Destroyed');
  }
}

export default CustomGameScene;
