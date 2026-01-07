/**
 * Preview Production Build
 *
 * Serves the dist folder to test production build locally.
 */

import * as esbuild from 'esbuild';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('👀 Starting preview server...\n');

  const ctx = await esbuild.context({
    entryPoints: [],
    bundle: false,
  });

  const { host, port } = await ctx.serve({
    servedir: path.join(rootDir, 'dist'),
    port: 4000,
  });

  console.log(`🎮 Preview at http://${host}:${port}`);
  console.log('   Press Ctrl+C to stop\n');
}

main().catch(console.error);

