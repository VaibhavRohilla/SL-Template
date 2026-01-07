/**
 * Clean Build Artifacts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const dirsToClean = ['dist', 'node_modules/.cache'];

function main() {
  console.log('🧹 Cleaning...\n');

  for (const dir of dirsToClean) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true });
      console.log(`  Removed: ${dir}/`);
    }
  }

  console.log('\n✅ Clean complete');
}

main();

