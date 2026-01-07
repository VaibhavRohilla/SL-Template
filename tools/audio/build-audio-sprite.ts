/**
 * Audio Sprite Builder for Slot Game Template
 *
 * Scans assets/audio/raw/ or assets/audio/sfx/ for audio files,
 * concatenates them into one large file using ffmpeg,
 * and generates a sprite map with timestamps.
 *
 * Usage: pnpm audio:sprite
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ProjectConfig, AudioSpriteConfig, getAssetPath, BuildConfig } from '../config.js';

// Use build config audio settings if available, otherwise fall back to AudioSpriteConfig
const audioConfig = BuildConfig.audio;
const outputDir = audioConfig 
  ? path.join(ProjectConfig.rootDir, audioConfig.output)
  : getAssetPath(AudioSpriteConfig.outputDir);
const spriteName = audioConfig?.spriteName || AudioSpriteConfig.spriteName;
const audioSourceDirs = audioConfig?.source 
  ? (Array.isArray(audioConfig.source) ? audioConfig.source : [audioConfig.source])
  : AudioSpriteConfig.inputDirs.map(d => d.path);

interface AudioSprite {
  src: string[];
  sprite: Record<string, [number, number]>;
}

/**
 * Check if ffmpeg is available
 */
function hasFFmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if ffprobe is available
 */
function hasFFprobe(): boolean {
  try {
    execSync('ffprobe -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get audio duration using ffprobe (in milliseconds)
 */
function getAudioDuration(filePath: string): number {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: 'utf-8' }
    );
    const duration = parseFloat(result.trim());
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid duration');
    }
    return Math.ceil(duration * 1000); // Convert to ms
  } catch (error) {
    console.warn(`  ⚠️  Could not get duration for ${path.basename(filePath)}, using 1000ms`);
    return 1000; // Default 1 second
  }
}

/**
 * Normalize audio file to consistent format (MP3, 44.1kHz, mono/stereo)
 */
function normalizeAudio(inputPath: string, outputPath: string): void {
  try {
    const { sampleRate, channels, bitrate } = AudioSpriteConfig.audioSettings;
    execSync(
      `ffmpeg -i "${inputPath}" -ar ${sampleRate} -ac ${channels} -b:a ${bitrate} -y "${outputPath}"`,
      { stdio: 'pipe' }
    );
  } catch (error) {
    throw new Error(`Failed to normalize audio: ${inputPath}`);
  }
}

/**
 * Concatenate audio files using ffmpeg
 */
function concatenateAudioFiles(
  fileListPath: string,
  outputPath: string,
  format: 'mp3' | 'ogg' = 'mp3'
): void {
  try {
    // Use concat demuxer for better compatibility
    const codec = format === 'mp3' ? 'libmp3lame' : 'libvorbis';
    const extension = format === 'mp3' ? 'mp3' : 'ogg';
    const finalOutput = outputPath.replace(/\.(mp3|ogg)$/, `.${extension}`);
    const { sampleRate, channels, bitrate } = AudioSpriteConfig.audioSettings;

    execSync(
      `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c:a ${codec} -b:a ${bitrate} -ar ${sampleRate} -ac ${channels} -y "${finalOutput}"`,
      { stdio: 'pipe' }
    );
  } catch (error) {
    throw new Error(`Failed to concatenate audio files: ${error}`);
  }
}

/**
 * Build audio sprite from input directory
 */
