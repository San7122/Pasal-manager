const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile',  width: 390,  height: 844 },
    { name: 'ipad',    width: 768,  height: 1024 },
    { name: 'laptop',  width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:8001/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      return { scrollWidth: html.scrollWidth, clientWidth: html.clientWidth, hasOverflow: html.scrollWidth > html.clientWidth + 1 };
    });

    await page.screenshot({ path: `/tmp/landing-${vp.name}-top.png` });

    // Scroll to features section
    await page.evaluate(() => window.scrollTo(0, 2000));
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: `/tmp/landing-${vp.name}-mid.png` });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1500));
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: `/tmp/landing-${vp.name}-bot.png` });

    console.log(`[${vp.name}] ${vp.width}x${vp.height} — overflow: ${overflow.hasOverflow ? `YES (scroll=${overflow.scrollWidth} > ${overflow.clientWidth})` : 'NO'}`);

    await page.close();
  }

  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
