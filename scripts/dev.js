/**
 * Development Server
 *
 * Uses esbuild to serve the game with hot reload.
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { watch } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Clean dist directory
function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy index.html with hot reload script
function copyHtml() {
  const htmlSrc = path.join(rootDir, 'src', 'index.html');
  const htmlDst = path.join(distDir, 'index.html');

  if (fs.existsSync(htmlSrc)) {
    let html = fs.readFileSync(htmlSrc, 'utf-8');
    // Update script src for built bundle
    html = html.replace('./main.ts', './main.js');
    
    // Inject hot reload script before closing body tag
    const hotReloadScript = `
  <script>
    // Hot reload client
    (function() {
      let lastTimestamp = null;
      const checkInterval = 1000; // Check every second
      
      function extractTimestamp(text) {
        const match = text.match(/BUILD_TIMESTAMP:\\s*(\\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }
      
      function checkForUpdates() {
        fetch('/main.js?t=' + Date.now(), { 
          method: 'GET',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
          .then(response => response.text())
          .then(text => {
            const timestamp = extractTimestamp(text);
            
            if (timestamp) {
              if (lastTimestamp !== null && timestamp !== lastTimestamp) {
                console.log('[HMR] Changes detected, reloading...');
                window.location.reload();
                return;
              }
              lastTimestamp = timestamp;
            } else {
              // Fallback: check file size if timestamp not found
              if (lastTimestamp === null) {
                lastTimestamp = text.length;
              } else if (text.length !== lastTimestamp) {
                console.log('[HMR] Changes detected, reloading...');
                window.location.reload();
              }
            }
          })
          .catch(() => {
            // Ignore errors, will retry on next interval
          });
      }
      
      // Start checking after page load
      setTimeout(() => {
        // Initial check to set baseline
        checkForUpdates();
        // Then check periodically
        setInterval(checkForUpdates, checkInterval);
      }, 2000);
    })();
  </script>`;
    
    html = html.replace('</body>', hotReloadScript + '\n</body>');
    fs.writeFileSync(htmlDst, html);
  }
}

// Copy assets to dist
function copyAssets() {
  const assetsSrc = path.join(rootDir, 'assets');
  const assetsDst = path.join(distDir, 'assets');

  if (fs.existsSync(assetsSrc)) {
    if (fs.existsSync(assetsDst)) {
      fs.rmSync(assetsDst, { recursive: true });
    }
    fs.cpSync(assetsSrc, assetsDst, { recursive: true });
  }
}

// Watch assets directory for changes
function watchAssets() {
  const assetsSrc = path.join(rootDir, 'assets');
  if (!fs.existsSync(assetsSrc)) return;

  console.log('👀 Watching assets for changes...\n');
  
  watch(assetsSrc, { recursive: true }, (eventType, filename) => {
    if (filename) {
      console.log(`📦 Asset changed: ${filename}`);
      copyAssets();
    }
  });
}

// Watch HTML file for changes
function watchHtml() {
  const htmlSrc = path.join(rootDir, 'src', 'index.html');
  if (!fs.existsSync(htmlSrc)) return;

  watch(htmlSrc, (eventType) => {
    if (eventType === 'change') {
      console.log('📄 HTML changed, updating...');
      copyHtml();
    }
  });
}

async function main() {
  console.log('🧹 Cleaning dist directory...\n');
  cleanDist();

  console.log('🚀 Starting development server...\n');

  // Check if assets exist
  const manifestPath = path.join(rootDir, 'assets', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.log('⚠️  No manifest.json found. Run: pnpm manifest:generate\n');
  }

  // Initial copy of HTML and assets
  copyHtml();
  copyAssets();

  // Create esbuild context with build timestamp plugin for hot reload
  const outputFile = path.join(distDir, 'main.js');
  const timestampPlugin = {
    name: 'timestamp',
    setup(build) {
      build.onEnd(() => {
        // Inject/update timestamp in output file after each build
        if (fs.existsSync(outputFile)) {
          let content = fs.readFileSync(outputFile, 'utf-8');
          const timestamp = Date.now();
          const timestampComment = `/* BUILD_TIMESTAMP: ${timestamp} */`;
          
          // Replace existing timestamp or add at the beginning
          content = content.replace(/\/\* BUILD_TIMESTAMP: \d+ \*\//, timestampComment);
          if (!content.includes('BUILD_TIMESTAMP')) {
            content = timestampComment + '\n' + content;
          }
          
          fs.writeFileSync(outputFile, content, 'utf-8');
        }
      });
    },
  };
  
  const ctx = await esbuild.context({
    entryPoints: [path.join(rootDir, 'src', 'main.ts')],
    bundle: true,
    outfile: outputFile,
    sourcemap: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    loader: {
      '.ts': 'ts',
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    plugins: [timestampPlugin],
    logLevel: 'info',
  });

  // Initial build
  await ctx.rebuild();
  console.log('✅ Initial build complete\n');

  // Watch for source file changes
  await ctx.watch();
  console.log('👀 Watching source files for changes...\n');

  // Watch assets and HTML
  watchAssets();
  watchHtml();

  // Start dev server
  const { host, port } = await ctx.serve({
    servedir: distDir,
    port: 3000,
    onRequest: (args) => {
      // Log requests in dev mode (optional)
      if (args.path !== '/main.js' && !args.path.startsWith('/assets/')) {
        // Only log non-asset requests to reduce noise
      }
    },
  });

  console.log(`\n🎮 Game running at http://${host}:${port}`);
  console.log('   Hot reload enabled - changes will auto-refresh');
  console.log('   Press Ctrl+C to stop\n');
}

main().catch(console.error);