function buildAudioSprite(inputDir: string): AudioSprite | null {
  if (!fs.existsSync(inputDir)) {
    console.log(`  ⚠️  Input directory not found: ${inputDir}`);
    return null;
  }

  const audioFiles = fs.readdirSync(inputDir)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return AudioSpriteConfig.audioExtensions.includes(ext as typeof AudioSpriteConfig.audioExtensions[number]);
    })
    .sort();

  if (audioFiles.length === 0) {
    console.log(`  ⚠️  No audio files found in ${path.basename(inputDir)}/`);
    return null;
  }

  console.log(`  Found ${audioFiles.length} audio files`);

  const hasFFmpegTool = hasFFmpeg();
  const hasFFprobeTool = hasFFprobe();

  if (!hasFFmpegTool || !hasFFprobeTool) {
    console.error('\n❌ ffmpeg and ffprobe are required for audio sprite generation');
    console.log('   Install: winget install ffmpeg (Windows) | brew install ffmpeg (macOS) | apt install ffmpeg (Linux)');
    process.exit(1);
  }

  // Create temp directory for normalized files
  const tempDir = path.join(outputDir, '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log('\n📊 Analyzing audio files...');
  const sprite: Record<string, [number, number]> = {};
  const normalizedFiles: string[] = [];
  let offset = 0;
  const gap = AudioSpriteConfig.clipGap;

  // Step 1: Normalize and get durations
  for (const file of audioFiles) {
    const name = path.basename(file, path.extname(file));
    const inputPath = path.join(inputDir, file);
    const normalizedPath = path.join(tempDir, `${name}.mp3`);

    console.log(`  Processing: ${name}...`);
    
    // Normalize audio to consistent format
    normalizeAudio(inputPath, normalizedPath);
    
    // Get actual duration
    const duration = getAudioDuration(normalizedPath);
    
    // Store sprite entry: [startTimeMs, durationMs]
    sprite[name] = [offset, duration];
    normalizedFiles.push(normalizedPath);
    
    console.log(`    ✓ ${duration}ms @ ${offset}ms`);
    
    offset += duration + gap;
  }

  console.log(`\n📦 Concatenating ${normalizedFiles.length} files...`);

  // Step 2: Create file list for ffmpeg concat
  const fileListPath = path.join(tempDir, 'filelist.txt');
  const fileListContent = normalizedFiles
    .map(f => `file '${f.replace(/\\/g, '/')}'`)
    .join('\n');
  fs.writeFileSync(fileListPath, fileListContent);

  // Step 3: Concatenate into MP3
  const outputMp3 = path.join(outputDir, `${spriteName}.mp3`);
  console.log('  Generating MP3 sprite...');
  concatenateAudioFiles(fileListPath, outputMp3, 'mp3');

  // Step 4: Convert to OGG for browser compatibility
  const outputOgg = path.join(outputDir, `${spriteName}.ogg`);
  console.log('  Generating OGG sprite...');
  try {
    const { sampleRate, channels, bitrate } = AudioSpriteConfig.audioSettings;
    execSync(
      `ffmpeg -i "${outputMp3}" -c:a libvorbis -b:a ${bitrate} -ar ${sampleRate} -ac ${channels} -y "${outputOgg}"`,
      { stdio: 'pipe' }
    );
  } catch (error) {
    console.warn('  ⚠️  Could not generate OGG format (optional)');
  }

  // Step 5: Clean up temp files
  console.log('  Cleaning up temporary files...');
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('  ⚠️  Could not clean up temp directory');
  }

  return {
    src: [`${spriteName}.mp3`, `${spriteName}.ogg`],
    sprite,
  };
}

function main(): void {
  console.log('🔊 Audio Sprite Builder\n');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Try input directories (from build config or AudioSpriteConfig)
  let inputDir: string | null = null;
  let inputDirName = '';
  
  // Check build config source directories first
  for (const sourcePath of audioSourceDirs) {
    const fullPath = path.isAbsolute(sourcePath) 
      ? sourcePath 
      : path.join(ProjectConfig.rootDir, sourcePath);
    
    if (fs.existsSync(fullPath)) {
      inputDir = fullPath;
      inputDirName = path.basename(sourcePath);
      break;
    }
  }
  
  // Fall back to AudioSpriteConfig if build config didn't work
  if (!inputDir) {
    for (const inputConfig of AudioSpriteConfig.inputDirs.sort((a, b) => a.priority - b.priority)) {
      const dirPath = getAssetPath(inputConfig.path);
      if (fs.existsSync(dirPath)) {
        inputDir = dirPath;
        inputDirName = inputConfig.name;
        break;
      }
    }
  }

  if (!inputDir) {
    const dirNames = audioSourceDirs.join(' or ');
    console.error(`\n❌ No input directory found. Expected: ${dirNames}`);
    process.exit(1);
  }

  if (audioSourceDirs.length > 1) {
    console.log(`  ℹ️  Using ${inputDirName}/ directory`);
  }

  // Build audio sprite
  const spriteMap = buildAudioSprite(inputDir);

  if (spriteMap) {
    const spriteName = AudioSpriteConfig.spriteName;
    const outputPath = path.join(outputDir, `${spriteName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(spriteMap, null, 2));
    
    const totalDuration = Math.max(
      ...Object.values(spriteMap.sprite).map(([start, duration]) => start + duration)
    );
    
    console.log(`\n✅ Audio sprite generated successfully!`);
    console.log(`   JSON: ${outputPath}`);
    console.log(`   MP3:  ${path.join(outputDir, `${spriteName}.mp3`)}`);
    console.log(`   OGG:  ${path.join(outputDir, `${spriteName}.ogg`)}`);
    console.log(`   Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   Sprites: ${Object.keys(spriteMap.sprite).length}`);
  } else {
    console.error('\n❌ Failed to generate audio sprite');
    process.exit(1);
  }
}

main();

