import { type IPersistentFeatureStore } from '@fnx/sl-engine';

export interface StickyWildStoreData {
    wilds: string[]; // List of "col,row" strings
}

/**
 * StickyWildStore
 * 
 * Manages the persistence of sticky wilds across sequenced steps.
 * 
 * Responsibilities:
 * - Maintain a set of active sticky positions ("col,row").
 * - Apply sticky positions to a grid (overlay logic).
 * - Hydrate/Serialize for recovery.
 */
export class StickyWildStore implements IPersistentFeatureStore<StickyWildStoreData> {
    private readonly wilds: Set<string>;

    constructor() {
        this.wilds = new Set();
    }

    public get activeWilds(): Set<string> {
        return this.wilds;
    }

    public reset(): void {
        this.wilds.clear();
    }

    /**
     * Merge new sticky wilds from a feature payload.
     * Expects payload in format { "col,row": 1, ... }
     * 
     * Contract implementation: applyFromStep
     */
    public applyFromStep(
        stepMeta: Record<string, unknown>,
        _stepFeatures?: Record<string, unknown>
    ): void {
        const payload = stepMeta.stickyWilds as Record<string, number> | undefined;
        if (!payload) return;

        for (const key of Object.keys(payload)) {
            if (payload[key]) {
                this.wilds.add(key);
            }
        }
    }

    /**
     * Overlay sticky wilds onto a grid.
     * 
     * @param grid - The grid to modify (Row-Major [row][col])
     * @param stickySymbolId - The symbol ID to place (e.g. WILD/STICKY_WILD id)
     */
    public applyToGrid(grid: number[][], stickySymbolId: number): number[][] {
        // Clone grid to avoid mutation side effects on original outcome
        const newGrid = grid.map(row => [...row]);

        this.wilds.forEach(pos => {
            const [cStr, rStr] = pos.split(',');
            if (!cStr || !rStr) return;
            const col = parseInt(cStr, 10);
            const row = parseInt(rStr, 10);

            if (isNaN(col) || row === undefined || isNaN(row)) return;

            // Adapter output is Row-Major [row][col]
            if (newGrid[row] && newGrid[row][col] !== undefined) {
                newGrid[row][col] = stickySymbolId;
            }
        });

        return newGrid;
    }

    public serialize(): StickyWildStoreData {
        return {
            wilds: Array.from(this.wilds)
        };
    }

    public hydrate(data: StickyWildStoreData): void {
        this.wilds.clear();
        if (data && Array.isArray(data.wilds)) {
            data.wilds.forEach(w => this.wilds.add(w));
        }
    }
}
