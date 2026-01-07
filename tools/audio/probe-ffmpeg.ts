/**
 * FFmpeg/FFprobe Version Checker
 *
 * Verifies ffmpeg and ffprobe are installed and accessible.
 *
 * Usage: pnpm audio:probe
 */

import { execSync } from 'child_process';

function checkCommand(cmd: string, versionFlag: string): { installed: boolean; version: string } {
  try {
    const output = execSync(`${cmd} ${versionFlag}`, { encoding: 'utf-8', stdio: 'pipe' });
    const versionMatch = output.match(/version\s+([\d.]+)/i);
    return {
      installed: true,
      version: versionMatch?.[1] ?? 'unknown',
    };
  } catch {
    return { installed: false, version: '' };
  }
}

function main(): void {
  console.log('🔍 Checking audio tools...\n');

  const ffmpeg = checkCommand('ffmpeg', '-version');
  const ffprobe = checkCommand('ffprobe', '-version');

  if (ffmpeg.installed) {
    console.log(`✅ ffmpeg: v${ffmpeg.version}`);
  } else {
    console.log('❌ ffmpeg: not found');
  }

  if (ffprobe.installed) {
    console.log(`✅ ffprobe: v${ffprobe.version}`);
  } else {
    console.log('❌ ffprobe: not found');
  }

  if (!ffmpeg.installed || !ffprobe.installed) {
    console.log('\n📝 To install ffmpeg:');
    console.log('   Windows: winget install ffmpeg');
    console.log('   macOS:   brew install ffmpeg');
    console.log('   Linux:   apt install ffmpeg');
    process.exit(1);
  }

  console.log('\n✅ All audio tools available');
}

main();

