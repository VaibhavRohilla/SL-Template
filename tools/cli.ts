/**
 * Asset Pipeline CLI Tool
 *
 * Unified command-line interface for all asset pipeline operations.
 * Provides progress indicators, task orchestration, and error handling.
 *
 * Usage:
 *   pnpm assets [command]
 *   pnpm assets:build    # Build all assets (audio sprite + manifest)
 *   pnpm assets:audio    # Build audio sprite only
 *   pnpm assets:manifest # Generate manifest only
 *   pnpm assets:check    # Check for issues
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectConfig, ToolConfig, OutputConfig } from './config.js';

interface Task {
  name: string;
  description: string;
  command: string;
  dependencies?: string[];
}

const tasks: Record<string, Task> = {
  'audio:sprite': {
    name: 'Audio Sprite',
    description: 'Build audio sprite from raw audio files',
    command: 'tsx tools/audio/build-audio-sprite.ts',
  },
  'manifest:generate': {
    name: 'Manifest',
    description: 'Generate asset manifest and TypeScript definitions',
    command: 'tsx tools/manifest/generate-manifest.ts',
    dependencies: ['audio:sprite'],
  },
  'audio:probe': {
    name: 'FFmpeg Check',
    description: 'Verify ffmpeg and ffprobe installation',
    command: 'tsx tools/audio/probe-ffmpeg.ts',
  },
  'doctor': {
    name: 'Doctor',
    description: 'Check for common issues',
    command: 'tsx tools/doctor/check.ts',
  },
};

/**
 * Get a task by key, or throw if not found
 */
function getTask(key: string): Task {
  const task = tasks[key];
  if (!task) {
    throw new Error(`Task not found: ${key}`);
  }
  return task;
}

/**
 * Check if a file or directory exists
 */
function exists(path: string): boolean {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

/**
 * Run a task with progress indicator
 */
function runTask(task: Task, verbose: boolean = false): { success: boolean; error?: string } {
  const startTime = Date.now();
  
  process.stdout.write(`\n🔄 ${task.name}... `);
  
  try {
    if (verbose) {
      console.log(`\n   Running: ${task.command}\n`);
    }
    
    execSync(task.command, {
      cwd: ProjectConfig.rootDir,
      stdio: verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8',
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`✅ (${duration}s)\n`);
    
    return { success: true };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`❌ (${duration}s)\n`);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check prerequisites
 */
function checkPrerequisites(): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check Node.js version (from config)
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0] || '0');
    if (majorVersion < ToolConfig.minNodeVersion) {
      issues.push(`Node.js version ${nodeVersion} is too old. Requires >= ${ToolConfig.minNodeVersion}.0.0`);
    }
  } catch {
    issues.push('Could not detect Node.js version');
  }
  
  // Check for required directories (from config)
  for (const dir of ToolConfig.requiredDirs) {
    const fullPath = path.join(ProjectConfig.rootDir, dir);
    if (!exists(fullPath)) {
      issues.push(`Required directory not found: ${dir}`);
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Build all assets (full pipeline)
 */
function buildAll(verbose: boolean = false): void {
  console.log('🚀 Asset Pipeline Builder\n');
  console.log('Building all assets in correct order...\n');
  
  const results: Array<{ task: string; success: boolean }> = [];
  
  // Step 1: Check prerequisites
  console.log('📋 Checking prerequisites...');
  const prereq = checkPrerequisites();
  if (!prereq.passed) {
    console.log('❌ Prerequisites check failed:\n');
    for (const issue of prereq.issues) {
      console.log(`   • ${issue}`);
    }
    process.exit(1);
  }
  console.log('✅ Prerequisites OK\n');
  
  // Step 2: Check FFmpeg (optional but recommended)
  console.log('🔍 Checking FFmpeg...');
  const ffmpegCheck = runTask(getTask('audio:probe'), verbose);
  if (!ffmpegCheck.success) {
    console.log('⚠️  FFmpeg not found - audio sprite generation will be limited\n');
  } else {
    console.log('');
  }
  
  // Step 3: Build audio sprite
  const audioResult = runTask(getTask('audio:sprite'), verbose);
  results.push({ task: 'audio:sprite', success: audioResult.success });
  
  if (!audioResult.success) {
    console.error(`\n❌ Audio sprite build failed: ${audioResult.error}`);
    console.error('   Continuing with manifest generation...\n');
  }
  
  // Step 4: Generate manifest
  const manifestResult = runTask(getTask('manifest:generate'), verbose);
  results.push({ task: 'manifest:generate', success: manifestResult.success });
  
  if (!manifestResult.success) {
    console.error(`\n❌ Manifest generation failed: ${manifestResult.error}`);
    process.exit(1);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Build Summary\n');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    const task = getTask(result.task);
    console.log(`   ${icon} ${task.name}`);
  }
  
  console.log(`\n   ${successCount}/${totalCount} tasks completed successfully`);
  
  if (successCount === totalCount) {
    console.log('\n✅ Asset pipeline build completed successfully!');
    
    // Show file sizes (from config)
    if (exists(OutputConfig.manifestFullPath)) {
      const manifestSize = fs.statSync(OutputConfig.manifestFullPath).size;
      console.log(`\n📄 Generated files:`);
      console.log(`   • ${OutputConfig.manifestPath} (${(manifestSize / 1024).toFixed(1)} KB)`);
    }
    
    if (exists(OutputConfig.assetTypesFullPath)) {
      const typesSize = fs.statSync(OutputConfig.assetTypesFullPath).size;
      console.log(`   • ${OutputConfig.assetTypesPath} (${(typesSize / 1024).toFixed(1)} KB)`);
    }
  } else {
    console.log('\n⚠️  Some tasks failed. Check errors above.');
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
🚀 Asset Pipeline CLI

Usage:
  pnpm assets [command] [options]

Commands:
  build, all          Build all assets (audio sprite + manifest)
  audio               Build audio sprite only
  manifest            Generate manifest only
  check               Check for common issues
  probe               Check FFmpeg installation
  help                Show this help message

Options:
  --verbose, -v       Show detailed output
  --help, -h         Show help message

Examples:
  pnpm assets build          # Build everything
  pnpm assets audio          # Build audio sprite only
  pnpm assets manifest       # Generate manifest only
  pnpm assets check          # Run diagnostics
  pnpm assets build --verbose # Build with detailed output
`);
}

/**
 * Main CLI handler
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';
  const verbose = args.includes('--verbose') || args.includes('-v');
  const showHelpFlag = args.includes('--help') || args.includes('-h');
  
  if (showHelpFlag || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'build':
    case 'all':
      buildAll(verbose);
      break;
      
    case 'audio':
      console.log('🔊 Building audio sprite...\n');
      const audioResult = runTask(getTask('audio:sprite'), verbose);
      if (!audioResult.success) {
        console.error(`\n❌ Failed: ${audioResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'manifest':
      console.log('📦 Generating manifest...\n');
      const manifestResult = runTask(getTask('manifest:generate'), verbose);
      if (!manifestResult.success) {
        console.error(`\n❌ Failed: ${manifestResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'check':
    case 'doctor':
      console.log('🔍 Running diagnostics...\n');
      runTask(getTask('doctor'), verbose);
      break;
      
    case 'probe':
      console.log('🔍 Checking FFmpeg...\n');
      runTask(getTask('audio:probe'), verbose);
      break;
      
    default:
      console.error(`\n❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

// Run main function when script is executed directly
main();

