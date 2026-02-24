import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('🚀 Starting browser automation...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't want to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  // Capture console logs from the page
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEV_SPIN_TIMING]')) {
      try {
        // Extract the JSON part after [DEV_SPIN_TIMING]
        const jsonMatch = text.match(/\[DEV_SPIN_TIMING\]\s*(.+)/);
        if (jsonMatch && jsonMatch[1]) {
          const data = JSON.parse(jsonMatch[1]);
          consoleLogs.push(data);
          console.log('📝 Captured timing event:', data.event);
        }
      } catch (e) {
        console.log('⚠️  Could not parse timing log:', text);
      }
    }
  });
  
  console.log('📱 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for page to load
  console.log('⏳ Waiting for game to load...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Also inject console log interceptor as backup
  console.log('🔧 Setting up console log interceptor...');
  await page.evaluate(() => {
    window.__spinTimings = [];
    const origLog = console.log;
    console.log = function(...args) {
      if (args[0] === '[DEV_SPIN_TIMING]') {
        window.__spinTimings.push(args[1]);
      }
      origLog.apply(console, args);
    };
  });
  
  // Take initial screenshot
  console.log('📸 Taking initial screenshot...');
  await page.screenshot({ path: 'game-initial.png', fullPage: false });
  
  // Find and click the SPIN button
  console.log('🎰 Looking for SPIN button...');
  
  // Try multiple selectors for the spin button
  const spinButtonSelectors = [
    'button:has-text("SPIN")',
    'button:has-text("Spin")',
    '[data-testid="spin-button"]',
    '.spin-button',
    '#spin-button',
    'button[class*="spin"]',
    'button[id*="spin"]'
  ];
  
  let spinButton = null;
  for (const selector of spinButtonSelectors) {
    try {
      spinButton = await page.$(selector);
      if (spinButton) {
        console.log(`✅ Found spin button with selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  // If no button found by selectors, try to find by text content
  if (!spinButton) {
    console.log('🔍 Trying to find button by text content...');
    spinButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"]'));
      return buttons.find(btn => 
        btn.textContent.toLowerCase().includes('spin') ||
        btn.className.toLowerCase().includes('spin') ||
        btn.id.toLowerCase().includes('spin')
      );
    });
  }
  
  // If still no button, try clicking at a common position
  if (!spinButton || !(await spinButton.asElement())) {
    console.log('⚠️  Could not find spin button by selectors, trying to click at center-bottom position...');
    // Common position for spin button in slot games
    await page.mouse.click(640, 650);
  } else {
    console.log('🖱️  Clicking SPIN button (first spin)...');
    await spinButton.click();
  }
  
  // Wait for spin to complete
  console.log('⏳ Waiting 8 seconds for first spin to complete...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Capture timing data after first spin
  console.log('📊 Capturing timing data from first spin...');
  const timings1 = await page.evaluate(() => {
    return JSON.stringify(window.__spinTimings, null, 2);
  });
  
  console.log('\n=== FIRST SPIN TIMING DATA (from page) ===');
  console.log(timings1);
  console.log('=== END FIRST SPIN ===\n');
  
  console.log('\n=== FIRST SPIN TIMING DATA (from console listener) ===');
  console.log(JSON.stringify(consoleLogs, null, 2));
  console.log('=== END FIRST SPIN ===\n');
  
  // Take screenshot after first spin
  await page.screenshot({ path: 'game-after-spin1.png', fullPage: false });
  
  // Second spin
  console.log('🎰 Clicking SPIN button (second spin)...');
  if (!spinButton || !(await spinButton.asElement())) {
    await page.mouse.click(640, 650);
  } else {
    await spinButton.click();
  }
  
  // Wait for second spin to complete
  console.log('⏳ Waiting 8 seconds for second spin to complete...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Capture timing data after second spin
  console.log('📊 Capturing timing data from both spins...');
  const timings2 = await page.evaluate(() => {
    return JSON.stringify(window.__spinTimings, null, 2);
  });
  
  console.log('\n=== ALL TIMING DATA (BOTH SPINS - from page) ===');
  console.log(timings2);
  console.log('=== END ALL TIMING DATA ===\n');
  
  console.log('\n=== ALL TIMING DATA (BOTH SPINS - from console listener) ===');
  console.log(JSON.stringify(consoleLogs, null, 2));
  console.log('=== END ALL TIMING DATA ===\n');
  
  // Take final screenshot
  await page.screenshot({ path: 'game-after-spin2.png', fullPage: false });
  
  // Save timing data to files (use console logs as they're more reliable)
  fs.writeFileSync('spin-timing-data.json', JSON.stringify(consoleLogs, null, 2));
  console.log('💾 Timing data saved to spin-timing-data.json');
  
  console.log('✅ Test complete! Screenshots saved:');
  console.log('   - game-initial.png');
  console.log('   - game-after-spin1.png');
  console.log('   - game-after-spin2.png');
  
  // Keep browser open for inspection
  console.log('\n⏸️  Browser will remain open for 10 seconds for inspection...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
  console.log('👋 Browser closed.');
})();
