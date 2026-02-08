import { slotConfig } from '../config/slotConfig.js';
import type { TextureAssetKey } from '../Asset.js';

/**
 * SymbolKeyResolver
 * 
 * Maps numeric symbol IDs to manifest-safe texture keys.
 */
export class SymbolKeyResolver {
    /**
     * Get the texture key for a given symbol ID.
     * @param symbolId numeric ID from the backend/grid
     * @returns TextureAssetKey from current manifest
     */
    public static getTextureKey(symbolId: number): TextureAssetKey {
        const symbol = slotConfig.symbols.find(s => s.id === symbolId);

        if (!symbol) {
            console.warn(`[SymbolKeyResolver] Unknown symbolId: ${symbolId}. Falling back to 'symbols/9'`);
            return 'symbols/9';
        }

        return symbol.spriteKey as TextureAssetKey;
    }
}
