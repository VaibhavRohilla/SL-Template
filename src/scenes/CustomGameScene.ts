/**
 * CustomGameScene - Slingo-Style Game Scene
 *
 * Implements the game screen layout:
 * - 5x5 number grid
 * - 1-row horizontal spinner
 * - Shell UI (Top Bar, Bottom Panel)
 *
 * Layer order (bottom to top):
 * 1. Background (video or solid)
 * 2. Game layer (grid + spinner)
 * 3. Overlay layer
 * 4. UI layer (Shell)
 */

import {
  SceneState,
  type SceneContext,
  type IScene,
  type ITweenService,
  SkipPolicy,
  applySkipIfNeeded,
  type ISkippableExecution,
  OutcomeReplayRunner,
  GamePhase,
  shouldApplySkip,
  type FixturePack
} from '@fnx/sl-engine';
import { GameBootstrap } from '../app/GameBootstrap.js';
import { TemplateConfig } from '../app/TemplateConfig.js';

import {
  DESIGN_W,
  DESIGN_H,
  GAME_TABLE_X,
  GAME_TABLE_Y,
  SPINNER_Y_OFFSET,
  GAME_REVEAL_SCALE_START,
  GAME_REVEAL_SCALE_END,
  GAME_REVEAL_DURATION_MS,
  layoutRect,
} from '../layout/DesignLayout.js';

import { SlingoGrid, type TextureResolver } from '../components/SlingoGrid.js';
import { SlingoSpinner, type SpinnerReelResult } from '../components/SlingoSpinner.js';
import { SlotUIShell } from '../ui/Shell.js';
import { GameUI } from '../ui/GameUI.js';
import { OverlayManager } from '../ui/overlays/OverlayManager.js';
import { Container, Sprite, Graphics, Texture } from 'pixi.js';

/**
 * Debug mode configuration
 */


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
export class CustomGameScene implements IScene, ISkippableExecution {
  public readonly id = 'custom-game';
  public readonly container: Container;

  private _state: SceneState = SceneState.CREATED;

  // Services (accessed from context)
  private readonly tweenService: ITweenService;
  private readonly audioBus: IAudioBus;
  private readonly logger: ILogger;
  private readonly gameUI: GameUI;
  private readonly resolveTexture: TextureResolver;

  // Layer containers
  private backgroundLayer!: Container;
  private gameLayer!: Container;
  private overlayLayer!: Container;
  private uiLayer!: Container;

  // Game components
  private grid!: SlingoGrid;
  private spinner!: SlingoSpinner;

  // UI Shell
  private shell!: SlotUIShell;
  private overlayManager!: OverlayManager;

  // Background video element (if using video)
  private videoSprite: Sprite | null = null;

  // Debug overlay
  private debugOverlay: Container | null = null;

  // Game state
  private isSpinning = false;
  private pendingSpinResults: SpinnerReelResult[] = [];
  private purpleGemIndexes: number[] = []; // Track purple gem positions
  private currentStake = 2.0;

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
    this.gameUI = ctx.gameUI as GameUI;

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

    // Create UI Shell
    this.createUIShell();

    // Setup event handlers
    this.setupEventHandlers();

    // Initialize game state
    this.initializeGameState();

    // 3.5 Recovery on startup
    await this.checkRecovery();

    // Play reveal animation
    await this.playRevealAnimation();

