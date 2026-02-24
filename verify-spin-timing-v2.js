import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  
  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Inject capture script directly into the page
  await page.evaluate(() => {
    window.__spinTimings = [];
    window.__planStops = [];
    
    const origLog = console.log;
    console.log = function(...args) {
      if (args[0] === '[DEV_SPIN_TIMING]') {
        window.__spinTimings.push(JSON.parse(JSON.stringify(args[1])));
      }
      if (args[0] === '[DEV_REEL] planStop') {
        window.__planStops.push(JSON.parse(JSON.stringify(args[1])));
      }
      origLog.apply(console, args);
    };
  });

  console.log('Injected timing capture script');

  // Take a screenshot to see the initial state
  await page.screenshot({ path: 'game-state-initial.png' });
  console.log('Screenshot saved: game-state-initial.png');

  // Check if there's a start button or play button to click first
  console.log('Looking for start/play button...');
  const startButton = page.locator('button:has-text("PLAY"), button:has-text("Play"), button:has-text("START"), button:has-text("Start"), .start-button, .play-button').first();
  const startButtonExists = await startButton.count() > 0;
  
  if (startButtonExists) {
    console.log('Found start button, clicking it...');
    await startButton.click();
    await page.waitForTimeout(2000);
  } else {
    // Click on canvas to start the game
    console.log('No start button found, clicking canvas to start...');
    const canvas = await page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.click(x, y);
      await page.waitForTimeout(2000);
    }
  }

  console.log('Starting 5 spins...');
  for (let i = 1; i <= 5; i++) {
    console.log(`\nSpin ${i}/5...`);
    
    // Click on canvas where spin button is (bottom right)
    const canvas = await page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      const x = box.x + box.width * 0.85;
      const y = box.y + box.height * 0.85;
      await page.mouse.click(x, y);
      console.log(`  Clicked at (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    console.log(`  Waiting 8 seconds...`);
    await page.waitForTimeout(8000);
  }

  console.log('\n\nAll spins complete! Extracting timing data...\n');

  // Extract data from page context
  const result = await page.evaluate(() => {
    return {
      timings: window.__spinTimings || [],
      planStops: window.__planStops || []
    };
  });

  console.log('=== TIMING DATA ===');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n');

  // Save to file
  writeFileSync('spin-timing-results.json', JSON.stringify(result, null, 2));
  console.log('Saved to spin-timing-results.json\n');

  // Analysis
  const stops = result.timings.filter(t => 
    t.event === 'STOP_SEQUENCE_START' || 
    t.event === 'REEL_STOPPED' || 
    t.event === 'ALL_REELS_STOPPED' || 
    t.event === 'SPIN_COMPLETE'
  );
  const spinDistances = result.planStops.map(p => p.spinDistance);
  
  const analysis = {
    stopSequenceEvents: stops,
    spinDistances: spinDistances,
    maxSpinDistance: spinDistances.length > 0 ? Math.max(...spinDistances) : null,
    minSpinDistance: spinDistances.length > 0 ? Math.min(...spinDistances) : null
  };

  console.log('=== ANALYSIS ===');
  console.log(JSON.stringify(analysis, null, 2));
  console.log('\n');

  // Save analysis
  writeFileSync('spin-timing-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('Saved to spin-timing-analysis.json\n');

  console.log('Done! Closing browser in 3 seconds...');
  await page.waitForTimeout(3000);
  await browser.close();
})();
