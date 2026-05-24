// Mimics the REAL user flow: brand-new visit → guest setup → set country → close → reopen
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  // ---- FIRST VISIT (clean slate) ----
  console.log('━━━ FIRST VISIT (clean state) ━━━');
  await page.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4500));

  const firstView = await page.evaluate(() => ({
    authVisible: document.getElementById('auth-page').style.display !== 'none',
    appVisible: document.getElementById('app').style.display !== 'none',
  }));
  console.log('   First load: auth=', firstView.authVisible, ', app=', firstView.appVisible);

  // ---- CLICK Start as Guest, type shop name, confirm ----
  console.log('━━━ Step 1: Start as Guest, type SANJANA SHOE STORE ━━━');
  await page.evaluate(() => {
    if (typeof showGuestSetup === 'function') showGuestSetup();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const i = document.getElementById('guest-shop-input');
    if (i) i.value = 'SANJANA SHOE STORE';
    if (typeof confirmGuest === 'function') confirmGuest();
  });
  await new Promise(r => setTimeout(r, 3000));

  const afterGuest = await page.evaluate(() => ({
    appVisible: document.getElementById('app').style.display !== 'none',
    shopName: S.shopName, country: S.country, isGuest: isGuestMode,
  }));
  console.log('   After guest setup:', afterGuest);

  // ---- Go to Settings, click Nepal ----
  console.log('━━━ Step 2: Go to Settings → click Nepal ━━━');
  await page.evaluate(() => {
    if (typeof goMore === 'function') goMore('settings');
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    if (typeof setCo === 'function') setCo('NP');
  });
  await new Promise(r => setTimeout(r, 1500));

  const afterNP = await page.evaluate(() => ({
    country: S.country, language: S.language,
    localStorageCache: localStorage.getItem('local_settings'),
  }));
  console.log('   After clicking Nepal:', { country: afterNP.country, language: afterNP.language });
  console.log('   localStorage local_settings:', (afterNP.localStorageCache || '').slice(0, 150));

  // ---- Add Fonepay code ----
  console.log('━━━ Step 3: Add Fonepay merchant code ━━━');
  const fonepay = '0002010102110216427142001818576326350011fonepay.com071622220300181857645204566153035245802NP5918SANJANA SHOE STORE6013DHARAN BRANCH62110707186740963048913';
  await page.evaluate((fp) => {
    S.npPaymentId = fp;
    S.esewaId = '9876543210';
    S.khaltiId = '9876543210';
    if (typeof saveSettings === 'function') saveSettings();
  }, fonepay);
  await new Promise(r => setTimeout(r, 1500));

  const beforeReload = await page.evaluate(() => ({
    country: S.country, npLen: (S.npPaymentId || '').length,
    cached: localStorage.getItem('local_settings'),
  }));
  console.log('   Before reload: country=' + beforeReload.country + ', fonepay length=' + beforeReload.npLen);

  // ---- RELOAD (simulating close + reopen) ----
  console.log('━━━ Step 4: Close & reopen app (reload) ━━━');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4500));

  const afterReload = await page.evaluate(() => ({
    authVisible: document.getElementById('auth-page')?.style.display !== 'none',
    appVisible: document.getElementById('app')?.style.display !== 'none',
    country: typeof S !== 'undefined' ? S.country : 'NO_S',
    shopName: typeof S !== 'undefined' ? S.shopName : 'NO_S',
    npPaymentId: typeof S !== 'undefined' ? (S.npPaymentId || '').slice(0, 40) : 'NO_S',
    npLength: typeof S !== 'undefined' ? (S.npPaymentId || '').length : 0,
    esewaId: typeof S !== 'undefined' ? S.esewaId : 'NO_S',
    khaltiId: typeof S !== 'undefined' ? S.khaltiId : 'NO_S',
  }));
  console.log('   After reload:');
  console.log('     auth visible:', afterReload.authVisible);
  console.log('     app visible:', afterReload.appVisible);
  console.log('     country:', afterReload.country);
  console.log('     shopName:', afterReload.shopName);
  console.log('     npPaymentId len:', afterReload.npLength);
  console.log('     esewaId:', afterReload.esewaId);
  console.log('     khaltiId:', afterReload.khaltiId);

  // ---- VERDICT ----
  console.log('');
  console.log('═════════════════════════════════════════════════');
  const tests = [
    { name: 'Country still NP after reload', pass: afterReload.country === 'NP' },
    { name: 'Shop name preserved', pass: afterReload.shopName === 'SANJANA SHOE STORE' },
    { name: 'Fonepay code preserved (154 chars)', pass: afterReload.npLength === 154 },
    { name: 'eSewa ID preserved', pass: afterReload.esewaId === '9876543210' },
    { name: 'Khalti ID preserved', pass: afterReload.khaltiId === '9876543210' },
    { name: 'Auth screen hidden (auto-login worked)', pass: !afterReload.authVisible },
  ];
  let pass = 0;
  for (const t of tests) {
    if (t.pass) { console.log('✅', t.name); pass++; }
    else console.log('❌', t.name);
  }
  console.log(`${pass}/${tests.length} passed`);

  await browser.close();
  process.exit(pass === tests.length ? 0 : 1);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
