/**
 * Shared Configuration for Asset Pipeline Tools
 *
 * Centralized configuration that all tools use.
 * Makes the pipeline fully dynamic and configurable.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { getBuildConfig } from './build-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Project structure configuration
 */
export const ProjectConfig = {
  /** Root directory of the project */
  rootDir,
  
  /** Assets directory */
  assetsDir: path.join(rootDir, 'assets'),
  
  /** Source directory */
  srcDir: path.join(rootDir, 'src'),
  
  /** Output directory for generated files */
  distDir: path.join(rootDir, 'dist'),
} as const;

/**
 * Asset bundle configuration - loaded from build-config.json
 */
export const BundleConfig = {
  /** Base URL for assets in manifest */
  baseUrl: 'assets/',
  
  /** Manifest version */
  manifestVersion: '1.0.0',
  
  /** Get bundles from build config */
  get bundles() {
    const buildConfig = getBuildConfig();
    if (buildConfig.assetList?.files) {
      return buildConfig.assetList.files
        .filter(f => f.bundle)
        .map((f, index) => ({
          name: f.bundle!,
          directory: f.source[0]?.replace(buildConfig.assetList?.filePathPrefixToTrim || 'assets/', '') || f.bundle!,
          priority: index,
          required: true,
          description: `${f.bundle} bundle`,
        }));
    }
    // Fallback defaults
    return [
      { name: 'boot', directory: 'boot', priority: 0, required: true, description: 'Boot bundle' },
      { name: 'main', directory: 'main', priority: 1, required: true, description: 'Main bundle' },
    ];
  },
} as const;

/**
 * Audio sprite configuration - loaded from build-config.json
 */
export const AudioSpriteConfig = {
  /** Get input directories from build config */
  get inputDirs() {
    const buildConfig = getBuildConfig();
    const audioConfig = buildConfig.audio;
    if (audioConfig?.source) {
      const sources = Array.isArray(audioConfig.source) ? audioConfig.source : [audioConfig.source];
      return sources.map((source, index) => {
        const cleanPath = source.replace(/^assets\//, '');
        return {
          name: path.basename(cleanPath),
          path: cleanPath,
          priority: index + 1,
        };
      });
    }
    // Fallback defaults
    return [
      { name: 'raw', path: 'audio/raw', priority: 1 },
      { name: 'sfx', path: 'audio/sfx', priority: 2 },
    ];
  },
  
  /** Output directory for generated sprites */
  get outputDir() {
    const buildConfig = getBuildConfig();
    const output = buildConfig.audio?.output || 'assets/audio/sprites';
    return output.replace(/^assets\//, '');
  },
  
  /** Output sprite name (without extension) */
  get spriteName() {
    const buildConfig = getBuildConfig();
    return buildConfig.audio?.spriteName || 'sfx_sprite';
  },
  
  /** Audio normalization settings */
  audioSettings: {
    sampleRate: 44100,
    channels: 2,
    bitrate: '128k',
    format: 'mp3' as const,
  },
  
  /** Gap between audio clips (milliseconds) */
  clipGap: 100,
  
  /** Supported audio file extensions */
  audioExtensions: ['.mp3', '.ogg', '.wav', '.m4a'] as const,
} as const;

/**
 * Asset type detection configuration
 */
export const AssetTypeConfig = {
  /** File extension to asset type mapping */
  extensionMap: {
    texture: ['.png', '.jpg', '.jpeg', '.webp'],
    spritesheet: ['.json'], // Detected by filename containing 'spritesheet' or 'atlas'
    spine: ['.json'], // Detected by filename containing 'skeleton' or ending with '.skel.json'
    audio: ['.mp3', '.ogg', '.wav'],
    font: ['.woff', '.woff2', '.ttf'],
    json: ['.json'],
  } as const,
  
  /** Filename patterns for special asset types */
  filenamePatterns: {
    spritesheet: ['spritesheet', 'atlas'],
    spine: ['skeleton', '.skel.json'],
    audioSprite: ['sprite', '_sprite'],
  } as const,
  
  /** Asset type priority (for ambiguous files) */
  typePriority: ['spritesheet', 'spine', 'audioSprite', 'json'] as const,
} as const;

/**
 * Key normalization configuration
 */
export const KeyNormalizationConfig = {
  /** Case normalization rules (folder name -> expected case) */
  caseNormalizations: {
    'bonusslot': 'BonusSlot',
  } as Record<string, string>,
  
  /** Characters to preserve in keys */
  preserveChars: /[a-zA-Z0-9_/\-]/,
  
  /** Characters to replace with underscore */
  replaceChars: /[^a-zA-Z0-9_/\-]/g,
} as const;

/**
 * Output file configuration
 */
export const OutputConfig = {
  /** Manifest output path (relative to assetsDir) */
  manifestPath: 'manifest.json',
  
  /** TypeScript definitions output path (relative to srcDir) */
  assetTypesPath: 'Asset.d.ts',
  
  /** Full paths */
  get manifestFullPath() {
    return path.join(ProjectConfig.assetsDir, OutputConfig.manifestPath);
  },
  
  get assetTypesFullPath() {
    return path.join(ProjectConfig.srcDir, OutputConfig.assetTypesPath);
  },
} as const;

/**
 * Tool execution configuration
 */
export const ToolConfig = {
  /** Node.js minimum version */
  minNodeVersion: 18,
  
  /** Get required directories from build config bundles */
  get requiredDirs() {
    const buildConfig = getBuildConfig();
    if (buildConfig.assetList?.files) {
      return buildConfig.assetList.files
        .filter(f => f.bundle)
        .map(f => f.source[0] || `assets/${f.bundle}`);
    }
    // Fallback defaults
    return ['assets/boot', 'assets/main'];
  },
  
  /** Optional directories */
  optionalDirs: [
    'assets/audio/raw',
    'assets/audio/sfx',
    'assets/audio/sprites',
  ] as const,
} as const;

/**
 * Get full path for a relative asset path
 */
export function getAssetPath(relativePath: string): string {
  return path.join(ProjectConfig.assetsDir, relativePath);
}


/**
 * Get all bundle directories
 */
export function getAllBundleDirs(): Array<{ name: string; path: string }> {
  return BundleConfig.bundles.map(bundle => ({
    name: bundle.name,
    path: path.join(ProjectConfig.assetsDir, bundle.directory),
  }));
}

/**
 * Build configuration - loaded from build-config.json
 * This allows dynamic asset definitions and mappings
 */
export { BuildConfig, normalizeAssetKey, getBuildConfig } from './build-config.js';

