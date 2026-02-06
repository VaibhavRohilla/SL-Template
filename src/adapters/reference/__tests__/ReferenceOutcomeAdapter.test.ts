import { describe, it, expect } from 'vitest';
import { ReferenceOutcomeAdapter } from '../ReferenceOutcomeAdapter.js';
import { SDKContractErrorCode } from '@fnx/sl-engine';

describe('ReferenceOutcomeAdapter', () => {
    const adapter = new ReferenceOutcomeAdapter();
    const context = { gameId: 'wildvodu', currency: 'USD' };

    const validResponse = {
        success: true,
        balance: 1000,
        results: {
            "req-1": {
                data: {
                    gameType: "wildvodu",
                    betAmount: 10,
                    currentSpinWon: 50,
                    totalWon: 50,
                    current: { next: 1 },
                    spinResult: {
                        grid: [
                            [1, 2, 3, 4],
                            [1, 2, 3, 4],
                            [1, 2, 3, 4],
                            [1, 2, 3, 4],
                            [1, 2, 3, 4]
                        ],
                        lines: [
                            {
                                s: 1,
                                l: [1, 1, 1],
                                mc: 3,
                                w: 50,
                                p: [0, 0, 0, 1, 2]
                            }
                        ],
                        scatterCount: 0,
                        scatterPositions: [],
                        triggerFreeGame: false,
                        stickyWilds: {}
                    }
                }
            }
        }
    };

    it('identifies itself correctly', () => {
        expect(adapter.id).toBe('reference:wildvodu');
        expect(adapter.supports(context)).toBe(true);
        expect(adapter.supports({ ...context, gameId: 'other' })).toBe(false);
    });

    it('converts a valid response to NormalizedSpinOutcome', () => {
        const parsed = adapter.parse(validResponse);
        const normalized = adapter.toNormalized(parsed, context);

        expect(normalized.type).toBe('CASCADE');

        if (normalized.type !== 'CASCADE') throw new Error('Expected CASCADE');

        expect(normalized.totalWin).toBe(50);
        expect(normalized.steps).toHaveLength(1);

        const step = normalized.steps[0];
        if (!step) throw new Error('Steps[0] is undefined');

        // Check Meta Correctness (Phase 1 Refactor Requirement)
        expect(step.meta).toBeDefined();
        expect(step.meta?.stepType).toBe('BASE');
        expect(step.meta?.stepIndex).toBe(0);
        expect(step.meta?.sourceKey).toBe('req-1');
        expect(step.meta?.stickyWilds).toEqual({});

        // Cast gridAfter
        const gridAfter = step.gridAfter as number[][];
        expect(gridAfter[0]).toEqual([1, 1, 1, 1, 1]);
        expect(gridAfter[1]).toEqual([2, 2, 2, 2, 2]);

        // Check Wins
        expect(step.wins).toBeDefined();
        const wins = step.wins!;
        const win = wins[0];

        if (!win) throw new Error('Win 0 missing');

        expect(win.symbolId).toBe(1);
        expect(win.amount).toBe(50);
        // matchCount removed from SDK contract

        const positions = win.positions;
        if (!positions) throw new Error('Positions undefined');
        expect(positions).toEqual([0, 1, 2]);
    });

    it('throws on success: false', () => {
        const bad = { success: false, results: {} };
        expect(() => {
            const parsed = adapter.parse(bad);
            adapter.toNormalized(parsed, context);
        }).toThrow(/backend response indicated failure/i);
    });

    it('throws on missing grid columns', () => {
        const badGrid = JSON.parse(JSON.stringify(validResponse));
        badGrid.results["req-1"].data.spinResult.grid = [[1, 2, 3, 4]];

        try {
            const parsed = adapter.parse(badGrid);
            adapter.toNormalized(parsed, context);
        } catch (e) {
            expect((e as any).code).toBe(SDKContractErrorCode.INVALID_RAW_SCHEMA);
        }
    });
});
