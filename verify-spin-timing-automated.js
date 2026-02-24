import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function verifySpinTiming() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Try port 5173 first
    let url = 'http://localhost:5173';
    console.log(`Attempting to navigate to ${url}...`);
    
    try {
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      if (!response || response.status() !== 200) {
        throw new Error('Failed to load');
      }
      console.log(`✓ Successfully loaded ${url}`);
    } catch (error) {
      // Try port 3000
      url = 'http://localhost:3000';
      console.log(`Port 5173 failed, trying ${url}...`);
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      if (!response || response.status() !== 200) {
        throw new Error('Failed to load both ports');
      }
      console.log(`✓ Successfully loaded ${url}`);
    }

    // Wait for game to fully load
    console.log('Waiting for game to load...');
    await wait(3000);

    // Check if there are any errors on the page
    const pageErrors = await page.evaluate(() => {
      const errors = document.body.textContent;
      return errors;
    });
    
    if (pageErrors.includes('ERROR') || pageErrors.includes('Error')) {
      console.log('Warning: Page may contain errors');
    }

    // Set up arrays to capture console messages
    const spinTimings = [];
    const planStops = [];

    // Set up console message listener to capture logs
    page.on('console', async msg => {
      const text = msg.text();
      if (text.includes('[DEV_SPIN_TIMING]')) {
        console.log('  Captured timing:', text.substring(0, 100));
        // Try to parse the timing data from the console message
        try {
          const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
          if (args[0] === '[DEV_SPIN_TIMING]' && args[1]) {
            spinTimings.push(args[1]);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      if (text.includes('[DEV_REEL] planStop')) {
        console.log('  Captured planStop:', text.substring(0, 100));
        try {
          const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
          if (args[0] === '[DEV_REEL] planStop' && args[1]) {
            planStops.push(args[1]);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // Inject timing capture code as backup
    console.log('Injecting timing capture code...');
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
      console.log('Timing capture initialized');
    });

    // Take a screenshot to see what the page looks like
    await page.screenshot({ path: 'game-before-spin.png' });
    console.log('Screenshot saved: game-before-spin.png');

    // Always click the canvas first to start the game (games often require initial click)
    console.log('Starting game by clicking canvas...');
    try {
      // Try clicking the canvas element directly
      await page.click('canvas');
    } catch (e) {
      // If that fails, click at canvas coordinates
      const canvasBox = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
        return null;
      });
      if (canvasBox) {
        await page.mouse.click(canvasBox.x, canvasBox.y);
      }
    }
    await wait(2000);
    await page.screenshot({ path: 'game-after-start.png' });
    console.log('Game started, screenshot saved: game-after-start.png');

    // Perform 3 spins
    for (let i = 1; i <= 3; i++) {
      console.log(`\nPerforming spin ${i}...`);
      
      // Find and click the SPIN button
      // Try multiple selectors to find the spin button
      const buttonInfo = await page.evaluate(() => {
        // Look for button with text containing "SPIN" or common spin button classes
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"], .button, .btn, canvas'));
        const allButtons = buttons.map(btn => ({
          tag: btn.tagName,
          text: btn.textContent?.substring(0, 50),
          class: btn.className,
          id: btn.id
        }));
        
        const spinButton = buttons.find(btn => {
          const text = btn.textContent?.toUpperCase() || '';
          return text.includes('SPIN') || 
                 btn.className.toLowerCase().includes('spin') ||
                 btn.id.toLowerCase().includes('spin');
        });
        
        if (spinButton) {
          spinButton.click();
          return { clicked: true, button: 'found', allButtons };
        }
        
        // If no button found, try clicking on canvas (for PixiJS games)
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          // Click in the lower center area where spin buttons typically are
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height * 0.85
          });
          canvas.dispatchEvent(event);
          return { clicked: true, button: 'canvas', allButtons };
        }
        
        return { clicked: false, allButtons };
      });

      console.log(`  Button info: ${JSON.stringify(buttonInfo, null, 2)}`);

      if (!buttonInfo.clicked) {
        console.log('Warning: Could not find SPIN button or canvas');
      }

      // Wait for spin to complete
      console.log(`Waiting for spin ${i} to complete...`);
      await wait(6000);
      
      // Take screenshot after spin
      await page.screenshot({ path: `game-after-spin${i}.png` });
      console.log(`  Screenshot saved: game-after-spin${i}.png`);
    }

    console.log('\nAll spins completed. Extracting timing data...\n');
    console.log(`Captured ${spinTimings.length} timing events from console listener`);
    console.log(`Captured ${planStops.length} planStop events from console listener`);

    // Extract timing data from page
    const pageResults = await page.evaluate(() => {
      const timings = window.__spinTimings;
      const results = [];
      let spinIdx = 0;
      
      for (let i = 0; i < timings.length; i++) {
        const t = timings[i];
        if (t.event === 'STOP_SEQUENCE_START') {
          const spin = {
            spinIdx: spinIdx++,
            stopSeqStartElapsedMs: t.elapsedMs,
            reels: [],
            allReelsStoppedDelta: null,
            firstReelStoppedDelta: null
          };
          
          for (let j = i+1; j < timings.length; j++) {
            if (timings[j].event === 'REEL_STOPPED') {
              const reelDelta = timings[j].elapsedMs - t.elapsedMs;
              spin.reels.push({
                reel: timings[j].reelIndex, 
                deltaFromStopSeqMs: reelDelta
              });
              if (spin.reels.length === 1) {
                spin.firstReelStoppedDelta = reelDelta;
              }
            }
            if (timings[j].event === 'ALL_REELS_STOPPED') {
              spin.allReelsStoppedDelta = timings[j].elapsedMs - t.elapsedMs;
              break;
            }
          }
          results.push(spin);
        }
      }
      
      return {
        results: results,
        spinDistances: window.__planStops.map(p => p.spinDistance),
        maxDistance: window.__planStops.length > 0 
          ? Math.max(...window.__planStops.map(p => p.spinDistance))
          : null,
      };
    });

    // Use console-captured data if page data is empty
    let finalResults;
    if (pageResults.results.length === 0 && spinTimings.length > 0) {
      console.log('Using console-captured timing data...');
      const results = [];
      let spinIdx = 0;
      
      for (let i = 0; i < spinTimings.length; i++) {
        const t = spinTimings[i];
        if (t.event === 'STOP_SEQUENCE_START') {
          const spin = {
            spinIdx: spinIdx++,
            stopSeqStartElapsedMs: t.elapsedMs,
            reels: [],
            allReelsStoppedDelta: null,
            firstReelStoppedDelta: null
          };
          
          for (let j = i+1; j < spinTimings.length; j++) {
            if (spinTimings[j].event === 'REEL_STOPPED') {
              const reelDelta = spinTimings[j].elapsedMs - t.elapsedMs;
              spin.reels.push({
                reel: spinTimings[j].reelIndex, 
                deltaFromStopSeqMs: reelDelta
              });
              if (spin.reels.length === 1) {
                spin.firstReelStoppedDelta = reelDelta;
              }
            }
            if (spinTimings[j].event === 'ALL_REELS_STOPPED') {
              spin.allReelsStoppedDelta = spinTimings[j].elapsedMs - t.elapsedMs;
              break;
            }
          }
          results.push(spin);
        }
      }
      
      finalResults = {
        results: results,
        spinDistances: planStops.map(p => p.spinDistance),
        maxDistance: planStops.length > 0 
          ? Math.max(...planStops.map(p => p.spinDistance))
          : null,
      };
    } else {
      finalResults = pageResults;
    }

    // Output the results
    console.log('='.repeat(80));
    console.log('SPIN TIMING VERIFICATION RESULTS');
    console.log('='.repeat(80));
    console.log(JSON.stringify(finalResults, null, 2));
    console.log('='.repeat(80));

    return finalResults;

  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the verification
verifySpinTiming()
  .then(() => {
    console.log('\n✓ Verification complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  });
