/**
 * Manifest Generator for Slot Game Template
 *
 * Adapted from engine tools. Scans assets/boot/ and assets/main/
 * and generates manifest.json with boot + main bundles.
 *
 * Usage: pnpm manifest:generate
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BundleConfig,
  OutputConfig,
  AssetTypeConfig,
  KeyNormalizationConfig,
  AudioSpriteConfig,
  getAssetPath,
  getAllBundleDirs,
  BuildConfig,
  ProjectConfig,
} from '../config.js';
import { generateSuggestions, saveSuggestions } from '../suggestions-generator.js';

interface AssetEntry {
  key: string;
  type: 'texture' | 'spritesheet' | 'spine' | 'audio' | 'audioSprite' | 'json' | 'font';
  url: string;
  urls?: Record<string, string>;
}

interface Bundle {
  name: string;
  priority: number;
  required: boolean;
  assets: AssetEntry[];
}

interface Manifest {
  version: string;
  baseUrl: string;
  bundles: Bundle[];
}

/**
 * Create asset entry from file (same logic as engine)
 */
function createAssetEntry(relativePath: string, filename: string): AssetEntry | null {
  const ext = path.extname(filename).toLowerCase();
  const url = relativePath.replace(/\\/g, '/');

  // Generate key from full relative path (without bundle prefix and extension)
  // Preserves the full directory structure and filename
  // Examples:
  //   "main/GameTable/Spin/D.png" -> "GameTable/Spin/D"
  //   "main/bonusslot/reel.png" -> "bonusslot/reel"
  //   "main/xx/x_xx.png" -> "xx/x_xx"
  //   "main/folder/subfolder/file_name.png" -> "folder/subfolder/file_name"
  //   "main/folder/file name.png" -> "folder/filename" (whitespace removed)
  // This matches how the game code requests assets (full path structure)
  let key = url.replace(/^[^/]+\//, ''); // Remove bundle prefix (main/ or boot/)
  key = key.substring(0, key.length - ext.length); // Remove extension
  // Remove all whitespace (spaces, tabs, etc.)
  key = key.replace(/\s+/g, ''); // Remove all whitespace
  // Preserve case, slashes, underscores, and hyphens
  // Only replace truly invalid characters (special chars except _/-)
  // Keep: letters, numbers, underscores, slashes, hyphens
  key = key.replace(/[^a-zA-Z0-9_/-]/g, '_'); // Replace invalid chars but keep slashes, underscores, and hyphens

  // Determine asset type from extension and filename patterns (from config)
  const textureExts = AssetTypeConfig.extensionMap.texture;
  const audioExts = AssetTypeConfig.extensionMap.audio;
  const fontExts = AssetTypeConfig.extensionMap.font;

  if (textureExts.includes(ext as typeof textureExts[number])) {
    return { key, type: 'texture', url };
  }

  if (ext === '.json') {
    // Check patterns in priority order (from config)
    const spritesheetPatterns = AssetTypeConfig.filenamePatterns.spritesheet;
    const spinePatterns = AssetTypeConfig.filenamePatterns.spine;
    const audioSpritePatterns = AssetTypeConfig.filenamePatterns.audioSprite;

    if (spritesheetPatterns.some(pattern => filename.includes(pattern))) {
      return { key, type: 'spritesheet', url };
    }

    if (spinePatterns.some(pattern => filename.includes(pattern) || filename.endsWith(pattern))) {
      const atlasPath = url.replace('.json', '.atlas');
      return { key, type: 'spine', url, urls: { atlas: atlasPath } };
    }

    if (audioSpritePatterns.some(pattern => filename.includes(pattern))) {
      // Audio sprite JSON - use 'json' type since engine may not support 'audioSprite' yet
      const basePath = url.replace(/\/[^/]+\.json$/, '');
      const baseName = filename.replace('.json', '');
      return {
        key,
        type: 'json', // Use 'json' instead of 'audioSprite' for compatibility
        url,
        urls: {
          mp3: `${basePath}/${baseName}.mp3`,
          ogg: `${basePath}/${baseName}.ogg`,
        },
      };
    }

    return { key, type: 'json', url };
  }

  if (audioExts.includes(ext as typeof audioExts[number])) {
    return { key, type: 'audio', url };
  }

  if (fontExts.includes(ext as typeof fontExts[number])) {
    return { key, type: 'font', url };
  }

  return null;
}

/**
 * Scan directory for assets
 */
function scanDirectory(dir: string, basePath: string = ''): AssetEntry[] {
  const entries: AssetEntry[] = [];

  if (!fs.existsSync(dir)) {
    return entries;
  }

  const items = fs.readdirSync(dir).sort();

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      entries.push(...scanDirectory(fullPath, relativePath));
    } else {
      const entry = createAssetEntry(relativePath, item);
      if (entry) {
        entries.push(entry);
      }
    }
  }

  return entries;
}

