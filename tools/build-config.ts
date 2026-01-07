/**
 * Build Configuration Loader
 *
 * Loads build configuration from build-config.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'build-config.json');

interface CopierConfig {
  source: string | string[];
  output: string;
}

interface ViewJsonMergeConfig {
  source: string[];
  output: string;
}

interface AssetListFile {
  source: string[];
  output: string;
  bundle?: string;
}

interface AssetListConfig {
  files: AssetListFile[];
  filePathPrefixToTrim: string;
}

interface AudioConfig {
  source: string | string[];
  output: string;
  spriteName?: string;
  pathToAppendInAudioSprite?: string;
}

interface BuildConfigData {
  buildEntry?: string;
  buildOutput?: string;
  viewJsonMerge?: ViewJsonMergeConfig[];
  copier?: CopierConfig[];
  assetList?: AssetListConfig;
  audio?: AudioConfig;
  assetAliases?: Record<string, string>;
  assetGroups?: Record<string, Record<string, string[]>>;
}

let cachedConfig: BuildConfigData | null = null;

/**
 * Load build configuration from JSON file
 */
function loadBuildConfig(): BuildConfigData {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (!fs.existsSync(configPath)) {
    // Return default config if file doesn't exist
    return {
      buildEntry: 'src/main.ts',
      buildOutput: 'dist',
      viewJsonMerge: [],
      copier: [],
      assetList: {
        files: [],
        filePathPrefixToTrim: 'assets/',
      },
      audio: {
        source: ['assets/audio/raw', 'assets/audio/sfx'],
        output: 'assets/audio/sprites',
        spriteName: 'sfx_sprite',
      },
      assetAliases: {},
      assetGroups: {},
    };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(content) as BuildConfigData;
    return cachedConfig;
  } catch (error) {
    console.warn(`⚠️  Failed to load build-config.json: ${error}`);
    return {
      buildEntry: 'src/main.ts',
      buildOutput: 'dist',
      viewJsonMerge: [],
      copier: [],
      assetList: {
        files: [],
        filePathPrefixToTrim: 'assets/',
      },
      audio: {
        source: ['assets/audio/raw', 'assets/audio/sfx'],
        output: 'assets/audio/sprites',
        spriteName: 'sfx_sprite',
      },
      assetAliases: {},
      assetGroups: {},
    };
  }
}

/**
 * Get build configuration
 */
export function getBuildConfig(): BuildConfigData {
  return loadBuildConfig();
}

/**
 * Normalize asset key using aliases
 */
export function normalizeAssetKey(key: string): string {
  const config = getBuildConfig();
  return (config.assetAliases && config.assetAliases[key]) || key;
}

// Export for convenience
export const BuildConfig = {
  get buildEntry() {
    return getBuildConfig().buildEntry || 'src/main.ts';
  },
  get buildOutput() {
    return getBuildConfig().buildOutput || 'dist';
  },
  get viewJsonMerge() {
    return getBuildConfig().viewJsonMerge || [];
  },
  get copier() {
    return getBuildConfig().copier || [];
  },
  get assetList() {
    return getBuildConfig().assetList || { files: [], filePathPrefixToTrim: 'assets/' };
  },
  get audio() {
    return getBuildConfig().audio || {
      source: ['assets/audio/raw', 'assets/audio/sfx'],
      output: 'assets/audio/sprites',
      spriteName: 'sfx_sprite',
    };
  },
  get assetAliases() {
    return getBuildConfig().assetAliases || {};
  },
  get assetGroups() {
    return getBuildConfig().assetGroups || {};
  },
};

