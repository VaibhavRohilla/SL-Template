import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages from the page
  const spinTimings = [];
  const planStops = [];
  
  page.on('console', async msg => {
    const text = msg.text();
    
    // Log all console messages to see what's happening
    console.log('[PAGE CONSOLE]:', text);
    
    // Try to extract structured data from console messages
    if (text.includes('[DEV_SPIN_TIMING]')) {
      // Get the actual arguments from the console message
      const args = msg.args();
      if (args.length >= 2) {
        try {
          const dataArg = args[1];
          const data = await dataArg.jsonValue();
          spinTimings.push(data);
          console.log('✓ Captured timing event:', data.event);
        } catch (e) {
          console.log('Could not extract timing data:', e.message);
        }
      }
    }
    
    if (text.includes('[DEV_REEL] planStop')) {
      const args = msg.args();
      if (args.length >= 2) {
        try {
          const dataArg = args[1];
          const data = await dataArg.jsonValue();
          planStops.push(data);
          console.log('✓ Captured planStop event, spinDistance:', data.spinDistance);
        } catch (e) {
          console.log('Could not extract planStop data:', e.message);
        }
      }
    }
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  
  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

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
    await page.screenshot({ path: 'game-state-after-start.png' });
    console.log('Screenshot saved: game-state-after-start.png');
  }

  console.log('Starting 5 spins...');
  for (let i = 1; i <= 5; i++) {
    console.log(`\nSpin ${i}/5...`);
    
    // Try to trigger spin via JavaScript if the game object is available
    const spinTriggered = await page.evaluate(() => {
      // @ts-ignore
      if (window.game && window.game.spin) {
        // @ts-ignore
        window.game.spin();
        return true;
      }
      return false;
    });
    
    if (!spinTriggered) {
      // Fallback: click on the canvas where the spin button typically is
      // For slot games, the spin button is usually in the bottom right area
      const canvas = await page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        // Click in the bottom-right area where spin buttons typically are
        // Adjust these coordinates based on your game layout
        const x = box.x + box.width * 0.85;  // 85% from left
        const y = box.y + box.height * 0.85; // 85% from top
        await page.mouse.click(x, y);
        console.log(`  Clicked canvas at (${Math.round(x)}, ${Math.round(y)})`);
      }
    } else {
      console.log('  Triggered spin via game.spin()');
    }
    
    console.log(`  Waiting 8 seconds for spin to complete...`);
    await page.waitForTimeout(8000);
    
    // Take a screenshot after first spin
    if (i === 1) {
      await page.screenshot({ path: 'game-state-after-spin1.png' });
      console.log('  Screenshot saved: game-state-after-spin1.png');
    }
  }

  console.log('\n\nAll spins complete! Extracting timing data...\n');

  // Use the data we collected from console events
  const timingData = JSON.stringify({
    timings: spinTimings,
    planStops: planStops
  }, null, 2);

  console.log('=== TIMING DATA ===');
  console.log(timingData);
  console.log('\n');

  // Extract analysis
  const stops = spinTimings.filter(t => 
    t.event === 'STOP_SEQUENCE_START' || 
    t.event === 'REEL_STOPPED' || 
    t.event === 'ALL_REELS_STOPPED' || 
    t.event === 'SPIN_COMPLETE'
  );
  const spinDistances = planStops.map(p => p.spinDistance);
  
  const analysis = JSON.stringify({
    stopSequenceEvents: stops,
    spinDistances: spinDistances,
    maxSpinDistance: spinDistances.length > 0 ? Math.max(...spinDistances) : null,
    minSpinDistance: spinDistances.length > 0 ? Math.min(...spinDistances) : null
  }, null, 2);

  console.log('=== ANALYSIS ===');
  console.log(analysis);
  console.log('\n');

  console.log('Done! Closing browser in 3 seconds...');
  await page.waitForTimeout(3000);
  await browser.close();
})();
