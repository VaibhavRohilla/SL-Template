/**
 * Production Build
 *
 * Creates optimized bundle for deployment.
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function main() {
  console.log('🏗️  Building for production...\n');

  // Clean dist
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Build bundle
  const result = await esbuild.build({
    entryPoints: [path.join(rootDir, 'src', 'main.ts')],
    bundle: true,
    outfile: path.join(distDir, 'main.js'),
    sourcemap: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    minify: true,
    loader: {
      '.ts': 'ts',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    metafile: true,
    logLevel: 'info',
  });

  // Print bundle size
  const outputs = Object.entries(result.metafile.outputs);
  for (const [file, meta] of outputs) {
    if (file.endsWith('.js')) {
      const sizeKB = (meta.bytes / 1024).toFixed(1);
      console.log(`📦 ${path.basename(file)}: ${sizeKB} KB`);
    }
  }

  // Copy index.html
  const htmlSrc = path.join(rootDir, 'src', 'index.html');
  const htmlDst = path.join(distDir, 'index.html');

  if (fs.existsSync(htmlSrc)) {
    let html = fs.readFileSync(htmlSrc, 'utf-8');
    html = html.replace('./main.ts', './main.js');
    fs.writeFileSync(htmlDst, html);
  }

  // Copy assets
  const assetsSrc = path.join(rootDir, 'assets');
  const assetsDst = path.join(distDir, 'assets');

  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, assetsDst, { recursive: true });
  }

  console.log('\n✅ Build complete: dist/');
}

main().catch(console.error);

