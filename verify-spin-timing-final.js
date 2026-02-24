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

  // Click on canvas to start the game (center click)
  console.log('Clicking canvas to start game...');
  const canvas = await page.locator('canvas').first();
  let box = await canvas.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.click(x, y);
    console.log(`  Clicked center to start`);
    await page.waitForTimeout(2000);
  }

  console.log('\nStarting 5 spins using SPACE key...\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`Spin ${i}/5...`);
    
    // Try pressing spacebar to spin
    await page.keyboard.press('Space');
    console.log(`  Pressed SPACE key`);
    
    // Wait a bit to see if spin started
    await page.waitForTimeout(1000);
    
    // Check if any timing data was captured
    const spinCount = await page.evaluate(() => {
      const spinStarts = window.__spinTimings.filter(t => t.event === 'SPIN_STARTED');
      return spinStarts.length;
    });
    
    if (spinCount === 0 && i === 1) {
      console.log('  SPACE didn\'t work, trying mouse click...');
      box = await canvas.boundingBox();
      if (box) {
        // Try clicking bottom-right area
        const x = box.x + box.width * 0.85;
        const y = box.y + box.height * 0.85;
        await page.mouse.click(x, y);
        console.log(`  Clicked at (${Math.round(x)}, ${Math.round(y)})`);
      }
    }
    
    console.log(`  Waiting 8 seconds for spin to complete...`);
    await page.waitForTimeout(8000);
    
    // Check how many spins we've captured so far
    const count = await page.evaluate(() => {
      const spinStarts = window.__spinTimings.filter(t => t.event === 'SPIN_STARTED');
      return spinStarts.length;
    });
    console.log(`  Total spins captured so far: ${count}\n`);
  }

  console.log('\nAll attempts complete! Extracting timing data...\n');

  // Extract data from page context
  const result = await page.evaluate(() => {
    return {
      timings: window.__spinTimings || [],
      planStops: window.__planStops || []
    };
  });

  console.log('=== TIMING DATA ===');
  const timingJson = JSON.stringify(result, null, 2);
  console.log(timingJson);
  console.log('\n');

  // Save to file
  writeFileSync('spin-timing-results.json', timingJson);
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
    totalSpins: result.timings.filter(t => t.event === 'SPIN_STARTED').length,
    stopSequenceEvents: stops,
    spinDistances: spinDistances,
    maxSpinDistance: spinDistances.length > 0 ? Math.max(...spinDistances) : null,
    minSpinDistance: spinDistances.length > 0 ? Math.min(...spinDistances) : null
  };

  console.log('=== ANALYSIS ===');
  const analysisJson = JSON.stringify(analysis, null, 2);
  console.log(analysisJson);
  console.log('\n');

  // Save analysis
  writeFileSync('spin-timing-analysis.json', analysisJson);
  console.log('Saved to spin-timing-analysis.json\n');

  console.log('Done! Closing browser in 3 seconds...');
  await page.waitForTimeout(3000);
  await browser.close();
})();
