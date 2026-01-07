/**
 * Automatic Asset Suggestions Generator
 *
 * Analyzes assets and generates intelligent suggestions for autocomplete.
 * Creates asset-suggestions.json automatically based on asset patterns.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig, OutputConfig } from './config.js';

interface AssetSuggestion {
  key: string;
  type: string;
  bundle: string;
  path: string;
  category?: string;
  tags?: string[];
  related?: string[];
}

interface SuggestionsData {
  generated: string;
  assets: Record<string, AssetSuggestion>;
  categories: Record<string, string[]>;
  commonPatterns: Record<string, string[]>;
  relatedAssets: Record<string, string[]>;
}

const suggestionsPath = path.join(ProjectConfig.rootDir, 'tools', 'asset-suggestions.json');

/**
 * Analyze asset key to extract category and patterns
 */
function analyzeAssetKey(key: string, bundle: string): {
  category: string;
  tags: string[];
  related: string[];
} {
  const parts = key.split('/');
  const category = parts[0] || 'misc';
  const tags: string[] = [];
  const related: string[] = [];

  // Extract tags from path
  if (key.includes('Common')) tags.push('common');
  if (key.includes('GameTable')) tags.push('gameTable');
  if (key.includes('bonus') || key.includes('Bonus')) tags.push('bonus');
  if (key.includes('ui') || key.includes('UI')) tags.push('ui');
  if (key.includes('Spin')) tags.push('spin');
  if (key.includes('Symbol')) tags.push('symbol');
  if (key.includes('appear')) tags.push('animation');
  if (key.includes('winline')) tags.push('winline');

  // Find related assets (same directory, sequential numbers, etc.)
  const basePath = parts.slice(0, -1).join('/');
  const filename = parts[parts.length - 1];
  const baseName = filename.replace(/\d+$/, '').replace(/[_-]\d+$/, '');
  
  // Suggest related assets with numbers
  for (let i = 1; i <= 20; i++) {
    const relatedKey = basePath ? `${basePath}/${baseName}${i}` : `${baseName}${i}`;
    if (relatedKey !== key) {
      related.push(relatedKey);
    }
  }

  return { category, tags, related: related.slice(0, 5) }; // Limit related suggestions
}

/**
 * Generate suggestions from manifest
 */
export function generateSuggestions(manifest: any): SuggestionsData {
  const assets: Record<string, AssetSuggestion> = {};
  const categories: Record<string, string[]> = {};
  const commonPatterns: Record<string, string[]> = {};
  const relatedAssets: Record<string, string[]> = {};

  // Process all assets from manifest
  for (const bundle of manifest.bundles || []) {
    for (const asset of bundle.assets || []) {
      const analysis = analyzeAssetKey(asset.key, bundle.name);
      
      assets[asset.key] = {
        key: asset.key,
        type: asset.type,
        bundle: bundle.name,
        path: asset.url,
        category: analysis.category,
        tags: analysis.tags,
        related: analysis.related,
      };

      // Group by category
      if (!categories[analysis.category]) {
        categories[analysis.category] = [];
      }
      categories[analysis.category].push(asset.key);

      // Find common patterns
      const pattern = asset.key.split('/').slice(0, 2).join('/');
      if (!commonPatterns[pattern]) {
        commonPatterns[pattern] = [];
      }
      commonPatterns[pattern].push(asset.key);
    }
  }

  // Build related assets map
  for (const [key, asset] of Object.entries(assets)) {
    if (asset.related) {
      relatedAssets[key] = asset.related.filter(r => assets[r]);
    }
  }

  return {
    generated: new Date().toISOString(),
    assets,
    categories,
    commonPatterns,
    relatedAssets,
  };
}

/**
 * Load existing suggestions
 */
export function loadSuggestions(): SuggestionsData | null {
  if (!fs.existsSync(suggestionsPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(suggestionsPath, 'utf-8');
    return JSON.parse(content) as SuggestionsData;
  } catch {
    return null;
  }
}

/**
 * Save suggestions to JSON file
 */
export function saveSuggestions(suggestions: SuggestionsData): void {
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
}

/**
 * Get suggestions for a partial key
 */
export function getSuggestions(partialKey: string, type?: string): string[] {
  const suggestions = loadSuggestions();
  if (!suggestions) return [];

  const lower = partialKey.toLowerCase();
  const matches: string[] = [];

  for (const [key, asset] of Object.entries(suggestions.assets)) {
    if (type && asset.type !== type) continue;
    
    if (key.toLowerCase().includes(lower)) {
      matches.push(key);
    }
  }

  // Sort by relevance (exact matches first, then by length)
  return matches.sort((a, b) => {
    const aExact = a.toLowerCase().startsWith(lower);
    const bExact = b.toLowerCase().startsWith(lower);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.length - b.length;
  }).slice(0, 20); // Limit to 20 suggestions
}

/**
 * Get related assets for a given key
 */
export function getRelatedAssets(key: string): string[] {
  const suggestions = loadSuggestions();
  if (!suggestions) return [];

  return suggestions.relatedAssets[key] || [];
}

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: string): string[] {
  const suggestions = loadSuggestions();
  if (!suggestions) return [];

  return suggestions.categories[category] || [];
}

/**
 * Get common patterns
 */
export function getCommonPatterns(): Record<string, string[]> {
  const suggestions = loadSuggestions();
  if (!suggestions) return {};

  return suggestions.commonPatterns;
}

