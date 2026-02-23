/**
 * Game UI Handler
 *
 * Implements ISlotUI and IWinFormatter interfaces.
 * The game is responsible for UI, balance management, and currency formatting.
 *
 * NOTE: This is a simple implementation. Production games should:
 * - Fetch initial balance from backend
 * - Verify all transactions server-side
 * - Use proper currency formatting libraries
 */

import type { ISlotUI, IWinFormatter } from '@fnx/sl-engine';

export interface GameUIConfig {
  /** Initial balance for demo/dev mode */
  initialBalance: number;
  /** Currency symbol */
  currencySymbol: string;
  /** Locale for number formatting */
  locale: string;
  /** Decimal places */
  decimals: number;
}

const DEFAULT_CONFIG: GameUIConfig = {
  initialBalance: 1000.0,
  currencySymbol: '$',
  locale: 'en-US',
  decimals: 2,
};

/**
 * Game UI implementation
 * Handles balance, bet management, and win display
 */
export class GameUI implements ISlotUI, IWinFormatter {
  private balance: number;
  private currentBet: number;
  private lastWin: number = 0;
  private isSpinning: boolean = false;
  private readonly config: GameUIConfig;

  // DOM elements (optional - for HTML UI overlay)
  private balanceElement: HTMLElement | null = null;
  private betElement: HTMLElement | null = null;
  private winElement: HTMLElement | null = null;
  private spinButton: HTMLButtonElement | null = null;

  // Callbacks for external UI updates
  public onBalanceChanged?: (balance: number, formatted: string) => void;
  public onBetChanged?: (bet: number, formatted: string) => void;
  public onWinChanged?: (win: number, formatted: string) => void;

  constructor(config: Partial<GameUIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.balance = this.config.initialBalance;
    this.currentBet = 1.0; // Default bet

    // Try to find DOM elements
    this.balanceElement = document.getElementById('balance-value');
    this.betElement = document.getElementById('bet-value');
    this.winElement = document.getElementById('win-value');
    this.spinButton = document.getElementById('spin-button') as HTMLButtonElement;

    // Initial UI update
    this.updateUI();
  }

  /**
   * Update all UI button states
   */
  public updateButtonStates(): void {
    if (this.spinButton) {
      this.spinButton.disabled = this.isSpinning;
    }
  }

  // ============================================================================
  // IWinFormatter implementation
  // ============================================================================

  /**
   * Format a win amount for display
   */
  formatWin(amount: number): string {
    return this.formatCurrency(amount);
  }

  /**
   * Format balance for display
   */
  formatBalance(amount: number): string {
    return this.formatCurrency(amount);
  }

  // ============================================================================
  // ISlotUI implementation
  // ============================================================================

  /**
   * Called when a spin starts
   */
  onSpinStart(bet: number): void {
    this.isSpinning = true;
    this.lastWin = 0;
    this.updateWinDisplay(0);
    this.updateButtonStates();
    console.log(`[GameUI] Spin started with bet: ${this.formatCurrency(bet)}`);
  }

  /**
   * Called when a spin completes
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSpinComplete(result: any): void {
    this.isSpinning = false;
    this.updateButtonStates();
    console.log(`[GameUI] Spin complete: ${result.spinId}, win: ${this.formatCurrency(result.totalWin)}`);
  }

  /**
   * Called to update win display
   */
  onWinUpdate(amount: number, formattedWin: string): void {
    this.lastWin = amount;
    this.updateWinDisplay(amount);
    console.log(`[GameUI] Win update: ${formattedWin}`);
  }

  /**
   * Called to update balance display
   */
  onBalanceUpdate(balance: number, formattedBalance: string): void {
    this.balance = balance;
    this.updateBalanceDisplay();
    console.log(`[GameUI] Balance update: ${formattedBalance}`);
  }

  /**
   * Get current bet amount
   */
  getCurrentBet(): number {
    return this.currentBet;
  }

  /**
   * Check if player can afford bet
   */
  canAffordBet(bet: number): boolean {
    return this.balance >= bet;
  }

  /**
   * Deduct bet from balance
   */
  deductBet(bet: number): void {
    if (this.canAffordBet(bet)) {
      this.balance -= bet;
      this.updateBalanceDisplay();
      console.log(`[GameUI] Bet deducted: ${this.formatCurrency(bet)}, new balance: ${this.formatCurrency(this.balance)}`);
    }
  }

  /**
   * Add win to balance
   */
  addWin(amount: number): void {
    this.balance += amount;
    this.lastWin = amount;
    this.updateBalanceDisplay();
    this.updateWinDisplay(amount);
    console.log(`[GameUI] Win added: ${this.formatCurrency(amount)}, new balance: ${this.formatCurrency(this.balance)}`);
  }

  // ============================================================================
  // Additional methods
  // ============================================================================

  /**
   * Set bet amount
   */
  setBet(bet: number): void {
    this.currentBet = bet;
    this.updateBetDisplay();
    this.onBetChanged?.(bet, this.formatCurrency(bet));
  }

  /**
   * Get current balance
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Set balance (for dev/testing)
   */
  setBalance(balance: number): void {
    this.balance = balance;
    this.updateBalanceDisplay();
  }

  /**
   * Get last win amount
   */
  getLastWin(): number {
    return this.lastWin;
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  public formatCurrency(amount: number): string {
    const formatted = new Intl.NumberFormat(this.config.locale, {
      minimumFractionDigits: this.config.decimals,
      maximumFractionDigits: this.config.decimals,
    }).format(amount);

    return `${this.config.currencySymbol}${formatted}`;
  }

  private updateUI(): void {
    this.updateBalanceDisplay();
    this.updateBetDisplay();
    this.updateWinDisplay(this.lastWin);
  }

  private updateBalanceDisplay(): void {
    const formatted = this.formatCurrency(this.balance);
    if (this.balanceElement) {
      this.balanceElement.textContent = formatted;
    }
    this.onBalanceChanged?.(this.balance, formatted);
  }

  private updateBetDisplay(): void {
    const formatted = this.formatCurrency(this.currentBet);
    if (this.betElement) {
      this.betElement.textContent = formatted;
    }
  }

  private updateWinDisplay(amount: number): void {
    const formatted = this.formatCurrency(amount);
    if (this.winElement) {
      this.winElement.textContent = formatted;
    }
    this.onWinChanged?.(amount, formatted);
  }
}

export default GameUI;

