/**
 * Doctor Script - Validates project setup
 *
 * Checks:
 * - Engine dependency resolves
 * - Asset folders exist
 * - Manifest exists and is valid
 * - FFmpeg is installed (optional)
 *
 * Usage: pnpm doctor
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  ProjectConfig,
  ToolConfig,
  OutputConfig,
} from '../config.js';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

const results: CheckResult[] = [];

function check(name: string, required: boolean, fn: () => { passed: boolean; message: string }): void {
  try {
    const result = fn();
    results.push({ name, required, ...result });
  } catch (error) {
    results.push({
      name,
      required,
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

function main(): void {
  console.log('🩺 Running doctor checks...\n');

  // Check 1: Engine dependency
  check('Engine Dependency', true, () => {
    const pkgPath = path.join(ProjectConfig.rootDir, 'node_modules', '@fnx', 'sl-engine', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return { passed: true, message: `slot-frontend-engine@${pkg.version}` };
    }
    return { passed: false, message: 'Not installed. Run: pnpm install' };
  });

  // Check 2: Assets folder structure (from config)
  check('Asset Folders', true, () => {
    const requiredDirs = [...ToolConfig.requiredDirs];
    const missing = requiredDirs.filter(d => !fs.existsSync(path.join(ProjectConfig.rootDir, d)));
    if (missing.length === 0) {
      return { passed: true, message: 'All required asset folders exist' };
    }
    return { passed: false, message: `Missing: ${missing.join(', ')}` };
  });

  // Check 3: Manifest exists (from config)
  check('Manifest', true, () => {
    if (fs.existsSync(OutputConfig.manifestFullPath)) {
      const manifest = JSON.parse(fs.readFileSync(OutputConfig.manifestFullPath, 'utf-8'));
      const bundleCount = manifest.bundles?.length ?? 0;
      const assetCount = manifest.bundles?.reduce((sum: number, b: { assets: unknown[] }) => sum + b.assets.length, 0) ?? 0;
      return { passed: true, message: `${bundleCount} bundles, ${assetCount} assets` };
    }
    return { passed: false, message: 'Not found. Run: pnpm manifest:generate' };
  });

  // Check 4: TypeScript config
  check('TypeScript Config', true, () => {
    const tsconfigPath = path.join(ProjectConfig.rootDir, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      return { passed: true, message: 'tsconfig.json found' };
    }
    return { passed: false, message: 'tsconfig.json not found' };
  });

  // Check 5: FFmpeg (optional)
  check('FFmpeg', false, () => {
    try {
      execSync('ffmpeg -version', { stdio: 'pipe' });
      return { passed: true, message: 'Installed' };
    } catch {
      return { passed: false, message: 'Not found (optional for audio sprites)' };
    }
  });

  // Check 6: Node version (from config)
  check('Node.js Version', true, () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0] ?? '0', 10);
    if (major >= ToolConfig.minNodeVersion) {
      return { passed: true, message: version };
    }
    return { passed: false, message: `${version} (requires >=${ToolConfig.minNodeVersion})` };
  });

  // Check 7: Build config exists
  check('Build Config', false, () => {
    const buildConfigPath = path.join(ProjectConfig.rootDir, 'tools', 'build-config.json');
    if (fs.existsSync(buildConfigPath)) {
      return { passed: true, message: 'build-config.json found' };
    }
    return { passed: false, message: 'build-config.json not found (optional)' };
  });

  // Check 8: Asset keys (slotConfig + brand) referenced in manifest
  check('Asset keys (slotConfig + brand)', false, () => {
    if (!fs.existsSync(OutputConfig.manifestFullPath)) {
      return { passed: false, message: 'Manifest missing; run pnpm assets:build first' };
    }
    try {
      const out = execSync('pnpm exec tsx tools/asset-keys-validate.ts --json', {
        encoding: 'utf-8',
        cwd: ProjectConfig.rootDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const data = JSON.parse(out) as { passed: boolean; missing: string[] };
      if (data.passed) {
        return { passed: true, message: 'All referenced keys present in manifest' };
      }
      const list = (data.missing as string[]).slice(0, 15).join(', ');
      const more = (data.missing as string[]).length > 15 ? ` ... +${(data.missing as string[]).length - 15} more` : '';
      return { passed: false, message: `Missing keys: ${list}${more}. Run pnpm assets:build or add assets.` };
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      const out = e?.stdout ?? '';
      if (out) {
        try {
          const data = JSON.parse(out) as { passed: boolean; missing: string[] };
          if (!data.passed && Array.isArray(data.missing)) {
            const list = data.missing.slice(0, 10).join(', ');
            const more = data.missing.length > 10 ? ` ... +${data.missing.length - 10} more` : '';
            return { passed: false, message: `Missing keys: ${list}${more}. Run pnpm assets:build or add assets.` };
          }
        } catch {
          // ignore parse error
        }
      }
      return { passed: false, message: `Validator failed: ${e?.stderr ?? e?.message ?? String(err)}` };
    }
  });

  // Print results
  console.log('Results:\n');

  let hasFailedRequired = false;

  for (const result of results) {
    const icon = result.passed ? '✅' : result.required ? '❌' : '⚠️';
    const reqLabel = result.required ? '' : ' (optional)';
    console.log(`${icon} ${result.name}${reqLabel}`);
    console.log(`   ${result.message}\n`);

    if (!result.passed && result.required) {
      hasFailedRequired = true;
    }
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed`);

  if (hasFailedRequired) {
    console.log('\n❌ Some required checks failed. Fix issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ All required checks passed!');
  }
}

main();

