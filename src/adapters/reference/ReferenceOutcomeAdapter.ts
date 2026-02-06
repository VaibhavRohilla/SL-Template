import {
    type NormalizedSpinOutcome,
    SDKContractError,
    SDKContractErrorCode,
    type IOutcomeAdapter,
    type AdapterContext,
    type StepMeta,
    type StepType
} from '@fnx/sl-engine';
import { TSpinResponse, TLine, TGameData } from './types.js';

// SDK Feature Payload expects an array of typed objects
type FeaturePayload = Array<{
    type: string;
    payload?: unknown;
}>;

type CascadeOutcome = Extract<NormalizedSpinOutcome, { type: 'CASCADE' }>;
type LineWin = NonNullable<NonNullable<CascadeOutcome['steps']>[0]['wins']>[0];

/**
 * ReferenceOutcomeAdapter
 * 
 * Adapts the "wildvodu" (Reference Game) backend response to the SDK NormalizedSpinOutcome.
 * 
 * Contract:
 * - Input: TSpinResponse (JSON)
 * - Output: NormalizedSpinOutcome (CASCADE type)
 * - Grid: Converts Column-Major [col][row] -> Row-Major [row][col] (Standard SDK/PIXI preference)
 * - Indices: Row-Major 1D indices for win positions.
 */
export class ReferenceOutcomeAdapter implements IOutcomeAdapter<TSpinResponse> {
    public readonly id = 'reference:wildvodu';
    public readonly priority = 50;

    public supports(context: AdapterContext): boolean {
        return context.gameId === 'wildvodu';
    }

    public parse(data: unknown): TSpinResponse {
        if (!this.isValidResponse(data)) {
            throw new SDKContractError(
                SDKContractErrorCode.INVALID_RAW_SCHEMA,
                'Reference adapter received invalid raw response'
            );
        }
        if (!data.success) {
            throw new SDKContractError(
                SDKContractErrorCode.INVALID_RAW_SCHEMA,
                'Backend response indicated failure'
            );
        }
        return data;
    }

    public toNormalized(response: TSpinResponse, context: AdapterContext): NormalizedSpinOutcome {
        // Safe access validated by parse/supports
        const keys = Object.keys(response.results);
        if (keys.length === 0) {
            throw new SDKContractError(
                SDKContractErrorCode.INVALID_RAW_SCHEMA,
                'No keys in results map'
            );
        }

        const firstKey = keys[0]!;
        const resultEntry = response.results[firstKey];

        if (!resultEntry || !resultEntry.data) {
            throw new SDKContractError(
                SDKContractErrorCode.INVALID_RAW_SCHEMA,
                `Missing data for key ${firstKey}`
            );
        }

        const rawData = resultEntry.data;
        const rawSteps: TGameData[] = Array.isArray(rawData) ? rawData : [rawData];

        if (rawSteps.length === 0) {
            throw new SDKContractError(
                SDKContractErrorCode.INVALID_RAW_SCHEMA,
                'Data array is empty'
            );
        }

        const finalStepOps = rawSteps[rawSteps.length - 1];
        if (!finalStepOps) {
            throw new SDKContractError(SDKContractErrorCode.INVALID_RAW_SCHEMA, 'Unexpected empty last step');
        }
        const totalWin = finalStepOps.totalWon;

        const steps = rawSteps.map((stepData, index) => {
            return this.mapStep(stepData, index, firstKey);
        });

        // Construct Normalized Outcome
        const normalized: NormalizedSpinOutcome = {
            type: 'CASCADE',
            gameId: context.gameId,
            schemaVersion: '1.0.0',
            roundId: `ref-${Date.now()}`,
            spinId: `spin-${Date.now()}`,
            bet: {
                amount: rawSteps[0]!.betAmount,
                currency: 'USD'
            },
            totalWin: totalWin,
            steps: steps,
            features: this.extractFeatures(rawSteps),
            presentationHints: {
                restoreStep: rawSteps[0]!.current?.next || 0
            }
        };

        return normalized;
    }

    private mapStep(data: TGameData, index: number, sourceKey: string): NonNullable<CascadeOutcome['steps']>[0] {
        const spinResult = data.spinResult;

        if (!spinResult.grid || spinResult.grid.length !== 5) {
            throw new SDKContractError(
                SDKContractErrorCode.INVALID_RAW_SCHEMA,
                'Expected 5 columns in grid'
            );
        }

        // Transpose Grid
        const cols = 5;
        const rows = 4;
        const gridAfter: number[][] = [];
        for (let r = 0; r < rows; r++) {
            const rowArr: number[] = [];
            for (let c = 0; c < cols; c++) {
                const col = spinResult.grid[c];
                if (col && col.length === rows) {
                    rowArr.push(Number(col[r]));
                } else {
                    throw new SDKContractError(
                        SDKContractErrorCode.INVALID_RAW_SCHEMA,
                        'Expected 4 rows per column'
                    );
                }
            }
            gridAfter.push(rowArr);
        }

        // Map Wins
        const lines = (spinResult.lines || []) as TLine[];
        const wins: LineWin[] = lines
            .filter((l): l is TLine => !!l && !!l.p)
            .map((line: TLine) => {
                const positions: number[] = [];
                const mc = line.mc || 0;
                if (Array.isArray(line.p)) {
                    line.p.forEach((rowIndex, colIndex) => {
                        if (colIndex < mc) {
                            const idx = rowIndex * cols + colIndex;
                            positions.push(idx);
                        }
                    });
                }
                return {
                    symbolId: Number(line.s || 0),
                    amount: Number(line.w || 0),
                    positions
                };
            });

        // Meta Classification
        let stepType: StepType = 'UNKNOWN';
        if (index === 0) {
            stepType = 'BASE';
        } else {
            stepType = 'FEATURE_STEP';
            // Refine if possible: if triggerFreeGame was true in PREVIOUS step, this is likely a FREESPIN step?
            // For now, adhere to "i>0 => FEATURE_STEP" or "RESPIN" if we had a flag.
            // Using FEATURE_STEP as a safe default for non-base steps in this sequence.
        }

        const meta: StepMeta = {
            stepType,
            stepIndex: index,
            sourceKey,
            stickyWilds: spinResult.stickyWilds,
            scatterCount: spinResult.scatterCount,
            triggerFreeGame: spinResult.triggerFreeGame
        };

        return {
            index,
            gridAfter,
            wins,
            removedPositions: [],
            meta
        };
    }

    private isValidResponse(raw: any): raw is TSpinResponse {
        return raw && typeof raw === 'object' && 'results' in raw;
    }

    private extractFeatures(rawSteps: TGameData[]): FeaturePayload {
        const features: FeaturePayload = [];

        let freeSpinsTriggered = false;
        const lastStep = rawSteps[rawSteps.length - 1];
        if (!lastStep) {
            return features;
        }
        const lastResult = lastStep.spinResult;

        for (const step of rawSteps) {
            if (step.spinResult.triggerFreeGame) {
                freeSpinsTriggered = true;
            }
        }

        // Map raw features to standardized feature objects
        features.push({
            type: 'scatter_info',
            payload: {
                count: lastResult.scatterCount,
                positions: lastResult.scatterPositions
            }
        });

        features.push({
            type: 'free_spins_trigger',
            payload: {
                triggered: freeSpinsTriggered
            }
        });

        features.push({
            type: 'sticky_wilds',
            payload: lastResult.stickyWilds
        });

        return features;
    }

}