/**
 * Normalize asset key to match code expectations
 * Handles case mismatches between folder names and code expectations
 */
function normalizeAssetKey(key: string): string {
  // Apply case normalizations from config
  let normalized = key;

  for (const [from, to] of Object.entries(KeyNormalizationConfig.caseNormalizations)) {
    // Case-insensitive replace for folder name mismatches
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    normalized = normalized.replace(regex, to);
  }

  // Apply build config aliases
  const aliases = BuildConfig.assetAliases || {};
  normalized = aliases[normalized] || normalized;

  return normalized;
}

/**
 * Remove duplicate asset keys, keeping the first occurrence
 */
function deduplicateAssets(assets: AssetEntry[]): { assets: AssetEntry[]; duplicates: Array<{ key: string; first: string; duplicate: string }> } {
  const seen = new Map<string, AssetEntry>();
  const duplicates: Array<{ key: string; first: string; duplicate: string }> = [];

  for (const asset of assets) {
    // Normalize the key to match code expectations
    const normalizedKey = normalizeAssetKey(asset.key);
    const finalAsset = { ...asset, key: normalizedKey };

    if (seen.has(normalizedKey)) {
      const first = seen.get(normalizedKey)!;
      duplicates.push({
        key: normalizedKey,
        first: first.url,
        duplicate: finalAsset.url,
      });
      // Skip duplicate, keep the first one
      continue;
    }
    seen.set(normalizedKey, finalAsset);
  }

  return {
    assets: Array.from(seen.values()),
    duplicates,
  };
}

/**
 * Load audio sprite data from JSON file
 */