    if (this._state === SceneState.MOUNTING) {
      this._state = SceneState.ACTIVE;
      this.logger.info('CustomGameScene: Mounted');
    }
  }

  /**
   * Check for recovery state and hydrate if needed
   */
  private async checkRecovery(): Promise<void> {
    this.logger.info('[Scene] Checking for recovery state...');

    // Mocked server state for demonstration
    // In production, this would be fetched from the backend
    const mockRecoveryState: any = null;

    if (mockRecoveryState) {
      this.logger.info('[Scene] Found existing round! Hydrating...');
      // Show "Restoring..." overlay if needed

      const bootstrap = GameBootstrap.get();
      await bootstrap.hydrate(mockRecoveryState);

      // Render settled state immediately
      this.isSpinning = false;
      this.shell.setSpinningFn(false);
      // Update visual state based on hydrated results
      // this.grid.markMatches(...);
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
      const videoTexture = Texture.from(video);
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
   * Create game components (grid + spinner)
   */
  private createGameComponents(): void {
    // Game container (for scale animation)
    const gameContainer = new Container();
    gameContainer.label = 'GameContainer';
    // Pivot at center for scaling
    gameContainer.pivot.set(DESIGN_W / 2, DESIGN_H / 2);
    gameContainer.position.set(DESIGN_W / 2, DESIGN_H / 2);

    // Grid
    this.grid = new SlingoGrid(this.resolveTexture, this.tweenService);
    this.grid.x = GAME_TABLE_X;
    this.grid.y = GAME_TABLE_Y;
    gameContainer.addChild(this.grid);

    // Spinner
    this.spinner = new SlingoSpinner(this.resolveTexture, this.tweenService);
    this.spinner.x = GAME_TABLE_X;
    this.spinner.y = GAME_TABLE_Y + SPINNER_Y_OFFSET;
    gameContainer.addChild(this.spinner);

    this.gameLayer.addChild(gameContainer);

    // Setup component callbacks
    this.spinner.onReelStopped = (reelIndex, result) => this.handleReelStopped(reelIndex, result);
    this.spinner.onAllReelsStopped = () => this.handleAllReelsStopped();
    this.grid.onCellClick = (cellIndex, value) => this.handleCellClick(cellIndex, value);
  }

  /**
   * Create the UI Shell
   */
  private createUIShell(): void {
    const { width, height } = layoutRect("gameBottom");

    // 1. Main Shell
    this.shell = new SlotUIShell(this.resolveTexture, width, height);
    this.shell.updateFromGameUI(this.gameUI);

    // Wire up Shell events
    this.shell.onSpin = () => this.handleSpinClick();
    this.shell.onBetChange = (delta) => this.handleBetChange(delta);

    // Wire up Menu events
    this.shell.onMenu = () => this.overlayManager.showPaytable();

    this.uiLayer.addChild(this.shell);

    // 2. Overlay Manager (Topmost)
    this.overlayManager = new OverlayManager(width, height);
    this.uiLayer.addChild(this.overlayManager.container);

    // Initial state
    this.shell.setSpinningFn(false);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handled in createUIShell now
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

    // Update UI
    this.gameUI.setBet(this.currentStake);
    this.shell.updateFromGameUI(this.gameUI);
  }

  /**
   * Play reveal animation
   */
  private async playRevealAnimation(): Promise<void> {
    const gameContainer = this.gameLayer.getChildAt(0) as Container | undefined;
    if (!gameContainer) return;

    // Set initial state
    gameContainer.scale.set(GAME_REVEAL_SCALE_START);
    gameContainer.alpha = 0;
    this.shell.alpha = 0;

    // Use proxy object pattern for tweening
    const tweenProxy = { progress: 0 };
    const startScale = GAME_REVEAL_SCALE_START;
    const endScale = GAME_REVEAL_SCALE_END;

    // Store references
    const containerRef = gameContainer;
    const shellRef = this.shell;

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
          shellRef.alpha = p;
        },
      }
    );
  }

  private handleBetChange(delta: number): void {
    const bootstrap = GameBootstrap.get();
    const gate = bootstrap.getGate();
    const policy = bootstrap.getPolicy();

    if (!gate.canChangeBet()) return;

    const newStake = this.currentStake + delta;
    const validation = policy.validateBet(newStake);

    if (validation.ok) {
      this.currentStake = newStake;
      this.gameUI.setBet(this.currentStake);
      this.shell.updateFromGameUI(this.gameUI);
    } else {
      this.logger.warn(`Bet change blocked: ${validation.error.code}`);
    }
  }

  /**
   * Handle Spin Click
   */
  private handleSpinClick(): void {
    const bootstrap = GameBootstrap.get();
    const gate = bootstrap.getGate();

    // If already spinning, the button acts as STOP/TURBO
    if (this.isSpinning) {
      if (gate.canStop() || gate.canQuickSpin()) {
        const skip = bootstrap.getSkip();
        if (gate.canStop()) {
          skip.request(SkipPolicy.SETTLE_NOW, 'ui:stop');
        } else if (gate.canQuickSpin()) {
          skip.request(SkipPolicy.FAST_FORWARD, 'ui:turbo');
        }
      }
      return;
    }

    // Check if we can spin
    if (!gate.canSpin()) {
      this.logger.warn('Action not allowed: SPIN');
      return;
    }

    if (!this.gameUI.canAffordBet(this.currentStake)) {
      this.logger.warn('Not enough balance!');
      return;
    }

    this.gameUI.deductBet(this.currentStake);
    this.gameUI.onSpinStart(this.currentStake); // Updates history etc.
    this.shell.updateFromGameUI(this.gameUI);

    this.startSpin();
  }

  /**
   * Start a spin (SDK integrated)
   */
  private async startSpin(): Promise<void> {
    const bootstrap = GameBootstrap.getInstance();
    const phase = bootstrap.getPhase();

    this.isSpinning = true;
    this.shell.setSpinningFn(true);
    phase.transition(GamePhase.SPINNING, 'user:spin_start');

    // Play spin sound
    this.audioBus.play('ReelSpinLoop', { loop: true, channel: 'sfx' });

    // Start spinner visual
    this.spinner.startSpin();

    // 1. Get Outcomes (SDK Fixture or Backend)
    let outcome;
    if (TemplateConfig.useFixtures) {
      // Mock fixture pack for now, in real game this comes from a JSON
      const mockFixtures: FixturePack = {
        meta: { gameId: 'slingo-template', packId: 'slingo-template', schemaVersion: '1.0.0' },
        entries: [{
          kind: 'NORMALIZED',
          name: 'win_num',
          ctx: { gameId: 'slingo-template' },
          outcome: {
            type: 'CASCADE',
            gameId: 'slingo-template',
            schemaVersion: '1.0.0',
            roundId: 'mock-round-1',
            spinId: 'mock-1',
            bet: { amount: this.currentStake },
            totalWin: 0,
            steps: [{
              index: 0,
              gridBefore: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14, 15]],
              wins: [],
              removedPositions: [],
              gridAfter: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14, 15]]
            }]
          }
        }]
      };
      const runner = new OutcomeReplayRunner(bootstrap.getAdapters());
      runner.load(mockFixtures);
      const replay = await runner.replayEntry('win_num');
      outcome = replay.outcome;
    } else {
      // Call actual backend here
      // outcome = await backend.spin(this.currentStake);
    }

    // Safety check for minSpinDuration (Phase 3.4)
    const startTime = performance.now();

    // Map outcome to spinner results
    const results: SpinnerReelResult[] = outcome ? this.mapOutcomeToSpinner(outcome) : this.generateSpinResults();

    // Simulate delay or wait for outcomes
    await new Promise(r => setTimeout(r, 1000));

    // Ensure min duration is met (Presentation only)
    const elapsed = performance.now() - startTime;
    const minDuration = bootstrap.getPolicy().getPolicy().minSpinDurationMs;
    if (elapsed < minDuration) {
      await new Promise(r => setTimeout(r, minDuration - elapsed));
    }

    // Check for skip/turbo
    await applySkipIfNeeded({
      controller: bootstrap.getSkip(),
      phase: phase.getPhase(),
      execution: this
    });

    // Stop reels
    this.spinner.stopWithResults(results, 150);

    // Wait for all stopped
    // handleAllReelsStopped will be called by component callback
  }

  /**
   * Map SDK outcome to template spinner results
   */
  private mapOutcomeToSpinner(_outcome: any): SpinnerReelResult[] {
    // Simplistic mapping for now
    return [
      { type: 'number', value: 10 },
      { type: 'number', value: 20 },
      { type: 'number', value: 30 },
      { type: 'number', value: 40 },
      { type: 'number', value: 50 },
    ];
  }

  // ============================================================================
  // ISkippableExecution implementation
  // ============================================================================

  public shouldApplySkip(_policy: SkipPolicy): boolean {
    const bootstrap = GameBootstrap.getInstance();
    return shouldApplySkip(bootstrap.getPhase().getPhase());
  }

  public applySkip(policy: SkipPolicy): void {
    this.logger.info(`[Scene] Applying skip: ${policy}`);

    if (policy === SkipPolicy.SETTLE_NOW) {
      this.spinner.forceStopAll();
    }
  }

  /**
   * Generate spin results (mock)
   */
  private generateSpinResults(): SpinnerReelResult[] {
    const results: SpinnerReelResult[] = [];
    this.purpleGemIndexes = []; // Reset purple gems

    for (let i = 0; i < 5; i++) {
      // 80% chance of number, 20% chance of special symbol
      if (Math.random() > 0.2) {
        const randomNum = Math.floor(Math.random() * 60) + 1;
        results.push({ type: 'number', value: randomNum });
      } else {
        const specials: Array<SpinnerReelResult['type']> = ['joker', 'super_joker', 'free_spin', 'dragon'];
        const specialType = specials[Math.floor(Math.random() * specials.length)];
        results.push({ type: specialType ?? 'joker' });

        if (specialType === 'super_joker') {
          this.purpleGemIndexes.push(i);
        }
      }
    }
    return results;
  }

  /**
   * Handle single reel stopped
   */
  private handleReelStopped(reelIndex: number, result: SpinnerReelResult): void {
    // Play stop sound
    const stopSounds = ['ReelStop_V1', 'ReelStop_V2', 'ReelStop_V3'] as const;
    const soundIndex = reelIndex % 3;
    this.audioBus.play(stopSounds[soundIndex] ?? 'ReelStop_V1', { channel: 'sfx' });

    // Logic for immediate matches (numbers)
    if (result.type === 'number' && result.value !== undefined) {
      this.grid.updateMatchedSymbolText(result.value);
      this.spinner.updateMatchedText(reelIndex);
    }
  }

  /**
   * Handle all reels stopped
   */
  private handleAllReelsStopped(): void {
    this.audioBus.stop('ReelSpinLoop');
    this.isSpinning = false;
    const bootstrap = GameBootstrap.get();
    bootstrap.getPhase().transition(GamePhase.SETTLED, 'spin:complete');
    this.shell.setSpinningFn(false);

    // Process wins (mock)
    const matchedNumbers: number[] = [];
    this.pendingSpinResults.forEach((result) => {
      if (result.type === 'number' && result.value !== undefined) {
        matchedNumbers.push(result.value);
      }
    });

    let totalWin = 0;

    // Process matches
    if (matchedNumbers.length > 0) {
      matchedNumbers.forEach((number) => {
        const matched = this.grid.markMatches(number);
        if (matched.length > 0) {
          // Mock win amount
          totalWin += matched.length * (this.currentStake * 0.1);
        }
      });
    }

    // Line wins?
    const lineWin = this.grid.checkForWins(); // Hypothetical method on grid to check complete lines
    if (lineWin > 0) {
      totalWin += lineWin * this.currentStake;
    }

    if (totalWin > 0) {
      this.gameUI.addWin(totalWin);
      this.shell.updateFromGameUI(this.gameUI);

      // Show Big Win if huge (e.g. > 10x stake)
      if (totalWin > this.currentStake * 10) {
        this.overlayManager.showBigWin(totalWin);
      }
    }
  }

  private handleCellClick(cellIndex: number, value: number): void {
    this.audioBus.play('SymbolClick', { channel: 'sfx' });
    this.logger.info(`Cell clicked: ${cellIndex} (${value})`);
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
  }

  /**
   * Destroy the scene
   */
  destroy(): void {
    if (this._state === SceneState.DESTROYED) return;

    this._state = SceneState.DESTROYING;
    this.logger.info('CustomGameScene: Destroying');

    this.audioBus.stop('ReelSpinLoop');

    // Cleanup components
    this.grid?.destroy();
    this.spinner?.destroy();
    this.shell?.destroy();

    // Remove debug overlay
    if (this.debugOverlay) {
      this.container.removeChild(this.debugOverlay);
      this.debugOverlay.destroy({ children: true });
      this.debugOverlay = null;
    }

    this.container.destroy({ children: true });

    this._state = SceneState.DESTROYED;
    this.logger.info('CustomGameScene: Destroyed');
  }
}

export default CustomGameScene;
