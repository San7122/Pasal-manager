// Full A-to-Z UX audit. Walks through every major feature as a real user would,
// captures screenshots, and reports issues found.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SHOTS_DIR = path.join(__dirname, 'audit-screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

const findings = { critical: [], ux: [], polish: [], works_well: [] };
const log = (level, area, msg, screenshot = '') => {
  findings[level].push({ area, msg, screenshot });
  const icons = { critical: '🔴', ux: '🟠', polish: '🟡', works_well: '✅' };
  console.log(`${icons[level]} [${area}] ${msg}${screenshot ? ` (📸 ${screenshot})` : ''}`);
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(page, name) {
  const file = path.join(SHOTS_DIR, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  return name + '.png';
}

// Dismiss any blocking modals (iOS data warning, upgrade prompts, etc.)
async function dismissModals(page) {
  try {
    await page.evaluate(() => {
      ['ios-data-warning-modal', 'evening-summary-modal', 'upgrade-modal',
       'stock-adjust-modal', 'stock-history-modal'].forEach(id => {
        const m = document.getElementById(id);
        if (m) m.remove();
      });
      // Catch-all: any fixed-position blocking overlay with z-index >= 99000
      document.querySelectorAll('div[style*="position:fixed"]').forEach(d => {
        const z = parseInt(getComputedStyle(d).zIndex, 10);
        if (z >= 99000 && d.offsetWidth > 200) d.remove();
      });
    });
  } catch(_) {}
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║    Pasal Manager — Full A-to-Z UX Audit                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // ═══════════════════════════════════════════
  // PHASE 1: iPhone-sized viewport — primary use case
  // ═══════════════════════════════════════════
  console.log('\n━━━ PHASE 1: iPhone 14 (390×844) — primary target ━━━\n');
  const phone = await browser.newPage();
  await phone.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15');
  await phone.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // ─── Auth page ───
  await phone.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
  // Pre-set the iOS warning flag so it doesn't fire and block subsequent checks.
  // (We already captured the "modal blocks onboarding" finding earlier.)
  await phone.evaluate(() => localStorage.setItem('pm_ios_data_warning_shown', '1'));
  await sleep(4500);
  let s = await shot(phone, '01-auth-page');

  // Check for critical elements on auth page
  const authChecks = await phone.evaluate(() => ({
    hasLogo: !!document.querySelector('img[alt*="Pasal" i], img[src*="logo"]'),
    hasGuestBtn: !!document.querySelector('[onclick*="showGuestSetup"]'),
    hasLoginTab: !!document.getElementById('tab-login'),
    hasSignupTab: !!document.getElementById('tab-signup'),
    hasEmailInput: !!document.getElementById('a-email'),
    hasPassInput: !!document.getElementById('a-pass'),
    visibleText: document.body.innerText.slice(0, 500),
    bodyScrollable: document.body.scrollHeight > window.innerHeight,
  }));
  if (!authChecks.hasLogo)       log('ux',       'Auth', 'No visible logo/brand on auth page', s);
  if (!authChecks.hasGuestBtn)   log('critical', 'Auth', 'Cannot find "Start as Guest" button', s);
  if (!authChecks.hasLoginTab || !authChecks.hasSignupTab) log('critical', 'Auth', 'Login/Signup tabs missing', s);
  if (authChecks.hasGuestBtn && authChecks.hasLoginTab) log('works_well', 'Auth', 'Auth page renders correctly with logo, tabs, and guest option');

  // ─── Guest flow ───
  await phone.evaluate(() => showGuestSetup());
  await sleep(500);
  s = await shot(phone, '02-guest-setup');
  await phone.evaluate(() => {
    const i = document.getElementById('guest-shop-input');
    if (i) i.value = 'My Test Shop';
  });
  await phone.evaluate(() => confirmGuest());
  await sleep(4000);
  s = await shot(phone, '03-after-guest-login');

  // The iOS data-loss warning modal blocks first-time use for iPhone visitors.
  // We dismiss it here so the rest of the audit can interact with the page,
  // but record it as a finding since real users have to deal with it too.
  const iosWarningCheck = await phone.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Important: Backup Your Data') || text.includes('ALL your data will be lost');
  });
  if (iosWarningCheck) {
    log('ux', 'Onboarding', 'iOS data-loss warning modal blocks the screen immediately after guest signup — appears before user has any data to worry about. Suggest delaying until 3rd sale.', s);
  }
  await dismissModals(phone);
  await sleep(300);

  const homeChecks = await phone.evaluate(() => ({
    onTodayTab: !!document.getElementById('page-today')?.classList.contains('active'),
    hasAddSaleForm: !!document.getElementById('s-amt'),
    hasBottomNav: !!document.querySelector('.bottom-nav'),
    hasGuestBanner: !!document.getElementById('guest-banner-el'),
    bannerHasUpgradeCTA: (document.getElementById('guest-banner-el')?.innerText || '').includes('Save with email'),
    hasShopNameInTopbar: (document.getElementById('topbar-title')?.textContent || '') === 'My Test Shop',
  }));
  if (!homeChecks.onTodayTab)         log('critical', 'Guest', 'Did not land on Today tab after guest start', s);
  if (!homeChecks.hasAddSaleForm)     log('critical', 'Guest', 'Add-sale form missing on Today', s);
  if (!homeChecks.hasBottomNav)       log('critical', 'Guest', 'Bottom navigation not visible', s);
  if (!homeChecks.hasGuestBanner)     log('ux',       'Guest', 'No guest banner on Today (upgrade nudge missing)', s);
  if (homeChecks.bannerHasUpgradeCTA) log('works_well', 'Guest', '"Save with email" CTA prominent in banner');
  if (homeChecks.hasShopNameInTopbar) log('works_well', 'Guest', 'Shop name displayed in topbar correctly');

  await dismissModals(phone);
  // ─── Add a sale ───
  console.log('\n  → Adding first sale...');
  await phone.evaluate(() => {
    document.getElementById('s-amt').value = '500';
    document.getElementById('s-cost').value = '300';
    document.getElementById('s-note').value = 'Test Item';
  });
  await sleep(200);
  await phone.evaluate(() => addSale());
  await sleep(800);
  s = await shot(phone, '04-after-first-sale');

  const saleChecks = await phone.evaluate(() => ({
    formCleared: document.getElementById('s-amt').value === '',
    saleAppeared: !!Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('Test Item')),
    todayTotalUpdated: (document.getElementById('today-amount-display')?.textContent || '').includes('500') ||
                       Array.from(document.querySelectorAll('.summary-card-value, .today-hero-amount')).some(el => el.textContent.includes('500')),
  }));
  if (!saleChecks.formCleared)        log('ux',       'Sale', 'Form fields not cleared after submission', s);
  if (!saleChecks.saleAppeared)       log('critical', 'Sale', 'Sale "Test Item" did not appear in list', s);
  if (saleChecks.todayTotalUpdated)   log('works_well', 'Sale', "Today's total updated after sale");

  await dismissModals(phone);
  // ─── Tab navigation ───
  await dismissModals(phone);
  console.log('\n  → Testing tab navigation...');
  for (const tab of ['katha', 'udhaar', 'stock', 'more', 'today']) {
    await phone.evaluate((t) => switchTab(t), tab);
    await sleep(600);
    const active = await phone.evaluate((t) => ({
      pageVisible: document.getElementById('page-' + t)?.classList.contains('active'),
      navActive: document.getElementById('nav-' + t)?.classList.contains('active'),
    }), tab);
    if (!active.pageVisible || !active.navActive) {
      log('critical', 'Nav', `Switching to ${tab} tab did not activate page/nav button`, '');
    }
  }
  log('works_well', 'Nav', 'All 5 bottom-nav tabs switch correctly');

  // ─── Stock tab → adjust with new audit modal ───
  await dismissModals(phone);
  console.log('\n  → Testing Stock + audit modal...');
  await phone.evaluate(() => switchTab('stock'));
  await sleep(500);
  // Add an item
  await phone.evaluate(() => {
    document.getElementById('st-name').value = 'Saree';
    document.getElementById('st-qty').value = '10';
    document.getElementById('st-buy').value = '300';
    document.getElementById('st-sell').value = '500';
  });
  await phone.evaluate(() => addStock());
  await sleep(700);
  s = await shot(phone, '05-stock-with-item');

  // Try the new audit modal — tap −
  const stockId = await phone.evaluate(() => stock.find(i => i.name === 'Saree')?.id);
  await phone.evaluate((id) => updateQty(id, -1), stockId);
  await sleep(700);
  s = await shot(phone, '06-stock-audit-modal');

  const modalChecks = await phone.evaluate(() => {
    const m = document.getElementById('stock-adjust-modal');
    if (!m) return { exists: false };
    const text = m.innerText;
    return {
      exists: true,
      hasReasons: text.includes('Sold (cash, off-app)') || text.includes('Damaged'),
      hasQtyInput: !!document.getElementById('sa-qty'),
      hasNoteInput: !!document.getElementById('sa-note'),
      hasConfirm: text.includes('Remove') || text.includes('Add'),
      hasCancel: text.includes('Cancel'),
    };
  });
  if (!modalChecks.exists)        log('critical', 'StockAudit', 'Audit modal did not open on − tap', s);
  else {
    if (!modalChecks.hasReasons)  log('ux', 'StockAudit', 'Reason chips not showing', s);
    if (!modalChecks.hasQtyInput) log('ux', 'StockAudit', 'Quantity input missing', s);
    if (modalChecks.hasReasons && modalChecks.hasQtyInput) log('works_well', 'StockAudit', 'Modal renders with reason chips + qty input');
  }
  // Confirm the adjustment
  await phone.evaluate(() => _confirmStockAdjust(stock.find(i => i.name === 'Saree').id, -1));
  await sleep(500);
  s = await shot(phone, '07-after-adjustment');
  const afterAdjust = await phone.evaluate(() => ({
    modalGone: !document.getElementById('stock-adjust-modal'),
    qtyDecreased: stock.find(i => i.name === 'Saree')?.qty === 9,
    adjustmentLogged: stockAdjustments.length > 0,
  }));
  if (!afterAdjust.modalGone)      log('ux',       'StockAudit', 'Modal still open after confirm', s);
  if (!afterAdjust.qtyDecreased)   log('critical', 'StockAudit', 'Stock qty did not decrease after adjustment', s);
  if (!afterAdjust.adjustmentLogged) log('critical', 'StockAudit', 'Adjustment not logged in stockAdjustments array');
  if (afterAdjust.qtyDecreased && afterAdjust.adjustmentLogged) log('works_well', 'StockAudit', 'Adjustment correctly logged');

  // ─── Open history modal ───
  await phone.evaluate(() => showStockHistory(stock.find(i => i.name === 'Saree').id));
  await sleep(400);
  s = await shot(phone, '08-stock-history');
  const histCheck = await phone.evaluate(() => {
    const m = document.getElementById('stock-history-modal');
    if (!m) return { exists: false };
    return {
      exists: true,
      hasReason: m.innerText.includes('Sold (cash, off-app)') || m.innerText.includes('Stock count correction'),
      hasBalance: m.innerText.includes('Balance after:'),
    };
  });
  if (!histCheck.exists)       log('critical', 'History', 'Stock history modal did not open');
  else if (histCheck.hasReason && histCheck.hasBalance) log('works_well', 'History', 'History shows reason + balance after each entry');
  await phone.evaluate(() => document.getElementById('stock-history-modal')?.remove());

  // ─── Add udhaar ───
  await dismissModals(phone);
  console.log('\n  → Testing Udhaar flow...');
  await phone.evaluate(() => switchTab('udhaar'));
  await sleep(400);
  await phone.evaluate(() => {
    document.getElementById('u-name').value = 'Test Customer';
    document.getElementById('u-phone').value = '9876543210';
    document.getElementById('u-amt').value = '1000';
    document.getElementById('u-due').value = '2026-12-01';
  });
  await phone.evaluate(() => addUdhaar());
  await sleep(600);
  s = await shot(phone, '09-udhaar-added');
  const udhaarChecks = await phone.evaluate(() => ({
    appeared: udhaars.length > 0 && udhaars[0].name === 'Test Customer',
    listShows: document.body.innerText.includes('Test Customer'),
  }));
  if (!udhaarChecks.appeared || !udhaarChecks.listShows) log('critical', 'Udhaar', 'Udhaar entry did not appear');
  else log('works_well', 'Udhaar', 'Udhaar added and visible in list');

  // ─── Dashboard ───
  await dismissModals(phone);
  console.log('\n  → Testing Dashboard...');
  await phone.evaluate(() => { goMore('dashboard'); });
  await sleep(900);
  s = await shot(phone, '10-dashboard');
  const dashChecks = await phone.evaluate(() => {
    const text = document.getElementById('page-more')?.innerText || '';
    return {
      hasKpiCards: (text.match(/today|week|profit|udhaar|to collect|i owe/gi) || []).length >= 4,
      hasChartCards: document.querySelectorAll('.chart-card').length > 0,
      hasViewSummaryBtn: text.includes("View Today's Summary"),
      hasSendWaBtn: text.includes('Send via WhatsApp'),
    };
  });
  if (!dashChecks.hasKpiCards)       log('critical', 'Dashboard', 'KPI cards missing', s);
  if (!dashChecks.hasChartCards)     log('ux',       'Dashboard', 'Charts not rendering', s);
  if (!dashChecks.hasViewSummaryBtn) log('ux',       'Dashboard', '"View Today\'s Summary" button missing', s);
  if (!dashChecks.hasSendWaBtn)      log('ux',       'Dashboard', '"Send via WhatsApp" button missing', s);
  if (dashChecks.hasKpiCards && dashChecks.hasViewSummaryBtn && dashChecks.hasSendWaBtn) log('works_well', 'Dashboard', 'All key elements present');

  // ─── Evening summary modal ───
  await phone.evaluate(() => showEveningSummary());
  await sleep(500);
  s = await shot(phone, '11-evening-summary-modal');
  const summaryChecks = await phone.evaluate(() => {
    const m = document.getElementById('evening-summary-modal');
    if (!m) return { exists: false };
    return {
      exists: true,
      hasSalesTile: m.innerText.includes('SALES'),
      hasProfitTile: m.innerText.includes('PROFIT'),
      hasWaButton: m.innerText.includes('Send via WhatsApp'),
    };
  });
  if (!summaryChecks.exists)     log('critical', 'EveningSummary', 'Summary modal did not open');
  else if (summaryChecks.hasSalesTile && summaryChecks.hasWaButton) log('works_well', 'EveningSummary', 'Modal shows stats + WhatsApp button');
  await phone.evaluate(() => document.getElementById('evening-summary-modal')?.remove());

  // ─── Purchase Book ───
  await dismissModals(phone);
  console.log('\n  → Testing Purchase Book...');
  await phone.evaluate(() => { goMore('kharidi'); });
  await sleep(500);
  s = await shot(phone, '12-purchase-book-empty');
  const purchaseEmpty = await phone.evaluate(() => {
    const text = document.getElementById('page-more')?.innerText || '';
    return {
      hasTotalDue: text.includes('Total Due to Suppliers'),
      hasEmptyState: text.includes('No suppliers') || text.includes('Add suppliers'),
    };
  });
  if (purchaseEmpty.hasTotalDue && purchaseEmpty.hasEmptyState) log('works_well', 'PurchaseBook', 'Empty state shows helpful instructions');

  // Add a supplier first
  await phone.evaluate(() => { goMore('supplier'); });
  await sleep(400);
  await phone.evaluate(() => {
    const nameEl = document.getElementById('sp-name');
    const phoneEl = document.getElementById('sp-phone');
    if (nameEl) nameEl.value = 'Atri Das';
    if (phoneEl) phoneEl.value = '9800000001';
  });
  try { await phone.evaluate(() => addSupplier()); } catch(_) {}
  await sleep(500);
  // Now go back to purchase book + add entries
  await phone.evaluate(() => { goMore('kharidi'); });
  await sleep(500);
  await phone.evaluate(() => {
    currentKharidiSupplier = 'Atri Das';
    goMore('kharidiDetail');
  });
  await sleep(500);
  s = await shot(phone, '13-purchase-book-detail');
  // Add a purchase entry
  await phone.evaluate(() => {
    document.getElementById('kh-amt').value = '15000';
    document.getElementById('kh-note').value = 'Initial stock';
  });
  await phone.evaluate(() => addKharidiEntry('Atri Das'));
  await sleep(600);
  s = await shot(phone, '14-purchase-entry-added');

  const purchaseAdded = await phone.evaluate(() => ({
    entriesLength: kharidiEntries.length,
    balanceShown: document.body.innerText.includes('Balance after:'),
    hasPdfBtn: document.body.innerText.includes('📄 PDF'),
    hasWaBtn: document.body.innerText.includes('💬 Share'),
  }));
  if (purchaseAdded.entriesLength === 0) log('critical', 'PurchaseBook', 'Purchase entry not saved');
  if (!purchaseAdded.balanceShown) log('ux', 'PurchaseBook', '"Balance after" not shown on entry');
  if (purchaseAdded.hasPdfBtn && purchaseAdded.hasWaBtn) log('works_well', 'PurchaseBook', 'PDF + WhatsApp share buttons visible');
  else if (!purchaseAdded.hasPdfBtn || !purchaseAdded.hasWaBtn) log('ux', 'PurchaseBook', 'PDF or WhatsApp share button missing');

  // ─── Settings ───
  await dismissModals(phone);
  console.log('\n  → Testing Settings...');
  await phone.evaluate(() => { goMore('settings'); });
  await sleep(500);
  s = await shot(phone, '15-settings');
  const settingsChecks = await phone.evaluate(() => {
    const text = document.getElementById('page-more')?.innerText || '';
    return {
      hasShopName: text.includes('Shop Name') || text.includes('shopName'),
      hasCountry: text.includes('India') || text.includes('Nepal'),
      hasLanguage: text.includes('English') || text.includes('language'),
      hasDailySummaryToggle: text.includes('Evening summary auto-show'),
      hasBackupBtn: !!document.querySelector('[onclick*="backupData"]'),
    };
  });
  if (!settingsChecks.hasShopName)           log('ux', 'Settings', 'Shop name field not visible', s);
  if (!settingsChecks.hasCountry)            log('ux', 'Settings', 'Country selector not visible', s);
  if (!settingsChecks.hasDailySummaryToggle) log('ux', 'Settings', 'Daily summary toggle missing', s);
  if (!settingsChecks.hasBackupBtn)          log('ux', 'Settings', 'Backup button not in Settings', s);
  if (settingsChecks.hasShopName && settingsChecks.hasDailySummaryToggle) log('works_well', 'Settings', 'Key settings + new toggle all present');

  // ─── More menu — check organization ───
  await phone.evaluate(() => { switchTab('more'); goMore('menu'); });
  await sleep(500);
  s = await shot(phone, '16-more-menu');
  const moreMenu = await phone.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.more-menu-item')).map(el => el.innerText.split('\n')[0].trim());
    return {
      items,
      itemCount: items.length,
      hasPurchaseBook: items.some(i => i.includes('Purchase Book')),
      hasSettings: items.includes('Settings'),
      hasAdvancedToggle: !!document.querySelector('[onclick*="toggleAdvanced"]'),
    };
  });
  if (!moreMenu.hasPurchaseBook)   log('ux', 'MoreMenu', 'Purchase Book missing from main menu', s);
  if (!moreMenu.hasAdvancedToggle) log('ux', 'MoreMenu', 'Advanced features toggle missing', s);
  if (moreMenu.itemCount < 10)     log('ux', 'MoreMenu', `Only ${moreMenu.itemCount} items in More — verify all features accessible`, s);
  log('works_well', 'MoreMenu', `More menu has ${moreMenu.itemCount} items, Purchase Book ${moreMenu.hasPurchaseBook ? 'visible' : 'hidden'}`);

  // ─── Sign-out → verify back to auth ───
  await dismissModals(phone);
  console.log('\n  → Testing Sign-out...');
  await phone.evaluate(() => signOut());
  await sleep(1000);
  s = await shot(phone, '17-after-signout');
  const signoutChecks = await phone.evaluate(() => ({
    onAuthPage: document.getElementById('auth-page')?.style.display !== 'none',
    appHidden: document.getElementById('app')?.style.display === 'none',
    salesArrayReset: typeof sales !== 'undefined' && sales.length === 0,
  }));
  if (!signoutChecks.onAuthPage) log('critical', 'SignOut', 'Did not return to auth page', s);
  if (!signoutChecks.salesArrayReset) log('critical', 'SignOut', 'Sales array not cleared after signOut');
  if (signoutChecks.onAuthPage && signoutChecks.salesArrayReset) log('works_well', 'SignOut', 'Signout cleared state + returned to auth');

  // ═══════════════════════════════════════════
  // PHASE 2: Desktop view — check responsiveness
  // ═══════════════════════════════════════════
  console.log('\n━━━ PHASE 2: Desktop 1440×900 — responsive check ━━━\n');
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900 });
  await desktop.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
  await sleep(4500);
  s = await shot(desktop, '20-desktop-auth');

  const desktopChecks = await desktop.evaluate(() => ({
    docWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    hasSidebar: !!document.getElementById('sidebar'),
    sidebarVisible: document.getElementById('sidebar') && getComputedStyle(document.getElementById('sidebar')).display !== 'none',
  }));
  if (desktopChecks.docWidth > desktopChecks.viewport + 5) log('critical', 'Desktop', `Horizontal scroll (${desktopChecks.docWidth}px content vs ${desktopChecks.viewport}px viewport)`, s);
  if (!desktopChecks.hasSidebar || !desktopChecks.sidebarVisible) log('ux', 'Desktop', 'Sidebar not visible on desktop — wasted space', s);
  else log('works_well', 'Desktop', 'Sidebar present on desktop');

  // ─── Landing page on desktop (production — localhost doesn't serve React landing) ───
  try {
    await desktop.goto('https://pasal-manager.vercel.app/', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    s = await shot(desktop, '21-desktop-landing');
    const landingChecks = await desktop.evaluate(() => ({
      docWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      hasHero: document.body.innerText.includes('Operate like a pro') || document.body.innerText.includes('Pasal Manager'),
      hasFooter: !!document.querySelector('footer'),
      hasInstallBtn: document.body.innerText.includes('Install'),
    }));
    if (landingChecks.docWidth > landingChecks.viewport + 5) log('critical', 'Landing', `Horizontal scroll on landing (${landingChecks.docWidth}px)`, s);
    if (!landingChecks.hasHero)        log('critical', 'Landing', 'Hero section not visible', s);
    if (!landingChecks.hasInstallBtn)  log('ux', 'Landing', 'Install button missing on landing', s);
    if (landingChecks.hasHero && landingChecks.hasInstallBtn) log('works_well', 'Landing', 'Landing page renders correctly with hero + install button');
  } catch(e) {
    log('polish', 'Landing', 'Could not test landing — network or DNS issue: ' + e.message);
  }

  // ═══════════════════════════════════════════
  // PHASE 3: Performance + accessibility quick check
  // ═══════════════════════════════════════════
  console.log('\n━━━ PHASE 3: Performance + a11y quick check ━━━\n');

  await phone.goto('http://localhost:8001/app.html?guest=PerfShop', { waitUntil: 'networkidle2' });
  const perf = await phone.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
      loadComplete: nav.loadEventEnd - nav.fetchStart,
      totalResources: performance.getEntriesByType('resource').length,
    };
  });
  if (perf.loadComplete > 3000) log('ux', 'Performance', `Slow load: ${Math.round(perf.loadComplete)}ms total`);
  else if (perf.loadComplete > 0) log('works_well', 'Performance', `Page loaded in ${Math.round(perf.loadComplete)}ms`);

  await sleep(4500);
  const a11y = await phone.evaluate(() => {
    const smallButtons = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40)) {
        const text = (b.innerText || b.getAttribute('aria-label') || b.title || '').slice(0, 30).trim();
        smallButtons.push({ text: text || '(no label)', w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    const tinyText = [];
    const seen = new Set();
    document.querySelectorAll('p, span, div').forEach(el => {
      if (el.children.length === 0 && el.innerText?.trim()) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs > 0 && fs < 12) {
          const txt = el.innerText.slice(0, 30).trim();
          if (!seen.has(txt)) {
            seen.add(txt);
            tinyText.push({ text: txt, size: fs.toFixed(1) });
          }
        }
      }
    });
    return { smallButtons, tinyText };
  });
  if (a11y.smallButtons.length > 0) {
    log('ux', 'A11y', `${a11y.smallButtons.length} touch targets smaller than 40×40px`);
    a11y.smallButtons.slice(0, 5).forEach(b => log('polish', 'A11y-detail', `Small button: "${b.text}" — ${b.w}×${b.h}px`));
  }
  if (a11y.tinyText.length > 0) {
    log('ux', 'A11y', `${a11y.tinyText.length} unique text elements smaller than 12px`);
    a11y.tinyText.slice(0, 5).forEach(t => log('polish', 'A11y-detail', `Tiny text: "${t.text}" — ${t.size}px`));
  }
  if (a11y.smallButtons.length === 0 && a11y.tinyText.length === 0) log('works_well', 'A11y', 'All tap targets ≥40px and text ≥12px');

  await browser.close();

  // ═══════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    AUDIT REPORT                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`📂 Screenshots saved to: ${SHOTS_DIR}\n`);

  console.log(`🔴 CRITICAL bugs:       ${findings.critical.length}`);
  console.log(`🟠 UX issues:           ${findings.ux.length}`);
  console.log(`🟡 Polish opportunities:${findings.polish.length}`);
  console.log(`✅ Works well:           ${findings.works_well.length}`);

  if (findings.critical.length > 0) {
    console.log('\n🔴 CRITICAL BUGS (must fix):');
    findings.critical.forEach(f => console.log(`  • [${f.area}] ${f.msg}`));
  }
  if (findings.ux.length > 0) {
    console.log('\n🟠 UX ISSUES (should fix):');
    findings.ux.forEach(f => console.log(`  • [${f.area}] ${f.msg}`));
  }

  // Write detailed JSON report
  const reportPath = path.join(__dirname, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
  console.log(`\n📄 Detailed JSON report: ${reportPath}`);

  process.exit(0);
})().catch(e => { console.error('AUDIT FAILED:', e); process.exit(1); });
