/**
 * Asset Keys Validator
 *
 * Validates that all asset keys referenced by slotConfig and BrandConfig (UI_ASSETS
 * used in bootConfig and frameConfig) exist in manifest.json.
 *
 * Usage: tsx tools/asset-keys-validate.ts
 * Called by: pnpm assets:check (doctor)
 */

import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { ProjectConfig, OutputConfig } from './config.js';

function collectStrings(obj: unknown, out: Set<string>): void {
  if (typeof obj === 'string') {
    out.add(obj);
    return;
  }
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const v of Object.values(obj)) {
      collectStrings(v, out);
    }
  }
}

async function getReferencedKeys(): Promise<Set<string>> {
  const ref = new Set<string>();
  const srcRoot = path.join(ProjectConfig.rootDir, 'src');

  try {
    // slotConfig.symbols[].spriteKey
    const slotConfigUrl = pathToFileURL(path.join(srcRoot, 'config', 'slotConfig.ts')).href;
    const { slotConfig } = await import(slotConfigUrl);
    if (slotConfig?.symbols) {
      for (const s of slotConfig.symbols) {
        if (s.spriteKey) ref.add(s.spriteKey);
      }
    }
  } catch (e) {
    console.warn('[asset-keys-validate] Could not load slotConfig:', (e as Error).message);
  }

  try {
    const assetMapUrl = pathToFileURL(path.join(srcRoot, 'ui', 'reference', 'AssetMap.ts')).href;
    const { UI_ASSETS } = await import(assetMapUrl);
    collectStrings(UI_ASSETS, ref);
  } catch (e) {
    console.warn('[asset-keys-validate] Could not load AssetMap:', (e as Error).message);
  }

  return ref;
}

function getManifestKeys(): Set<string> {
  const manifestPath = OutputConfig.manifestFullPath;
  if (!fs.existsSync(manifestPath)) {
    return new Set();
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const keys = new Set<string>();
  for (const bundle of manifest.bundles || []) {
    for (const asset of bundle.assets || []) {
      if (asset.key) keys.add(asset.key);
    }
  }
  return keys;
}

export async function runAssetKeysValidateAsync(): Promise<{ passed: boolean; missing: string[] }> {
  const manifestKeys = getManifestKeys();
  if (manifestKeys.size === 0) {
    return { passed: false, missing: ['(manifest not found or empty; run pnpm assets:build)'] };
  }

  const referenced = await getReferencedKeys();
  const missing: string[] = [];
  for (const key of referenced) {
    if (!manifestKeys.has(key)) {
      missing.push(key);
    }
  }
  missing.sort();
  return { passed: missing.length === 0, missing };
}

async function main(): Promise<void> {
  const result = await runAssetKeysValidateAsync();
  const jsonMode = process.argv.includes('--json');
  if (jsonMode) {
    console.log(JSON.stringify({ passed: result.passed, missing: result.missing }));
    process.exit(result.passed ? 0 : 1);
  }
  if (result.passed) {
    console.log('✅ All referenced asset keys exist in manifest.');
    process.exit(0);
  }
  console.error('❌ Missing asset keys in manifest:');
  for (const key of result.missing) {
    console.error(`   - ${key}`);
  }
  console.error('\nAdd the missing assets to assets/boot or assets/main, then run: pnpm assets:build');
  process.exit(1);
}

main();
