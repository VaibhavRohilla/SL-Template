/**
 * Mock Result Source
 *
 * DEV ONLY - Provides deterministic spin results for offline development.
 * DO NOT USE IN PRODUCTION - Results must come from authoritative backend.
 *
 * Implements ISpinResultSource interface.
 */

import type { SpinResult, SpinRequest, ISpinResultSource } from 'slot-frontend-engine';
import { slotConfig } from '../config/index.js';

/**
 * Generate a UUID (fallback for browsers without crypto.randomUUID)
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Simple seeded random number generator
 * Uses mulberry32 algorithm for deterministic sequences
 */
class SeededRng {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Mock spin result source for development
 */
export class MockResultSource implements ISpinResultSource {
  private rng: SeededRng;
  private spinCounter = 0;
  private readonly simulatedDelayMs: number;

  constructor(seed?: number, delayMs = 200) {
    this.rng = new SeededRng(seed ?? Date.now());
    this.simulatedDelayMs = delayMs;
    console.warn('[MockResultSource] ⚠️ DEV ONLY - Using mock results. DO NOT USE IN PRODUCTION.');
  }

  /**
   * Check if source is available
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Get a spin result
   */
  async getSpinResult(request: SpinRequest): Promise<SpinResult> {
    // Simulate network delay
    await this.delay(this.simulatedDelayMs);

    this.spinCounter++;

    // Generate final grid
    const grid = this.generateGrid();

    // Evaluate wins
    const wins = this.evaluateWins(grid, request.bet);
    const totalWin = wins.reduce((sum, w) => sum + w.winAmount, 0);

    const result: SpinResult = {
      version: 1,
      spinId: generateUUID(),
      sequence: this.spinCounter,
      bet: request.bet,
      grid,
      wins,
      totalWin,
    };

    console.log(`[MockResultSource] Generated: spinId=${result.spinId}, totalWin=${totalWin}`);
    return result;
  }

  /**
   * Generate a random grid based on reel strips
   */
  private generateGrid(): number[][] {
    const grid: number[][] = [];
    const { reelCount, rowsPerReel } = slotConfig.layout;
    const strips = slotConfig.reels.strips;

    for (let reelIdx = 0; reelIdx < reelCount; reelIdx++) {
      const strip = strips[reelIdx];
      if (!strip) {
        grid.push([]);
        continue;
      }

      const rows = rowsPerReel[reelIdx] ?? 3;
      const startPos = this.rng.nextInt(0, strip.length - 1);

      const reelSymbols: number[] = [];
      for (let row = 0; row < rows; row++) {
        const pos = (startPos + row) % strip.length;
        reelSymbols.push(strip[pos] ?? 0);
      }

      grid.push(reelSymbols);
    }

    return grid;
  }

  /**
   * Simple ways evaluation
   */
  private evaluateWins(grid: number[][], bet: number): SpinResult['wins'] {
    const wins: SpinResult['wins'] = [];
    const wildIds = slotConfig.wild?.wildIds ?? [];

    // Check each paying symbol
    for (const paytable of slotConfig.paytable) {
      const symbolId = paytable.symbolId;

      // Count ways from left
      let reelsCovered = 0;
      let ways = 1;
      const positions: Array<{ reel: number; row: number }> = [];

      for (let reelIdx = 0; reelIdx < grid.length; reelIdx++) {
        const reel = grid[reelIdx];
        if (!reel) break;

        const matchingRows: number[] = [];
        for (let rowIdx = 0; rowIdx < reel.length; rowIdx++) {
          const sym = reel[rowIdx];
          if (sym === symbolId || wildIds.includes(sym ?? -1)) {
            matchingRows.push(rowIdx);
          }
        }

        if (matchingRows.length === 0) break;

        reelsCovered++;
        ways *= matchingRows.length;

        for (const row of matchingRows) {
          positions.push({ reel: reelIdx, row });
        }
      }

      // Check if count qualifies for payout
      const payoutKey = String(reelsCovered);
      const multiplier = paytable.payouts[payoutKey];

      if (multiplier && multiplier > 0 && reelsCovered >= 3) {
        wins.push({
          symbolId,
          reelsCovered,
          ways,
          positions,
          winAmount: bet * multiplier * ways,
        });
      }
    }

    return wins;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  reseed(seed: number): void {
    this.rng = new SeededRng(seed);
  }
}

export default MockResultSource;
