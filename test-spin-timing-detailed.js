import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('🚀 Starting detailed browser automation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  // Capture ALL console logs from the page
  const allConsoleLogs = [];
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();
    
    // Try to get the actual arguments
    const args = await Promise.all(
      msg.args().map(arg => arg.jsonValue().catch(() => arg.toString()))
    );
    
    const logEntry = {
      type,
      text,
      args,
      timestamp: Date.now()
    };
    
    allConsoleLogs.push(logEntry);
    
    // Print interesting logs
    if (text.includes('[DEV_SPIN_TIMING]') || 
        text.includes('planStop') || 
        text.includes('REEL') ||
        text.includes('SPIN')) {
      console.log(`[${type}]`, text);
    }
  });
  
  console.log('📱 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for page to load
  console.log('⏳ Waiting for game to load...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Inject enhanced console log interceptor
  console.log('🔧 Setting up enhanced console log interceptor...');
  await page.evaluate(() => {
    window.__spinTimings = [];
    window.__planStopLogs = [];
    window.__allLogs = [];
    
    const origLog = console.log;
    console.log = function(...args) {
      // Store all logs
      window.__allLogs.push({
        timestamp: performance.now(),
        args: args.map(a => {
          try {
            return typeof a === 'object' ? JSON.parse(JSON.stringify(a)) : a;
          } catch (e) {
            return String(a);
          }
        })
      });
      
      // Capture DEV_SPIN_TIMING
      if (args[0] === '[DEV_SPIN_TIMING]') {
        window.__spinTimings.push(args[1]);
      }
      
      // Capture planStop logs
      if (args[0] && String(args[0]).includes('planStop')) {
        window.__planStopLogs.push({
          timestamp: performance.now(),
          args: args
        });
      }
      
      origLog.apply(console, args);
    };
  });
  
  // Take initial screenshot
  console.log('📸 Taking initial screenshot...');
  await page.screenshot({ path: 'game-initial-detailed.png', fullPage: false });
  
  // Find and click the SPIN button
  console.log('🎰 Clicking SPIN button (first spin)...');
  await page.click('#spin-button');
  
  // Wait for spin to complete
  console.log('⏳ Waiting 8 seconds for first spin to complete...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Capture all data after first spin
  console.log('📊 Capturing all data from first spin...');
  const data1 = await page.evaluate(() => {
    return {
      spinTimings: window.__spinTimings,
      planStopLogs: window.__planStopLogs,
      allLogs: window.__allLogs.filter(log => 
        log.args.some(arg => 
          String(arg).includes('planStop') || 
          String(arg).includes('[DEV_SPIN_TIMING]') ||
          String(arg).includes('REEL') ||
          String(arg).includes('SPIN')
        )
      )
    };
  });
  
  console.log('\n=== FIRST SPIN DATA ===');
  console.log('Spin Timings:', JSON.stringify(data1.spinTimings, null, 2));
  console.log('\nPlan Stop Logs:', JSON.stringify(data1.planStopLogs, null, 2));
  console.log('\nFiltered Logs:', JSON.stringify(data1.allLogs, null, 2));
  console.log('=== END FIRST SPIN ===\n');
  
  // Take screenshot after first spin
  await page.screenshot({ path: 'game-after-spin1-detailed.png', fullPage: false });
  
  // Second spin
  console.log('🎰 Clicking SPIN button (second spin)...');
  await page.click('#spin-button');
  
  // Wait for second spin to complete
  console.log('⏳ Waiting 8 seconds for second spin to complete...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Capture all data after second spin
  console.log('📊 Capturing all data from both spins...');
  const data2 = await page.evaluate(() => {
    return {
      spinTimings: window.__spinTimings,
      planStopLogs: window.__planStopLogs,
      allLogs: window.__allLogs.filter(log => 
        log.args.some(arg => 
          String(arg).includes('planStop') || 
          String(arg).includes('[DEV_SPIN_TIMING]') ||
          String(arg).includes('REEL') ||
          String(arg).includes('SPIN')
        )
      )
    };
  });
  
  console.log('\n=== ALL DATA (BOTH SPINS) ===');
  console.log('Spin Timings:', JSON.stringify(data2.spinTimings, null, 2));
  console.log('\nPlan Stop Logs:', JSON.stringify(data2.planStopLogs, null, 2));
  console.log('\nFiltered Logs:', JSON.stringify(data2.allLogs, null, 2));
  console.log('=== END ALL DATA ===\n');
  
  // Take final screenshot
  await page.screenshot({ path: 'game-after-spin2-detailed.png', fullPage: false });
  
  // Save all data to files
  fs.writeFileSync('spin-timing-detailed.json', JSON.stringify(data2, null, 2));
  fs.writeFileSync('console-logs-all.json', JSON.stringify(allConsoleLogs, null, 2));
  
  console.log('💾 Data saved to:');
  console.log('   - spin-timing-detailed.json');
  console.log('   - console-logs-all.json');
  
  console.log('✅ Test complete! Screenshots saved:');
  console.log('   - game-initial-detailed.png');
  console.log('   - game-after-spin1-detailed.png');
  console.log('   - game-after-spin2-detailed.png');
  
  // Keep browser open for inspection
  console.log('\n⏸️  Browser will remain open for 10 seconds for inspection...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
  console.log('👋 Browser closed.');
})();
