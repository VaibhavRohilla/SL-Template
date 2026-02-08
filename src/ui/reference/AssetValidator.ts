import { Assets } from 'pixi.js';
import { UI_ASSETS } from './AssetMap.js';

/**
 * Validates that all assets defined in UI_ASSETS are present in the Pixi Assets cache.
 * Throws if any critical asset is missing in DEV mode.
 */
export class AssetValidator {
    /**
     * Validates all keys in AssetMap against current Pixi Assets cache.
     * @param manifest Optional manifest object to check against if cache is not yet populated
     */
    public static validate(manifest?: any): void {
        console.log('[AssetValidator] Starting UI asset validation...');
        const missing: string[] = [];
        const manifestKeys = manifest ? this.extractManifestKeys(manifest) : null;

        const checkKey = (key: string) => {
            // First check Pixi cache
            if (Assets.cache.has(key)) return;

            // If manifest provided, check against manifest keys
            if (manifestKeys && manifestKeys.has(key)) return;

            // Otherwise, it's missing
            missing.push(key);
        };

        const traverse = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    // Only check strings that look like asset keys (not font family names if they are just strings)
                    // But in our AssetMap, all strings are keys.
                    checkKey(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    traverse(obj[key]);
                }
            }
        };

        traverse(UI_ASSETS);

        if (missing.length > 0) {
            console.error('[AssetValidator] ❌ Missing UI Assets:', missing);
            console.warn('[AssetValidator] Ensure manifest.json is updated: pnpm assets:manifest');
            throw new Error(`UI Mapping Error: Missing ${missing.length} critical assets in manifest/cache. Use AssetKeys to ensure type safety.`);
        }

        console.log('[AssetValidator] ✅ All UI assets validated successfully.');
    }

    private static extractManifestKeys(manifest: any): Set<string> {
        const keys = new Set<string>();
        if (manifest.bundles) {
            for (const bundle of manifest.bundles) {
                if (bundle.assets) {
                    for (const asset of bundle.assets) {
                        keys.add(asset.key);
                    }
                }
            }
        }
        return keys;
    }
}
