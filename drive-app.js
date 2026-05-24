const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 150)); });

  await page.goto('http://localhost:8001/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  const visible = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      html: root ? root.innerHTML.length : 0,
      hasHeader: !!document.querySelector('header'),
      hasHero: !!document.body.innerText.includes('Smart Business'),
      title: document.title,
    };
  });

  console.log('Visible state:', visible);
  console.log('Errors:', errors.length ? errors.slice(0,5).join('\n') : 'NONE');

  await page.screenshot({ path: '/tmp/landing-check.png' });

  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
