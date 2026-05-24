#!/usr/bin/env node
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 7777;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let url = req.url.split('?')[0];
      if (url === '/') url = '/pasal-manager.html';
      const fp = path.join(__dirname, url);
      fs.readFile(fp, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const mime = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.json': 'application/json',
        };
        res.writeHead(200, {
          'Content-Type': mime[path.extname(fp)] || 'text/plain',
        });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

(async () => {
  console.log('Starting debug...\n');
  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Load app
  await page.goto(`http://localhost:${PORT}/pasal-manager.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  console.log('1. After load, checking guest-section...');
  const guestSection = await page.$('#guest-section');
  console.log(`   guest-section exists: ${!!guestSection}`);

  // Show setup
  await page.evaluate(() => showGuestSetup());
  await page.waitForSelector('#guest-shop-input', { visible: true });
  console.log('2. Guest setup shown\n');

  // Fill and confirm
  await page.evaluate(() => {
    document.getElementById('guest-shop-input').value = 'Debug Shop';
  });
  await page.evaluate(() => confirmGuest());

  // Wait for app
  await page.waitForFunction(
    () => document.getElementById('app')?.style.display !== 'none',
    { timeout: 10000 }
  );
  await new Promise((r) => setTimeout(r, 2000));

  console.log('3. After guest confirmation:\n');

  // Check page structure
  const pageToday = await page.$('#page-today');
  console.log(`   #page-today exists: ${!!pageToday}`);

  const sAmt = await page.$('#s-amt');
  console.log(`   #s-amt exists: ${!!sAmt}`);

  const sAmt2 = await page.$('[id="s-amt"]');
  console.log(`   [id="s-amt"] exists: ${!!sAmt2}`);

  // Check all input elements on page
  const allInputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    return Array.from(inputs).map((el) => ({
      id: el.id,
      class: el.className,
      placeholder: el.placeholder,
      visible: el.offsetParent !== null,
    }));
  });

  console.log('\n   All input elements:');
  allInputs.slice(0, 15).forEach((inp) => {
    console.log(`      id="${inp.id}" class="${inp.class}" visible=${inp.visible}`);
  });

  // Take screenshot
  await page.screenshot({ path: '/tmp/debug-screen.png' });
  console.log('\n   Screenshot: /tmp/debug-screen.png\n');

  // Check window globals
  const globals = await page.evaluate(() => {
    return {
      sales: typeof window.sales,
      addSale: typeof window.addSale,
      switchTab: typeof window.switchTab,
      app: !!document.getElementById('app'),
    };
  });

  console.log('4. Window globals:');
  console.log(`   window.sales: ${globals.sales}`);
  console.log(`   window.addSale: ${globals.addSale}`);
  console.log(`   window.switchTab: ${globals.switchTab}`);
  console.log(`   #app exists: ${globals.app}\n`);

  // Try switching tabs
  console.log('5. Attempting switchTab("today")...');
  try {
    await page.evaluate(() => switchTab('today'));
    await new Promise((r) => setTimeout(r, 500));
    const sAmt3 = await page.$('#s-amt');
    console.log(`   After switchTab, #s-amt exists: ${!!sAmt3}`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  await browser.close();
  server.close();
})();
