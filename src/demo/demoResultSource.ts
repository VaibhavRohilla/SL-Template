/**
 * Demo result source: first spin returns a guaranteed line-win outcome so paylines can be tested.
 * Subsequent spins use the engine MockResultSource (random grids, no wins from backend).
 *
 * Use this when running the Template without a real backend so at least one "winning case"
 * exists for payline visualization (normal and skip path).
 */

import type {
  ISpinResultSource,
  SpinOutcome,
  SpinRequest,
  SlotConfig,
} from '@fnx/sl-engine';
import { SCHEMA_VERSION, StageType, MockResultSource } from '@fnx/sl-engine';
import { slotConfig, SymbolId } from '../config/slotConfig.js';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Build a single-stage outcome with one line win on payline 1 (center row, 5x GOLD_PIGGY).
 * Grid and win match slotConfig paylines and paytable so payline visualization works.
 */
function getDemoLineWinOutcome(bet: number): SpinOutcome {
  // Payline 1: pattern [0,0,0,0,0] = row 0 on all reels. 5x GOLD_PIGGY (52), paytable 5 => 200
  const lineId =6 ;
  const paylinePattern = [2, 1, 2, 1, 2];
  const symbolId = SymbolId.GOLD_PIGGY;
  const winMultiplier = 200; // from paytable for 5 symbols
  const winAmount = bet * winMultiplier;

  const positions = [
    { reel: 0, row: 0 },
    { reel: 1, row: 0 },
    { reel: 2, row: 0 },
    { reel: 3, row: 0 },
    { reel: 4, row: 0 },
  ];

  // Grid: 5 reels x 4 rows. Winning row = row 0 all same symbol; other cells = non-winning
  const grid: number[][] = [];
  for (let reel = 0; reel < 5; reel++) {
    const col: number[] = [];
    for (let row = 0; row < 4; row++) {
      col.push(row === 0 ? symbolId : SymbolId.NINE);
    }
    grid.push(col);
  }

  return {
    version: SCHEMA_VERSION,
    spinId: generateUUID(),
    sequence: 0,
    bet,
    totalWin: winAmount,
    stages: [
      {
        stageId: 0,
        stageType: StageType.BASE,
        grid,
        wins: [
          {
            symbolId,
            winAmount,
            positions,
            count: 5,
            multiplicity: 1,
            winType: 'line',
            meta: {
              lineId,
              paylinePattern,
              direction: 'left-to-right',
            },
          },
        ],
        stageWin: winAmount,
        triggers: [],
      },
    ],
    timestamp: Date.now(),
    meta: { debug: { demoLineWin: true } },
  };
}

/**
 * Result source that returns a guaranteed line-win outcome on the first spin,
 * then delegates to MockResultSource for subsequent spins.
 */
export class DemoResultSource implements ISpinResultSource {
  private readonly mock: MockResultSource;
  private spinCount = 0;

  constructor(config: SlotConfig = slotConfig, seed?: number) {
    this.mock = new MockResultSource(config, seed);
  }

  async isAvailable(): Promise<boolean> {
    return this.mock.isAvailable();
  }

  async getSpinResult(request: SpinRequest): Promise<SpinOutcome> {
    const isFirstSpin = this.spinCount === 0;
    this.spinCount += 1;

    if (isFirstSpin) {
      return getDemoLineWinOutcome(request.bet);
    }
    return this.mock.getSpinResult(request);
  }
}
