// Verifies the 3 iPhone fixes are correctly wired:
//   1. Backup uses Web Share API on iOS (data-loss fix)
//   2. Scanner uses html5-qrcode on iOS (barcode fix)
//   3. Icon cache busted with ?v=2 + apple-touch-icon points to PNG (icon fix)

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const results = [];
const test = (name, pass, info = '') => {
  results.push({ name, pass, info });
  console.log((pass ? '\x1b[32m' : '\x1b[31m') + '\x1b[0m ' + name + (info ? ' \x1b[90m— ' + info + '\x1b[0m' : ''));
};

(async () => {
  console.log('\n\x1b[36m━━━ FIX #1: Data loss / backup ━━━\x1b[0m');

  const html = fs.readFileSync(path.join(__dirname, 'pasal-manager.html'), 'utf8');

  test('backupData() is async (so it can await Web Share)',
    /async\s+function\s+backupData\s*\(/.test(html));
  test('backupData uses navigator.share for iOS file share',
    /navigator\.canShare/.test(html) && /navigator\.share\s*\(\s*\{\s*files/.test(html));
  test('iOS check inside backupData (iPad|iPhone|iPod)',
    /backupData[\s\S]{0,2000}?iPad\|iPhone\|iPod/.test(html));
  test('Guest banner shows "Backup Now" button',
    /Backup Now[\s\S]*?onclick="backupData/.test(html) || /onclick="backupData[\s\S]*?Backup Now/.test(html));
  test('_showIOSDataWarningOnce function exists',
    /function\s+_showIOSDataWarningOnce/.test(html));
  test('Warning modal mentions iPhone data wipe',
    /uninstall this app, ALL your data will be lost/i.test(html));
  test('Warning uses pm_ios_data_warning_shown flag (one-time)',
    /pm_ios_data_warning_shown/.test(html));

  console.log('\n\x1b[36m━━━ FIX #2: iPhone barcode scanner (html5-qrcode) ━━━\x1b[0m');

  test('_html5QrLoad() helper exists',
    /function\s+_html5QrLoad\s*\(/.test(html));
  test('html5-qrcode CDN script URL present',
    /cdn\.jsdelivr\.net\/npm\/html5-qrcode/.test(html));
  test('openScanner takes iOS path with isIOS check',
    /async\s+function\s+openScanner[\s\S]{0,800}?iPad\|iPhone\|iPod/.test(html));
  test('openScanner instantiates Html5Qrcode on iOS',
    /new\s+Html5Qrcode\s*\(/.test(html));
  test('Scanner requests environment-facing camera',
    /facingMode\s*:\s*['"]environment['"]/.test(html));
  test('Scanner pre-warms camera permission with getUserMedia (iOS gesture fix)',
    /navigator\.mediaDevices\.getUserMedia[\s\S]{0,400}?facingMode/.test(html) &&
    /async\s+function\s+openScanner/.test(html));
  test('Scanner uses Html5Qrcode.getCameras() to find back camera by deviceId',
    /Html5Qrcode\.getCameras\(\)/.test(html) && /\/back\|rear\|environment/i.test(html));
  test('iOS Take-Photo fallback wired up',
    /scannerDecodePhoto/.test(html) && /capture="environment"/.test(html));
  test('closeScanner stops html5-qrcode instance',
    /closeScanner[\s\S]{0,400}?_html5QrScanner[\s\S]{0,200}?\.stop\(/.test(html));
  test('_onBarcodeDetected stops html5-qrcode on success',
    /function\s+_onBarcodeDetected[\s\S]{0,1200}?_html5QrScanner[\s\S]{0,100}?\.stop\(/.test(html));
  test('Android/Desktop path uses BarcodeDetector or ZXing (unchanged)',
    /BarcodeDetector['"]?\s+in\s+window/.test(html) && /_zxingLoad/.test(html));

  console.log('\n\x1b[36m━━━ FIX #3: Icon cache (PNG freshness + ?v=2) ━━━\x1b[0m');

  // PNG freshness — they should be newer than the SVG source so they reflect new logo
  const svgStat = fs.statSync(path.join(__dirname, 'public/logo-icon.svg'));
  const iconSizes = [72, 96, 128, 144, 152, 180, 192, 512, 1024];
  let allFresh = true;
  for (const sz of iconSizes) {
    const f = path.join(__dirname, `public/icons/icon-${sz}.png`);
    const st = fs.statSync(f);
    if (st.mtimeMs < svgStat.mtimeMs - 60000) { allFresh = false; break; }
  }
  test('All 9 PNG icons regenerated >= SVG source date', allFresh);

  // Manifest checks
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/manifest.webmanifest'), 'utf8'));
  const allVersioned = manifest.icons.every(i => /\?v=\d+/.test(i.src));
  test('All manifest icon URLs cache-busted with ?v=N', allVersioned);
  test('Manifest has icon-180.png (required for iOS apple-touch-icon match)',
    manifest.icons.some(i => i.src.includes('icon-180.png')));
  test('Shortcut icons also versioned',
    manifest.shortcuts.every(s => s.icons.every(i => /\?v=/.test(i.src))));

  // apple-touch-icon checks — must point to PNG, not SVG
  const appHtml = fs.readFileSync(path.join(__dirname, 'public/app.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  const appAppleTouch = [...appHtml.matchAll(/apple-touch-icon[^>]*href="([^"]+)"/g)].map(m => m[1]);
  test('app.html apple-touch-icon links all point to PNG (not SVG)',
    appAppleTouch.length >= 3 && appAppleTouch.every(h => h.includes('.png')));
  test('app.html apple-touch-icon URLs all have ?v=2',
    appAppleTouch.every(h => h.includes('?v=2')));

  const indexAppleTouch = [...indexHtml.matchAll(/apple-touch-icon[^>]*href="([^"]+)"/g)].map(m => m[1]);
  test('index.html (landing) apple-touch-icon links point to PNG',
    indexAppleTouch.length >= 1 && indexAppleTouch.every(h => h.includes('.png')));
  test('index.html apple-touch-icon URLs all have ?v=2',
    indexAppleTouch.every(h => h.includes('?v=2')));

  // Service worker
  const sw = fs.readFileSync(path.join(__dirname, 'public/sw.js'), 'utf8');
  test('SW CACHE_VERSION bumped to pm-v2',
    /CACHE_VERSION\s*=\s*['"]pm-v2['"]/.test(sw));
  test('SW pre-caches versioned icon URLs',
    /\/icons\/icon-\d+\.png\?v=2/.test(sw));

  console.log('\n\x1b[36m━━━ FIX #1+#3: Runtime checks via headless browser ━━━\x1b[0m');

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent(IPHONE_UA);
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto('http://localhost:8001/app.html?guest=TestShop', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    // Verify functions actually defined at runtime (not just in source)
    const fns = await page.evaluate(() => ({
      backupIsAsync: typeof backupData === 'function' &&
        backupData.constructor.name === 'AsyncFunction',
      h5qrLoaderExists: typeof _html5QrLoad === 'function',
      warningFnExists: typeof _showIOSDataWarningOnce === 'function',
      iosUaDetected: /iPad|iPhone|iPod/.test(navigator.userAgent),
    }));
    test('Runtime: backupData is async function', fns.backupIsAsync);
    test('Runtime: _html5QrLoad defined', fns.h5qrLoaderExists);
    test('Runtime: _showIOSDataWarningOnce defined', fns.warningFnExists);
    test('Runtime: iPhone UA correctly detected', fns.iosUaDetected);

    // Trigger backup with mocked navigator.share to confirm it takes the iOS share path
    const sharePath = await page.evaluate(async () => {
      let sharedFile = null;
      navigator.canShare = (opts) => !!(opts && opts.files);
      navigator.share = async (opts) => { sharedFile = opts.files && opts.files[0]; return; };
      sales = []; expenses = []; udhaars = []; stock = [];
      await backupData();
      return {
        fileShared: !!sharedFile,
        name: sharedFile && sharedFile.name,
        type: sharedFile && sharedFile.type,
      };
    });
    test('Runtime: backupData() takes iOS Share Sheet path', sharePath.fileShared);
    test('Runtime: Shared file is JSON', sharePath.type === 'application/json');
    test('Runtime: Shared filename pattern correct',
      /^pasal-backup-.*\.json$/.test(sharePath.name || ''));

    // Fetch the live manifest + check icons load with ?v=2
    const manifestRes = await page.evaluate(async () => {
      const r = await fetch('/manifest.webmanifest');
      const m = await r.json();
      const iconUrl = m.icons.find(i => i.sizes === '180x180')?.src;
      if (!iconUrl) return { ok: false };
      const iconRes = await fetch(iconUrl);
      return { ok: true, status: iconRes.status, ct: iconRes.headers.get('content-type'), versioned: /\?v=/.test(iconUrl) };
    });
    test('Runtime: manifest 180x180 icon URL is versioned', manifestRes.versioned);
    test('Runtime: icon-180.png?v=2 returns 200 from server',
      manifestRes.status === 200, `status=${manifestRes.status}`);
    test('Runtime: icon-180.png?v=2 is PNG content-type',
      (manifestRes.ct || '').includes('image/png'), `content-type=${manifestRes.ct}`);

    // Trigger warning + verify state (function uses setTimeout 2500ms before showing modal).
    // NEW: Engagement gate — modal only fires when user has 3+ records or 24h+ of use.
    // The gate prevents a scary first impression for brand-new iPhone guests.
    const warning = await page.evaluate(() => {
      localStorage.removeItem('pm_ios_data_warning_shown');
      // Seed the engagement gate: 3 sales is the threshold to trigger the warning
      sales = [
        { id: 's1', amt: 100, date: '2026-05-25', ts: 1 },
        { id: 's2', amt: 200, date: '2026-05-25', ts: 2 },
        { id: 's3', amt: 300, date: '2026-05-25', ts: 3 },
      ];
      _showIOSDataWarningOnce();
      return new Promise(r => setTimeout(() => {
        const modals = Array.from(document.querySelectorAll('div'));
        const modalShown = modals.some(d => /Important: Backup Your Data!/i.test(d.innerHTML || ''));
        r({
          marked: localStorage.getItem('pm_ios_data_warning_shown') === '1',
          modalShown,
        });
      }, 2800));
    });
    test('Runtime: warning modal renders for iPhone users with 3+ records (engagement gate)', warning.modalShown);
    test('Runtime: warning marks pm_ios_data_warning_shown=1', warning.marked);

    // NEW: Verify the gate actually blocks the warning for fresh users (0 records)
    const noWarningForFresh = await page.evaluate(() => {
      localStorage.removeItem('pm_ios_data_warning_shown');
      localStorage.removeItem('pm_guest_start');
      // Remove the modal from previous test
      document.querySelectorAll('div').forEach(d => {
        if (/Important: Backup Your Data!/i.test(d.innerHTML || '')) d.remove();
      });
      sales = []; udhaars = []; stock = [];
      _showIOSDataWarningOnce();
      return new Promise(r => setTimeout(() => {
        const modals = Array.from(document.querySelectorAll('div'));
        const modalShown = modals.some(d => /Important: Backup Your Data!/i.test(d.innerHTML || ''));
        r(modalShown);
      }, 2800));
    });
    test('Engagement gate: warning is SUPPRESSED for fresh users with 0 records', !noWarningForFresh);

    // Switch to Android UA — verify Android path uses native BarcodeDetector OR ZXing fallback
    console.log('\n\x1b[36m━━━ Regression: Android scanner path untouched ━━━\x1b[0m');
    await page.close();
    const androidPage = await browser.newPage();
    await androidPage.setUserAgent(ANDROID_UA);
    await androidPage.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
    await androidPage.goto('http://localhost:8001/app.html?guest=TestShopAndroid', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));
    const android = await androidPage.evaluate(() => ({
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      hasBarcodeDetector: 'BarcodeDetector' in window,
      openScannerExists: typeof openScanner === 'function',
      h5qrLoaderStillThere: typeof _html5QrLoad === 'function',
    }));
    test('Android UA: not detected as iOS', !android.isIOS);
    test('Android UA: openScanner still callable', android.openScannerExists);
    test('Android UA: html5-qrcode loader still defined (lazy-loaded path)', android.h5qrLoaderStillThere);

    console.log('\n\x1b[36m━━━ Vercel: live deployment serves new icons ━━━\x1b[0m');
    try {
      const liveCheck = await androidPage.evaluate(async () => {
        const r = await fetch('https://pasal-manager.vercel.app/manifest.webmanifest', { cache: 'no-store' });
        const text = await r.text();
        return { status: r.status, hasV2: /\?v=2/.test(text) };
      });
      test('Live: vercel manifest.webmanifest reachable',
        liveCheck.status === 200, `status=${liveCheck.status}`);
      test('Live: vercel manifest has ?v=2 (deploy is current)',
        liveCheck.hasV2, liveCheck.hasV2 ? '' : 'still old manifest — deploy may be in progress');
    } catch (e) {
      test('Live: vercel reachable', false, 'network: ' + e.message);
    }

  } finally {
    if (browser) await browser.close();
  }

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const allGood = passed === total;
  console.log(`RESULT: ${passed}/${total} iOS-fix verification tests passed`);
  if (allGood) console.log('\x1b[42m\x1b[1m 🎉 ALL 3 iOS FIXES VERIFIED — SCANNER + BACKUP + ICON CACHE WORKING \x1b[0m');
  else {
    console.log('\x1b[41m\x1b[1m ❌ SOME FIXES FAILED VERIFICATION \x1b[0m');
    console.log('\nFailed:');
    results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name + (r.info ? ' — ' + r.info : '')));
  }
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');

  process.exit(allGood ? 0 : 1);
})().catch(e => { console.error('TEST RUNNER FAIL:', e); process.exit(1); });
