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

  // Click anywhere to start the game
  console.log('Clicking to start game...');
  await page.mouse.click(640, 360);
  await page.waitForTimeout(2000);

  // Check if spin button exists
  const spinButton = await page.locator('#spin-button').count();
  console.log(`Spin button (#spin-button) found: ${spinButton > 0}`);

  console.log('\nStarting 5 spins by clicking #spin-button...\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`Spin ${i}/5...`);
    
    // Try clicking the DOM spin button
    try {
      await page.click('#spin-button', { timeout: 2000 });
      console.log(`  Clicked #spin-button`);
    } catch (e) {
      console.log(`  Could not click #spin-button: ${e.message}`);
      // Fallback to canvas click
      await page.mouse.click(1088, 612);
      console.log(`  Clicked canvas fallback`);
    }
    
    // Wait a bit to see if spin started
    await page.waitForTimeout(1000);
    
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
