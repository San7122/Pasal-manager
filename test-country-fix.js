// Test the country/Nepal-payment-ID persistence fix
const puppeteer = require('puppeteer');

const URL = 'http://localhost:8001/app.html?guest=TestShop';
const log = (icon, msg) => console.log(`${icon} ${msg}`);

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  // Silence noisy console
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Lottie') && !m.text().includes('Failed to load')) console.log('  [console.error]', m.text().slice(0, 100)); });

  // ====================================================================
  // STEP 1: Open app in guest mode
  // ====================================================================
  log('1️⃣', 'Opening app in guest mode...');
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4500));

  const initialState = await page.evaluate(() => ({
    appVisible: document.getElementById('app').style.display !== 'none',
    country: typeof S !== 'undefined' ? S.country : 'NO_S',
    isGuest: typeof isGuestMode !== 'undefined' ? isGuestMode : 'NO_VAR',
  }));
  log('  ', `App visible: ${initialState.appVisible}, default country: ${initialState.country}, guest: ${initialState.isGuest}`);

  // ====================================================================
  // STEP 2: Set country to Nepal + add Nepal payment IDs
  // ====================================================================
  log('2️⃣', 'Setting country to Nepal + Nepal payment IDs...');
  await page.evaluate(() => {
    // Directly set settings as a user would via Settings page
    S.country = 'NP';
    S.npPaymentId = '9876543210';
    S.esewaId = '9876543210';
    S.khaltiId = '9876543210';
    S.shopName = 'SANJANA SHOE STORE';

    // Save via the actual save mechanism
    if (typeof saveSettings === 'function') saveSettings();
    cacheWrite();
  });

  const afterSave = await page.evaluate(() => ({
    country: S.country,
    npPaymentId: S.npPaymentId,
    esewaId: S.esewaId,
    khaltiId: S.khaltiId,
    cachedSettings: JSON.parse(localStorage.getItem(`${currentUser?.id || 'local'}_settings`) || '{}'),
  }));
  log('  ', `After save: country=${afterSave.country}, npPaymentId=${afterSave.npPaymentId}, esewaId=${afterSave.esewaId}`);
  log('  ', `localStorage cached: ${JSON.stringify(afterSave.cachedSettings).slice(0, 120)}`);

  // ====================================================================
  // STEP 3: Simulate going offline + reload page (the bug scenario)
  // ====================================================================
  log('3️⃣', 'Simulating offline → reload → online cycle...');
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const offlineState = await page.evaluate(() => ({
    country: typeof S !== 'undefined' ? S.country : 'NO_S',
    npPaymentId: typeof S !== 'undefined' ? S.npPaymentId : 'NO_S',
    esewaId: typeof S !== 'undefined' ? S.esewaId : 'NO_S',
    khaltiId: typeof S !== 'undefined' ? S.khaltiId : 'NO_S',
  }));
  log('  ', `Offline reload: country=${offlineState.country}, npPaymentId=${offlineState.npPaymentId}`);

  await page.setOfflineMode(false);
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const onlineState = await page.evaluate(() => ({
    country: typeof S !== 'undefined' ? S.country : 'NO_S',
    npPaymentId: typeof S !== 'undefined' ? S.npPaymentId : 'NO_S',
    esewaId: typeof S !== 'undefined' ? S.esewaId : 'NO_S',
    khaltiId: typeof S !== 'undefined' ? S.khaltiId : 'NO_S',
    shopName: typeof S !== 'undefined' ? S.shopName : 'NO_S',
  }));
  log('  ', `Back online: country=${onlineState.country}, npPaymentId=${onlineState.npPaymentId}, esewaId=${onlineState.esewaId}, khaltiId=${onlineState.khaltiId}`);

  // ====================================================================
  // STEP 4: Verify all settings preserved
  // ====================================================================
  log('4️⃣', 'Verifying fix...');
  const tests = [
    { name: 'Country stays NP after offline→online', pass: onlineState.country === 'NP' },
    { name: 'Fonepay merchant ID preserved',          pass: onlineState.npPaymentId === '9876543210' },
    { name: 'eSewa ID preserved',                     pass: onlineState.esewaId === '9876543210' },
    { name: 'Khalti ID preserved',                    pass: onlineState.khaltiId === '9876543210' },
    { name: 'Shop name preserved',                    pass: onlineState.shopName === 'SANJANA SHOE STORE' },
  ];

  let allPass = true;
  for (const t of tests) {
    if (t.pass) {
      console.log(`  ✅ PASS — ${t.name}`);
    } else {
      console.log(`  ❌ FAIL — ${t.name}`);
      allPass = false;
    }
  }

  // ====================================================================
  // STEP 5: Test 2 — Real Fonepay merchant string from the user
  // ====================================================================
  log('5️⃣', 'Testing real Fonepay merchant string...');
  const fonepayString = '0002010102110216427142001818576326350011fonepay.com071622220300181857645204566153035245802NP5918SANJANA SHOE STORE6013DHARAN BRANCH62110707186740963048913';

  await page.evaluate((fp) => {
    S.npPaymentId = fp;
    saveSettings();
    cacheWrite();
  }, fonepayString);

  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3500));

  const fonepayState = await page.evaluate(() => ({
    saved: S.npPaymentId,
    length: (S.npPaymentId || '').length,
  }));

  const fonepayTest = fonepayState.saved === fonepayString;
  if (fonepayTest) {
    console.log(`  ✅ PASS — Fonepay merchant string preserved (${fonepayState.length} chars)`);
  } else {
    console.log(`  ❌ FAIL — Fonepay string corrupted. Got: ${fonepayState.saved?.slice(0, 60)}...`);
    allPass = false;
  }

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  if (allPass) {
    console.log('🎉 ALL TESTS PASSED — Country/Nepal payment fix works!');
  } else {
    console.log('❌ SOME TESTS FAILED — Fix needs more work');
    process.exit(1);
  }
  console.log('═══════════════════════════════════════════════════════');

  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