function loadAudioSpriteData(spritePath: string): { sprite: Record<string, [number, number]>; src: string[] } | null {
  if (!fs.existsSync(spritePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(spritePath, 'utf-8');
    const data = JSON.parse(content) as { sprite: Record<string, [number, number]>; src: string[] };
    return data;
  } catch {
    return null;
  }
}

/**
 * Generate TypeScript definitions from manifest with automatic suggestions
 */
function generateAssetTypes(manifest: Manifest): string {
  // Load suggestions if available (auto-generated)
  let suggestions: any = null;
  try {
    const suggestionsPath = path.join(ProjectConfig.rootDir, 'tools', 'asset-suggestions.json');
    if (fs.existsSync(suggestionsPath)) {
      suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf-8'));
    }
  } catch {
    // Ignore if suggestions file doesn't exist yet
  }

  const assetKeysByType: Record<string, string[]> = {
    texture: [],
    spritesheet: [],
    spine: [],
    audio: [],
    audioSprite: [],
    json: [],
    font: [],
  };

  // Collect all asset keys by type
  for (const bundle of manifest.bundles) {
    for (const asset of bundle.assets) {
      const typeArray = assetKeysByType[asset.type];
      if (typeArray) {
        typeArray.push(asset.key);
      }
    }
  }

  // Remove duplicates and sort
  for (const type in assetKeysByType) {
    assetKeysByType[type] = [...new Set(assetKeysByType[type])].sort();
  }

  // Load audio sprite timing data (from config)
  const audioSpriteDir = getAssetPath(AudioSpriteConfig.outputDir);
  const audioSpriteData: Record<string, { sprite: Record<string, [number, number]>; src: string[] }> = {};

  const audioSpriteKeys = assetKeysByType.audioSprite || [];
  const spriteName = AudioSpriteConfig.spriteName;

  for (const spriteKey of audioSpriteKeys) {
    // Try to find the sprite JSON file (using config sprite name)
    const possibleNames = [
      `${spriteKey}.json`,
      `${spriteName}.json`,
      `${spriteKey}_sprite.json`,
    ];

    for (const fileName of possibleNames) {
      const spritePath = path.join(audioSpriteDir, fileName);
      const data = loadAudioSpriteData(spritePath);
      if (data) {
        audioSpriteData[spriteKey] = data;
        break;
      }
    }
  }

  // Load build config for suggestions (used for future enhancements)
  // const buildConfig = getBuildConfig();

  // Generate TypeScript definitions with enhanced autocomplete
  const lines: string[] = [
    '/**',
    ' * Auto-generated Asset Type Definitions',
    ' *',
    ' * This file is automatically generated from manifest.json.',
    ' * DO NOT EDIT MANUALLY - run "pnpm manifest:generate" to regenerate.',
    ' *',
    ` * Generated: ${new Date().toISOString()}`,
    ' */',
    '',
    '/**',
    ' * Supported asset types',
    ' */',
    "export type AssetType = 'texture' | 'spritesheet' | 'spine' | 'audio' | 'audioSprite' | 'json' | 'font';",
    '',
    '/**',
    ' * Texture asset keys',
    ' * @example',
    ...(assetKeysByType.texture && assetKeysByType.texture.length > 0
      ? [
        ' * // Common textures:',
        ...assetKeysByType.texture.slice(0, 5).map(k => ` * // - '${k}'`),
        assetKeysByType.texture.length > 5 ? ` * // ... and ${assetKeysByType.texture.length - 5} more` : '',
      ].filter(Boolean)
      : [' * // No texture assets found']),
    ' */',
    `export type TextureAssetKey = ${(assetKeysByType.texture?.length ?? 0) > 0 ? assetKeysByType.texture!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * Spritesheet asset keys',
    ' */',
    `export type SpritesheetAssetKey = ${(assetKeysByType.spritesheet?.length ?? 0) > 0 ? assetKeysByType.spritesheet!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * Spine asset keys',
    ' */',
    `export type SpineAssetKey = ${(assetKeysByType.spine?.length ?? 0) > 0 ? assetKeysByType.spine!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * Audio asset keys',
    ' */',
    `export type AudioAssetKey = ${(assetKeysByType.audio?.length ?? 0) > 0 ? assetKeysByType.audio!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * Audio sprite asset keys',
    ' */',
    `export type AudioSpriteAssetKey = ${(assetKeysByType.audioSprite?.length ?? 0) > 0 ? assetKeysByType.audioSprite!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * Audio sprite clip keys (individual sounds within audio sprites)',
    ' */',
    ...(Object.keys(audioSpriteData).length > 0
      ? (() => {
        const allSpriteKeys = new Set<string>();
        for (const data of Object.values(audioSpriteData)) {
          for (const key of Object.keys(data.sprite)) {
            allSpriteKeys.add(key);
          }
        }
        const sortedKeys = [...allSpriteKeys].sort();
        return [
          `export type AudioSpriteClipKey = ${sortedKeys.length > 0 ? sortedKeys.map(k => `'${k}'`).join(' | ') : 'never'};`,
        ];
      })()
      : ['export type AudioSpriteClipKey = never;']),
    '',
    '/**',
    ' * JSON asset keys',
    ' */',
    `export type JsonAssetKey = ${(assetKeysByType.json?.length ?? 0) > 0 ? assetKeysByType.json!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * Font asset keys',
    ' */',
    `export type FontAssetKey = ${(assetKeysByType.font?.length ?? 0) > 0 ? assetKeysByType.font!.map(k => `'${k}'`).join(' | ') : 'never'};`,
    '',
    '/**',
    ' * All asset keys',
    ' */',
    `export type AssetKey = TextureAssetKey | SpritesheetAssetKey | SpineAssetKey | AudioAssetKey | AudioSpriteAssetKey | JsonAssetKey | FontAssetKey;`,
    '',
    '/**',
    ' * Asset entry definition',
    ' */',
    'export interface AssetEntry {',
    '  /** Unique asset key */',
    '  key: AssetKey;',
    '  /** Asset type */',
    '  type: AssetType;',
    '  /** Primary URL (relative to baseUrl) */',
    '  url: string;',
    '  /** Additional URLs (e.g., for spine: atlas, json) */',
    '  urls?: Record<string, string>;',
    '  /** Optional metadata */',
    '  meta?: Record<string, unknown>;',
    '}',
    '',
    '/**',
    ' * Asset bundle',
    ' */',
    'export interface Bundle {',
    '  name: string;',
    '  priority: number;',
    '  required: boolean;',
    '  assets: AssetEntry[];',
    '}',
    '',
    '/**',
    ' * Complete asset manifest',
    ' */',
    'export interface Manifest {',
    '  version: string;',
    "  baseUrl: string;",
    '  bundles: Bundle[];',
    '}',
    '',
    '/**',
    ' * Audio sprite definition',
    ' */',
    'export interface AudioSprite {',
    '  src: string[];',
    '  sprite: Record<string, [number, number]>;',
    '}',
    '',
    '/**',
    ' * Audio sprite clip timing information',
    ' * Format: [startTimeMs, durationMs]',
    ' */',
    'export interface AudioSpriteClip {',
    '  /** Start time in milliseconds */',
    '  start: number;',
    '  /** Duration in milliseconds */',
    '  duration: number;',
    '}',
    '',
    '/**',
    ' * Audio sprite timing data - provides type-safe access to clip timings',
    ' */',
    ...(Object.keys(audioSpriteData).length > 0
      ? [
        'export const AudioSpriteTimings = {',
        ...Object.entries(audioSpriteData).map(([spriteKey, data]) => {
          const spriteEntries = Object.entries(data.sprite)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([clipKey, [start, duration]]) => {
              return `    '${clipKey}': { start: ${start}, duration: ${duration} } as const,`;
            });
          return [
            `  '${spriteKey}': {`,
            ...spriteEntries,
            '  } as const,',
          ];
        }).flat(),
        '} as const;',
        '',
        '/**',
        ' * Get timing information for an audio sprite clip',
        ' * @param spriteKey - The audio sprite asset key',
        ' * @param clipKey - The clip key within the sprite',
        ' * @returns Timing information or undefined if not found',
        ' */',
        "export function getAudioSpriteTiming(spriteKey: AudioSpriteAssetKey, clipKey: AudioSpriteClipKey): AudioSpriteClip | undefined {",
        "  const sprite = AudioSpriteTimings[spriteKey];",
        "  return sprite?.[clipKey as keyof typeof sprite] as AudioSpriteClip | undefined;",
        '}',
      ]
      : [
        'export const AudioSpriteTimings = {} as const;',
        '',
        "export function getAudioSpriteTiming(spriteKey: AudioSpriteAssetKey, clipKey: AudioSpriteClipKey): AudioSpriteClip | undefined {",
        '  return undefined;',
        '}',
      ]),
    '',
    '/**',
    ' * Type-safe asset key getters by type',
    ' * Use these for autocomplete suggestions: AssetKeys.texture, AssetKeys.audio, etc.',
    ' */',
    'export const AssetKeys = {',
    `  /** Texture asset keys - ${assetKeysByType.texture?.length || 0} total */`,
    `  texture: [${(assetKeysByType.texture || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly TextureAssetKey[],`,
    `  /** Spritesheet asset keys - ${assetKeysByType.spritesheet?.length || 0} total */`,
    `  spritesheet: [${(assetKeysByType.spritesheet || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly SpritesheetAssetKey[],`,
    `  /** Spine asset keys - ${assetKeysByType.spine?.length || 0} total */`,
    `  spine: [${(assetKeysByType.spine || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly SpineAssetKey[],`,
    `  /** Audio asset keys - ${assetKeysByType.audio?.length || 0} total */`,
    `  audio: [${(assetKeysByType.audio || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly AudioAssetKey[],`,
    `  /** Audio sprite asset keys - ${assetKeysByType.audioSprite?.length || 0} total */`,
    `  audioSprite: [${(assetKeysByType.audioSprite || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly AudioSpriteAssetKey[],`,
    `  /** JSON asset keys - ${assetKeysByType.json?.length || 0} total */`,
    `  json: [${(assetKeysByType.json || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly JsonAssetKey[],`,
    `  /** Font asset keys - ${assetKeysByType.font?.length || 0} total */`,
    `  font: [${(assetKeysByType.font || []).map(k => `'${k}'`).join(', ')}] as const satisfies readonly FontAssetKey[],`,
    '} as const;',
    '',
    '/**',
    ' * Get asset key suggestions for autocomplete (auto-generated from asset-suggestions.json)',
    ' * @param type - Asset type to get suggestions for',
    ' * @param partialKey - Optional partial key to filter suggestions',
    ' * @returns Array of suggested asset keys',
    ' * @example',
    ' * // Get all texture suggestions',
    ' * getAssetSuggestions("texture")',
    ' * // Get texture suggestions matching "cell"',
    ' * getAssetSuggestions("texture", "cell")',
    ' */',
    'export function getAssetSuggestions(type: AssetType, partialKey?: string): string[] {',
    '  try {',
    '    // Try to load from auto-generated suggestions',
    '    const suggestions = require("../tools/asset-suggestions.json");',
    '    if (partialKey) {',
    '      const lower = partialKey.toLowerCase();',
    '      return Object.keys(suggestions.assets || {})',
    '        .filter(key => {',
    '          const asset = suggestions.assets[key];',
    '          return asset.type === type && key.toLowerCase().includes(lower);',
    '        })',
    '        .sort((a, b) => {',
    '          const aStarts = a.toLowerCase().startsWith(lower);',
    '          const bStarts = b.toLowerCase().startsWith(lower);',
    '          if (aStarts && !bStarts) return -1;',
    '          if (!aStarts && bStarts) return 1;',
    '          return a.length - b.length;',
    '        })',
    '        .slice(0, 20);',
    '    }',
    '    return Object.keys(suggestions.assets || {})',
    '      .filter(key => suggestions.assets[key].type === type);',
    '  } catch {',
    '    // Fallback to AssetKeys if suggestions file not available',
    '    const keys = AssetKeys[type] || [];',
    '    if (!partialKey) return [...keys];',
    '    const lower = partialKey.toLowerCase();',
    "    return keys.filter(k => k.toLowerCase().includes(lower));",
    '  }',
    '}',
    '',
    '/**',
    ' * Get related assets for a given key (auto-generated suggestions)',
    ' * @param key - Asset key to find related assets for',
    ' * @returns Array of related asset keys',
    ' */',
    'export function getRelatedAssets(key: AssetKey): AssetKey[] {',
    '  try {',
    '    const suggestions = require("../tools/asset-suggestions.json");',
    '    return (suggestions.relatedAssets?.[key] || []).filter(k => {',
    '      // Verify the related asset exists in AssetKeys',
    '      return Object.values(AssetKeys).flat().includes(k as AssetKey);',
    '    }) as AssetKey[];',
    '  } catch {',
    '    return [];',
    '  }',
    '}',
    '',
    '/**',
    ' * Get assets by category (auto-generated from patterns)',
    ' * @param category - Category name',
    ' * @returns Array of asset keys in that category',
    ' */',
    'export function getAssetsByCategory(category: string): AssetKey[] {',
    '  try {',
    '    const suggestions = require("../tools/asset-suggestions.json");',
    '    return (suggestions.categories?.[category] || []).filter(k => {',
    '      return Object.values(AssetKeys).flat().includes(k as AssetKey);',
    '    }) as AssetKey[];',
    '  } catch {',
    '    return [];',
    '  }',
    '}',
    '',
    '/**',
    ' * Type guards for asset types',
    ' */',
    "export function isTextureAsset(key: AssetKey): key is TextureAssetKey {",
    "  return AssetKeys.texture.includes(key as TextureAssetKey);",
    '}',
    '',
    "export function isSpritesheetAsset(key: AssetKey): key is SpritesheetAssetKey {",
    "  return AssetKeys.spritesheet.includes(key as SpritesheetAssetKey);",
    '}',
    '',
    "export function isSpineAsset(key: AssetKey): key is SpineAssetKey {",
    "  return AssetKeys.spine.includes(key as SpineAssetKey);",
    '}',
    '',
    "export function isAudioAsset(key: AssetKey): key is AudioAssetKey {",
    "  return AssetKeys.audio.includes(key as AudioAssetKey);",
    '}',
    '',
    "export function isAudioSpriteAsset(key: AssetKey): key is AudioSpriteAssetKey {",
    "  return AssetKeys.audioSprite.includes(key as AudioSpriteAssetKey);",
    '}',
    '',
    "export function isJsonAsset(key: AssetKey): key is JsonAssetKey {",
    "  return AssetKeys.json.includes(key as JsonAssetKey);",
    '}',
    '',
    "export function isFontAsset(key: AssetKey): key is FontAssetKey {",
    "  return AssetKeys.font.includes(key as FontAssetKey);",
    '}',
  ];

  return lines.join('\n');
}

function main(): void {
  console.log('📦 Generating manifest...\n');

  // Scan all bundles dynamically (from config)
  const bundleDirs = getAllBundleDirs();
  const bundleAssets: Record<string, AssetEntry[]> = {};
  const bundleAssetsRaw: Record<string, AssetEntry[]> = {};

  for (const bundleDir of bundleDirs) {
    const bundle = BundleConfig.bundles.find(b => b.name === bundleDir.name);
    if (!bundle) continue;

    const assetsRaw = scanDirectory(bundleDir.path, bundleDir.name);
    bundleAssetsRaw[bundleDir.name] = assetsRaw;

    // Deduplicate assets
    const dedup = deduplicateAssets(assetsRaw);
    bundleAssets[bundleDir.name] = dedup.assets;

    // Report duplicates
    if (dedup.duplicates.length > 0) {
      console.log(`\n⚠️  Found ${dedup.duplicates.length} duplicate asset key(s) in ${bundleDir.name} bundle:`);
      for (const dup of dedup.duplicates.slice(0, 10)) {
        console.log(`   ${dup.key}: keeping ${dup.first}, skipping ${dup.duplicate}`);
      }
      if (dedup.duplicates.length > 10) {
        console.log(`   ... and ${dedup.duplicates.length - 10} more duplicates`);
      }
    }
  }

  // Scan audio sprites directory (JSON + audio files)
  const audioSpriteDir = getAssetPath(AudioSpriteConfig.outputDir);
  const audioAssetsRaw = scanDirectory(audioSpriteDir, AudioSpriteConfig.outputDir);

  // Filter out individual audio files from sprites directory (they're part of the sprite)
  // Only keep the JSON file and let it reference the audio files via urls
  const audioSpriteAssetsRaw = audioAssetsRaw.filter(asset =>
    asset.type === 'audioSprite' || asset.type === 'json'
  );

  // Add audio sprites to main bundle (or first bundle if main doesn't exist)
  const mainBundleName = BundleConfig.bundles.find(b => b.name === 'main')?.name || bundleDirs[0]?.name;
  if (mainBundleName && bundleAssets[mainBundleName]) {
    const mainDedup = deduplicateAssets([...bundleAssets[mainBundleName], ...audioSpriteAssetsRaw]);
    bundleAssets[mainBundleName] = mainDedup.assets;
  }

  // Log asset counts
  for (const bundleDir of bundleDirs) {
    const rawCount = bundleAssetsRaw[bundleDir.name]?.length || 0;
    const finalCount = bundleAssets[bundleDir.name]?.length || 0;
    console.log(`\n  ${bundleDir.name}/: ${finalCount} assets (${rawCount - finalCount} duplicates removed)`);
  }
  console.log(`  ${AudioSpriteConfig.outputDir}/: ${audioSpriteAssetsRaw.length} assets`);

  // Build bundles array from config
  const bundles: Bundle[] = BundleConfig.bundles
    .map(bundle => ({
      name: bundle.name,
      priority: bundle.priority,
      required: bundle.required,
      assets: bundleAssets[bundle.name] || [],
    }))
    .filter(b => b.assets.length > 0 || b.required);

  const manifest: Manifest = {
    version: BundleConfig.manifestVersion,
    baseUrl: BundleConfig.baseUrl,
    bundles,
  };

  // Write manifest
  fs.writeFileSync(OutputConfig.manifestFullPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifest written to: ${OutputConfig.manifestFullPath}`);

  // Generate automatic suggestions
  console.log('🔍 Generating asset suggestions...');
  const suggestions = generateSuggestions(manifest);
  saveSuggestions(suggestions);
  console.log(`✅ Asset suggestions written to: tools/asset-suggestions.json`);

  // Generate TypeScript definitions with enhanced autocomplete
  const assetTypesContent = generateAssetTypes(manifest);
  fs.writeFileSync(OutputConfig.assetTypesFullPath, assetTypesContent);
  console.log(`✅ Asset types written to: ${OutputConfig.assetTypesFullPath}`);

  // Summary
  const totalAssets = manifest.bundles.reduce((sum, b) => sum + b.assets.length, 0);
  const assetsByType = manifest.bundles.flatMap(b => b.assets).reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n📊 Summary:`);
  console.log(`   Total assets: ${totalAssets}`);
  for (const [type, count] of Object.entries(assetsByType).sort()) {
    console.log(`   ${type}: ${count}`);
  }
}

main();

