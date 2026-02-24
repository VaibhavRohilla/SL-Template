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
    console.log(`  Clicked center at (${Math.round(x)}, ${Math.round(y)})`);
    await page.waitForTimeout(2000);
  }

  console.log('\nStarting 5 spins...');
  console.log('Trying multiple click positions to find the spin button\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`Spin ${i}/5...`);
    
    box = await canvas.boundingBox();
    if (box) {
      // Try different positions for the spin button
      const positions = [
        { x: box.x + box.width * 0.9, y: box.y + box.height * 0.9, name: 'bottom-right corner' },
        { x: box.x + box.width * 0.85, y: box.y + box.height * 0.85, name: 'bottom-right area' },
        { x: box.x + box.width * 0.8, y: box.y + box.height * 0.9, name: 'bottom-right-center' },
        { x: box.x + box.width * 0.5, y: box.y + box.height * 0.9, name: 'bottom-center' },
      ];
      
      // Try first position
      const pos = positions[0];
      await page.mouse.click(pos.x, pos.y);
      console.log(`  Clicked ${pos.name} at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
      
      // Wait a bit to see if spin started
      await page.waitForTimeout(1000);
      
      // Check if any timing data was captured
      const hasData = await page.evaluate(() => {
        return window.__spinTimings.length > 0;
      });
      
      if (!hasData && i === 1) {
        console.log('  No spin detected, trying other positions...');
        for (let j = 1; j < positions.length; j++) {
          const p = positions[j];
          await page.mouse.click(p.x, p.y);
          console.log(`  Clicked ${p.name} at (${Math.round(p.x)}, ${Math.round(p.y)})`);
          await page.waitForTimeout(500);
          
          const hasDataNow = await page.evaluate(() => {
            return window.__spinTimings.length > 0;
          });
          
          if (hasDataNow) {
            console.log(`  ✓ Spin started with ${p.name}!`);
            break;
          }
        }
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
    totalSpins: result.timings.filter(t => t.event === 'SPIN_STARTED').length,
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
