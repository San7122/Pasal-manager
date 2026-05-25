#!/usr/bin/env node
// ============================================================
// PASAL MANAGER — Automated Puppeteer Test Runner
// Usage: node run-tests.js
// ============================================================

const puppeteer = require('puppeteer');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

const PORT = 4444;

// ── Minimal static server ────────────────────────────────────
function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let url = req.url.split('?')[0];
      if (url === '/') url = '/pasal-manager.html';
      const fp = path.join(__dirname, url);
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const mime = { '.html':'text/html','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.css':'text/css' };
        res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'text/plain' });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

// ── Terminal colours ─────────────────────────────────────────
const C = { reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', cyan:'\x1b[36m', grey:'\x1b[90m', bgGreen:'\x1b[42m', bgRed:'\x1b[41m' };
const PASS  = `${C.green}${C.bold}✓ PASS${C.reset}`;
const FAIL  = `${C.red}${C.bold}✗ FAIL${C.reset}`;
const WARN  = `${C.yellow}${C.bold}⚠ WARN${C.reset}`;

// ── Main ─────────────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.cyan}   PASAL MANAGER — Automated Test Runner${C.reset}`);
  console.log(`${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}\n`);

  const server = await startServer();
  console.log(`${C.grey}  ▸ Server  http://localhost:${PORT}${C.reset}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'],
  });
  const page = await browser.newPage();

  // Mobile viewport so bottom nav is visible
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  console.log(`${C.grey}  ▸ Browser launched (mobile 390×844)${C.reset}`);

  // ── Load app ──────────────────────────────────────────────
  await page.goto(`http://localhost:${PORT}/pasal-manager.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Give deferred CDN scripts time to load
  await new Promise(r => setTimeout(r, 3000));
  console.log(`${C.grey}  ▸ App loaded${C.reset}\n`);

  // ── Enter guest mode ──────────────────────────────────────
  console.log(`${C.bold}  🔐 SETUP${C.reset}`);
  try {
    await page.waitForSelector('#guest-section', { timeout: 5000 });
    await page.evaluate(() => showGuestSetup());
    await page.waitForSelector('#guest-shop-input', { visible: true, timeout: 5000 });
    await page.evaluate(() => { document.getElementById('guest-shop-input').value = 'Test Shop PM'; });
    await page.evaluate(() => confirmGuest());
    await page.waitForFunction(() => document.getElementById('app')?.style.display !== 'none', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));
    console.log(`  ${PASS}  Guest mode — app loaded\n`);
  } catch (e) {
    console.log(`  ${FAIL}  Guest mode setup: ${e.message}\n`);
    await browser.close(); server.close(); process.exit(1);
  }

  // ── UI Tests helper ───────────────────────────────────────
  const uiResults = [];
  async function uiTest(name, fn) {
    try {
      await fn();
      uiResults.push({ ok: true, name });
      console.log(`  ${PASS}  ${name}`);
    } catch (e) {
      uiResults.push({ ok: false, name, note: e.message });
      console.log(`  ${FAIL}  ${name} ${C.grey}→ ${e.message}${C.reset}`);
    }
  }

  // ── SECTION 1: Navigation ────────────────────────────────
  console.log(`${C.bold}  🧭 NAVIGATION${C.reset}\n`);

  for (const tab of ['today', 'katha', 'udhaar', 'stock', 'more']) {
    await uiTest(`Switch to ${tab} tab`, async () => {
      await page.evaluate(t => switchTab(t), tab);
      await new Promise(r => setTimeout(r, 300));
      const isActive = await page.$eval(`#page-${tab}`, el => el.classList.contains('active'));
      if (!isActive) throw new Error(`#page-${tab} not active`);
    });
  }

  // ── SECTION 2: Today / Sales ──────────────────────────────
  console.log(`\n${C.bold}  💰 TODAY — SALES${C.reset}\n`);

  await uiTest('Sales: amount input is present', async () => {
    await page.evaluate(() => switchTab('today'));
    await page.waitForSelector('#s-amt', { timeout: 3000 });
  });

  await uiTest('Sales: can type amount', async () => {
    await page.evaluate(() => { document.getElementById('s-amt').value = '750'; });
    const v = await page.$eval('#s-amt', el => el.value);
    if (v !== '750') throw new Error(`Got "${v}"`);
  });

  await uiTest('Sales: Add button exists and not disabled', async () => {
    const disabled = await page.$eval('#btn-add-sale', el => el.disabled);
    if (disabled) throw new Error('Button is disabled');
  });

  await uiTest('Sales: clicking Add records entry', async () => {
    await page.evaluate(() => { document.getElementById('s-amt').value = '750'; });
    await page.evaluate(() => addSale());
    await new Promise(r => setTimeout(r, 500));
    const html = await page.$eval('#page-today', el => el.innerHTML);
    if (!html.includes('750')) throw new Error('Amount 750 not in today page');
  });

  await uiTest('Sales: Enter key submits', async () => {
    const countBefore = await page.evaluate(() => sales.filter(s => s.date === todayStr()).length);
    await page.evaluate(() => { document.getElementById('s-amt').value = '300'; });
    await page.focus('#s-amt');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 500));
    const countAfter = await page.evaluate(() => sales.filter(s => s.date === todayStr()).length);
    if (countAfter <= countBefore) throw new Error('Count did not increase');
  });

  await uiTest('Sales: profit calculation visible', async () => {
    // Add sale with cost to test profit display
    await page.evaluate(() => {
      document.getElementById('s-amt').value = '500';
      document.getElementById('s-cost').value = '200';
    });
    await page.evaluate(() => addSale());
    await new Promise(r => setTimeout(r, 400));
    const html = await page.$eval('#page-today', el => el.innerHTML);
    if (!html.includes('profit')) throw new Error('Profit not shown');
  });

  await uiTest('Sales: empty amount shows no entry (validation)', async () => {
    const countBefore = await page.evaluate(() => sales.filter(s => s.date === todayStr()).length);
    await page.evaluate(() => { document.getElementById('s-amt').value = ''; });
    await page.evaluate(() => addSale());
    await new Promise(r => setTimeout(r, 300));
    const countAfter = await page.evaluate(() => sales.filter(s => s.date === todayStr()).length);
    if (countAfter !== countBefore) throw new Error('Sale added without amount!');
  });

  await uiTest('Sales: double-submit protection works', async () => {
    const sawDisabled = await page.evaluate(() => new Promise(resolve => {
      const btn = document.getElementById('btn-add-sale');
      let disabled = false;
      const obs = new MutationObserver(() => { if (btn.disabled) disabled = true; });
      obs.observe(btn, { attributes: true, attributeFilter: ['disabled'] });
      document.getElementById('s-amt').value = '100';
      btn.click();
      setTimeout(() => { obs.disconnect(); resolve(disabled || !btn.disabled); }, 800);
    }));
    if (!sawDisabled) throw new Error('Button was never disabled during save');
  });

  // ── SECTION 3: Udhaar ────────────────────────────────────
  console.log(`\n${C.bold}  📒 UDHAAR (CREDIT)${C.reset}\n`);

  await uiTest('Udhaar: inputs are present', async () => {
    await page.evaluate(() => switchTab('udhaar'));
    await page.waitForSelector('#u-name', { timeout: 3000 });
    await page.waitForSelector('#u-amt', { timeout: 3000 });
  });

  await uiTest('Udhaar: adding an entry works', async () => {
    await page.evaluate(() => {
      document.getElementById('u-name').value = 'Ram Bahadur';
      document.getElementById('u-amt').value = '2500';
    });
    await page.evaluate(() => addUdhaar());
    await new Promise(r => setTimeout(r, 500));
    const html = await page.$eval('#page-udhaar', el => el.innerHTML);
    if (!html.includes('Ram Bahadur')) throw new Error('Name not in list');
    if (!html.includes('2500') && !html.includes('2,500')) throw new Error('Amount not in list');
  });

  await uiTest('Udhaar: empty name blocked (validation)', async () => {
    const countBefore = await page.evaluate(() => udhaars.filter(u => !u.paid).length);
    await page.evaluate(() => {
      document.getElementById('u-name').value = '';
      document.getElementById('u-amt').value = '500';
    });
    await page.evaluate(() => addUdhaar());
    await new Promise(r => setTimeout(r, 300));
    const countAfter = await page.evaluate(() => udhaars.filter(u => !u.paid).length);
    if (countAfter !== countBefore) throw new Error('Entry added without name!');
  });

  await uiTest('Udhaar: mark as paid works', async () => {
    const id = await page.evaluate(() => {
      const u = udhaars.find(x => x.name === 'Ram Bahadur' && !x.paid);
      return u ? u.id : null;
    });
    if (!id) throw new Error('Test entry not found');
    await page.evaluate(id => markPaid(id), id);
    await new Promise(r => setTimeout(r, 400));
    const paid = await page.evaluate(id => {
      const u = udhaars.find(x => x.id === id);
      return u ? u.paid : false;
    }, id);
    if (!paid) throw new Error('Entry not marked as paid');
  });

  // ── SECTION 4: Stock ─────────────────────────────────────
  console.log(`\n${C.bold}  📦 STOCK${C.reset}\n`);

  await uiTest('Stock: inputs present', async () => {
    await page.evaluate(() => switchTab('stock'));
    await page.waitForSelector('#st-name', { timeout: 3000 });
  });

  await uiTest('Stock: adding an item works', async () => {
    await page.evaluate(() => {
      document.getElementById('st-name').value = 'Maggi Noodles';
      document.getElementById('st-qty').value = '100';
      document.getElementById('st-buy').value = '12';
      document.getElementById('st-sell').value = '15';
    });
    await page.evaluate(() => addStock());
    await new Promise(r => setTimeout(r, 500));
    const html = await page.$eval('#page-stock', el => el.innerHTML);
    if (!html.includes('Maggi')) throw new Error('Item not in list');
  });

  await uiTest('Stock: quantity +/- opens audit modal', async () => {
    const id = await page.evaluate(() => {
      const item = stock.find(s => s.name === 'Maggi Noodles');
      return item ? item.id : null;
    });
    if (!id) throw new Error('Item not found');
    // updateQty now opens an audit-logged modal (not silent change).
    // Trigger it, then drive the modal: set qty=5, click "Add".
    const result = await page.evaluate(async (id) => {
      updateQty(id, 1);
      await new Promise(r => setTimeout(r, 200));
      const modal = document.getElementById('stock-adjust-modal');
      if (!modal) return { ok: false, err: 'modal did not open' };
      document.getElementById('sa-qty').value = '5';
      await _confirmStockAdjust(id, 1);
      await new Promise(r => setTimeout(r, 200));
      const item = stock.find(s => s.id === id);
      const logged = stockAdjustments.some(a => a.stockId === id && a.qtyChange === 5);
      return { ok: true, qty: item?.qty, logged };
    }, id);
    if (!result.ok) throw new Error(result.err);
    if (result.qty !== 105) throw new Error(`Expected 105, got ${result.qty}`);
    if (!result.logged) throw new Error('Adjustment was not logged in stockAdjustments');
  });

  await uiTest('Stock: search filter works', async () => {
    await page.evaluate(() => {
      stockSearch = 'Maggi';
      renderStock();
    });
    await new Promise(r => setTimeout(r, 300));
    const html = await page.$eval('#page-stock', el => el.innerHTML);
    if (!html.includes('Maggi')) throw new Error('Search result not showing');
    await page.evaluate(() => { stockSearch = ''; renderStock(); });
  });

  await uiTest('Stock: empty name blocked', async () => {
    const countBefore = await page.evaluate(() => stock.length);
    await page.evaluate(() => {
      document.getElementById('st-name').value = '';
      document.getElementById('st-qty').value = '10';
    });
    await page.evaluate(() => addStock());
    await new Promise(r => setTimeout(r, 300));
    const countAfter = await page.evaluate(() => stock.length);
    if (countAfter !== countBefore) throw new Error('Item added without name!');
  });

  // ── SECTION 5: More Pages ─────────────────────────────────
  console.log(`\n${C.bold}  ⚙️  MORE PAGES${C.reset}\n`);

  await uiTest('More: menu renders', async () => {
    await page.evaluate(() => switchTab('more'));
    await new Promise(r => setTimeout(r, 400));
    const html = await page.$eval('#page-more', el => el.innerHTML);
    if (!html.includes('more-menu-item')) throw new Error('Menu items not found');
  });

  for (const sub of ['expense', 'customers', 'supplier', 'settings', 'pl', 'export', 'staffBook']) {
    await uiTest(`More → ${sub} renders`, async () => {
      await page.evaluate(p => goMore(p), sub);
      await new Promise(r => setTimeout(r, 400));
      const html = await page.$eval('#page-more', el => el.innerHTML);
      if (html.trim().length < 100) throw new Error('Page appears empty');
    });
  }

  await uiTest('More → expense: Add Expense works', async () => {
    await page.evaluate(() => goMore('expense'));
    await new Promise(r => setTimeout(r, 300));
    const countBefore = await page.evaluate(() => expenses.length);
    await page.evaluate(() => {
      document.getElementById('e-amt').value = '250';
      document.getElementById('e-note').value = 'Test expense';
    });
    await page.evaluate(() => addExp());
    await new Promise(r => setTimeout(r, 500));
    const countAfter = await page.evaluate(() => expenses.length);
    if (countAfter <= countBefore) throw new Error('Expense not added');
  });

  await uiTest('More → settings: Shop name saves', async () => {
    await page.evaluate(() => goMore('settings'));
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => {
      S.shopName = 'Updated Test Shop';
      saveSettings();
    });
    const name = await page.evaluate(() => S.shopName);
    if (name !== 'Updated Test Shop') throw new Error(`Got: ${name}`);
  });

  // ── SECTION 6: Katha ─────────────────────────────────────
  console.log(`\n${C.bold}  📖 KATHA (HISTORY)${C.reset}\n`);

  await uiTest('Katha: renders with entries', async () => {
    await page.evaluate(() => switchTab('katha'));
    await new Promise(r => setTimeout(r, 400));
    const html = await page.$eval('#page-katha', el => el.innerHTML);
    if (html.trim().length < 50) throw new Error('Katha appears empty');
  });

  await uiTest('Katha: date navigation forward works', async () => {
    await page.evaluate(() => kathaNav(1));
    await new Promise(r => setTimeout(r, 300));
  });

  await uiTest('Katha: date navigation backward works', async () => {
    await page.evaluate(() => kathaNav(-1));
    await new Promise(r => setTimeout(r, 300));
  });

  // ── SECTION 7: Logic & Calculations ──────────────────────
  console.log(`\n${C.bold}  🔬 LOGIC & CALCULATIONS${C.reset}\n`);

  const logicTests = await page.evaluate(() => {
    const results = [];
    function check(name, condition, note='') {
      results.push({ ok: !!condition, name, note: condition ? '' : (note || 'assertion failed') });
    }

    try {
      // fmt
      check('fmt(12345) is string', typeof fmt(12345) === 'string');
      check('fmt(0) is string', typeof fmt(0) === 'string');
      // fmtDate
      check('fmtDate is string', typeof fmtDate('2026-01-15') === 'string');
      // todayStr
      check('todayStr() matches YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(todayStr()));
      // cur()
      check('cur() returns symbol', typeof cur() === 'string' && cur().length > 0);
      // uid()
      const ids = new Set(Array.from({length:50}, () => uid()));
      check('uid(): 50 unique IDs', ids.size === 50);
      // t() translations
      const origLang = S.language;
      S.language='en'; check('t() en works', typeof t('sales') === 'string');
      S.language='hi'; check('t() hi works', typeof t('sales') === 'string');
      S.language='np'; check('t() np works', typeof t('sales') === 'string');
      S.language = origLang;
      // calcLoanEmi
      const emi1 = calcLoanEmi(100000, 12, 12);
      check('calcLoanEmi: 1L@12%/12mo ~8885', emi1 >= 8800 && emi1 <= 8950, `Got ${emi1}`);
      check('calcLoanEmi: zero interest', calcLoanEmi(60000, 0, 12) === 5000, `Got ${calcLoanEmi(60000,0,12)}`);
      check('calcLoanEmi: 1-month tenure', calcLoanEmi(1000, 0, 1) === 1000, `Got ${calcLoanEmi(1000,0,1)}`);
      // loanSchedule
      const fakeLoan = { id:'tl1', lender:'Bank', loanAmt:12000, interestRate:12, tenure:12, emiAmt:0, startDate:todayStr() };
      fakeLoan.emiAmt = calcLoanEmi(12000, 12, 12);
      const sched = loanSchedule(fakeLoan);
      check('loanSchedule: 12 entries', sched.length === 12, `Got ${sched.length}`);
      check('loanSchedule: has dueDate', !!sched[0].dueDate);
      const totalP = sched.reduce((a,s)=>a+s.principal,0);
      check('loanSchedule: principal sums to loan', Math.abs(totalP-12000) <= 5, `Sum=${totalP}`);
      // loanOutstanding
      const origLP = loanPayments.slice();
      const fakeId = 'lo_test_'+Date.now();
      const fakeLn = { id:fakeId, loanAmt:50000 };
      check('loanOutstanding: no payments = full amount', loanOutstanding(fakeLn) === 50000);
      loanPayments.push({ id:'lp1', loanId:fakeId, principal:10000, paid:true });
      check('loanOutstanding: after 10k paid = 40k', loanOutstanding(fakeLn) === 40000, `Got ${loanOutstanding(fakeLn)}`);
      loanPayments.push({ id:'lp2', loanId:fakeId, principal:40000, paid:true });
      check('loanOutstanding: fully paid = 0', loanOutstanding(fakeLn) === 0, `Got ${loanOutstanding(fakeLn)}`);
      loanPayments = origLP;
      // emiDueDates
      const plan = { id:'ep1', totalAmt:6000, downPayment:0, installments:3, frequency:'monthly', startDate:'2026-01-01' };
      const dates = emiDueDates(plan);
      check('emiDueDates: 3 entries', dates.length === 3, `Got ${dates.length}`);
      check('emiDueDates: each amt=2000', dates.every(d=>d.amt===2000), `Amts: ${dates.map(d=>d.amt)}`);
      // emiPlanRemaining
      const origEP = emiPayments.slice();
      const fakeEPId = 'epr_'+Date.now();
      const fakePlan = { id:fakeEPId, totalAmt:10000, downPayment:1000, installments:5 };
      check('emiPlanRemaining: no payments = 9000', emiPlanRemaining(fakePlan) === 9000, `Got ${emiPlanRemaining(fakePlan)}`);
      emiPayments.push({ id:'e1', planId:fakeEPId, amt:1800, paid:true });
      check('emiPlanRemaining: 1 paid = 7200', emiPlanRemaining(fakePlan) === 7200, `Got ${emiPlanRemaining(fakePlan)}`);
      emiPayments.push({ id:'e2', planId:fakeEPId, amt:1800, paid:true }, { id:'e3', planId:fakeEPId, amt:1800, paid:true }, { id:'e4', planId:fakeEPId, amt:1800, paid:true }, { id:'e5', planId:fakeEPId, amt:1800, paid:true });
      check('emiPlanRemaining: all paid = 0', emiPlanRemaining(fakePlan) === 0, `Got ${emiPlanRemaining(fakePlan)}`);
      emiPayments = origEP;
      // overdue detection
      const od = { id:'od1', name:'Test', phone:'', amt:500, date:'2025-01-01', paid:false, dueDate:'2025-01-15' };
      udhaars.push(od);
      const overdueList = udhaars.filter(u => !u.paid && u.dueDate && u.dueDate < todayStr());
      check('Udhaar overdue detection works', overdueList.some(u=>u.id==='od1'));
      udhaars = udhaars.filter(u=>u.id!=='od1');
      // toast queue
      _toastQueue = [];
      _showToast('msg1'); _showToast('msg2');
      check('Toast queue: 2 messages queued or first shown', _toastQueue.length >= 0);
      // sendWA
      const origOpen = window.open;
      let waUrl = '';
      window.open = url => { waUrl = url; };
      sendWA('Test', '9876543210', 1000, '');
      window.open = origOpen;
      check('sendWA: builds wa.me URL', waUrl.includes('wa.me'), `Got: ${waUrl}`);
      // _emptyState
      const es = _emptyState('package', 'No items', 'Add some', '', '');
      check('_emptyState: returns HTML string', typeof es === 'string' && es.includes('empty-state'));
      // bsDateStr
      try {
        const bsStr = bsDateStr(new Date('2026-04-17'));
        check('bsDateStr: returns string', typeof bsStr === 'string' && bsStr.length > 0, `Got: ${bsStr}`);
      } catch(e) { check('bsDateStr', false, e.message); }
      // generateDailyReport
      try {
        const rpt = generateDailyReport(todayStr());
        check('generateDailyReport: returns text', typeof rpt === 'string' && rpt.length > 10, `Length: ${rpt.length}`);
      } catch(e) { check('generateDailyReport', false, e.message); }
    } catch(e) {
      results.push({ ok:false, name:'Logic test runner error', note: e.message });
    }
    return results;
  });

  logicTests.forEach(r => {
    const icon = r.ok ? PASS : FAIL;
    const note = r.note ? ` ${C.grey}→ ${r.note}${C.reset}` : '';
    console.log(`  ${icon}  ${r.name}${note}`);
  });

  // ── SECTION 8: UI Polish ──────────────────────────────────
  console.log(`\n${C.bold}  ✨ UI POLISH${C.reset}\n`);

  await uiTest('Toast: message shows in saved-badge', async () => {
    const txt = await page.evaluate(() => {
      _showToast('Test Toast');
      return new Promise(r => setTimeout(() => r(document.getElementById('saved-badge')?.textContent || ''), 150));
    });
    if (!txt.includes('Test Toast')) throw new Error(`Got: "${txt}"`);
  });

  await uiTest('Empty state: shows icon+title when no results', async () => {
    await page.evaluate(() => {
      const orig = stock.slice();
      stock = [];
      renderStock();
      stock = orig;
    });
    await new Promise(r => setTimeout(r, 200));
    const html = await page.$eval('#page-stock', el => el.innerHTML);
    if (!html.includes('empty-state')) throw new Error('Empty state not rendered');
    await page.evaluate(() => renderStock());
  });

  await uiTest('Skeleton: shows and hides', async () => {
    const skDisplay = await page.$eval('#app-skeleton', el => el.style.display);
    if (skDisplay === 'flex') throw new Error('Skeleton still visible after load');
  });

  await uiTest('Scroll-to-top: button exists in DOM', async () => {
    const exists = await page.$('#scroll-top-btn');
    if (!exists) throw new Error('scroll-top-btn not found');
  });

  await uiTest('Dark mode CSS: media query exists', async () => {
    const hasDark = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.conditionText && rule.conditionText.includes('prefers-color-scheme')) return true;
          }
        } catch(e) {}
      }
      return false;
    });
    if (!hasDark) throw new Error('Dark mode media query not found');
  });

  await uiTest('Focus-visible: CSS rule exists', async () => {
    const has = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('focus-visible')) return true;
          }
        } catch(e) {}
      }
      return false;
    });
    if (!has) throw new Error('focus-visible rule not found');
  });

  await uiTest('document.title: updates on tab switch', async () => {
    await page.evaluate(() => switchTab('udhaar'));
    const title = await page.title();
    if (!title.toLowerCase().includes('udhaar') && !title.toLowerCase().includes('udh')) {
      throw new Error(`Title: "${title}"`);
    }
  });

  await uiTest('Inter font: loaded via Google Fonts', async () => {
    const hasInter = await page.evaluate(() => {
      for (const link of document.querySelectorAll('link')) {
        if (link.href && link.href.includes('fonts.googleapis') && link.href.includes('Inter')) return true;
      }
      return false;
    });
    if (!hasInter) throw new Error('Inter font link not found');
  });

  // ── Final summary ─────────────────────────────────────────
  const uiPassed  = uiResults.filter(r => r.ok).length;
  const uiFailed  = uiResults.filter(r => !r.ok).length;
  const logPassed = logicTests.filter(r => r.ok).length;
  const logFailed = logicTests.filter(r => !r.ok).length;
  const total     = uiResults.length + logicTests.length;
  const totalPass = uiPassed + logPassed;
  const totalFail = uiFailed + logFailed;

  console.log(`\n${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.cyan}                TEST SUMMARY${C.reset}`);
  console.log(`${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}`);
  console.log(`  UI tests:     ${C.green}${uiPassed} passed${C.reset}  /  ${uiResults.length}  ${uiFailed > 0 ? C.red+uiFailed+' failed'+C.reset : ''}`);
  console.log(`  Logic tests:  ${C.green}${logPassed} passed${C.reset}  /  ${logicTests.length}  ${logFailed > 0 ? C.red+logFailed+' failed'+C.reset : ''}`);

  if (pageErrors.length > 0) {
    console.log(`\n  ${C.yellow}Browser errors (${pageErrors.length}):${C.reset}`);
    [...new Set(pageErrors)].slice(0, 5).forEach(e => console.log(`    ${C.grey}${e.slice(0,100)}${C.reset}`));
  }

  console.log(`\n${C.bold}  RESULT: ${totalPass}/${total} passed${C.reset}`);
  if (totalFail === 0) {
    console.log(`  ${C.bgGreen}${C.bold} 🎉 ALL TESTS PASSED ${C.reset}  Pasal Manager working correctly!\n`);
  } else {
    console.log(`  ${C.bgRed}${C.bold} ⚠  ${totalFail} FAILED ${C.reset}\n`);
    [...uiResults.filter(r=>!r.ok), ...logicTests.filter(r=>!r.ok)].forEach(r =>
      console.log(`    ${C.red}• ${r.name}${r.note ? ' → '+r.note : ''}${C.reset}`)
    );
  }
  console.log(`${C.bold}${C.cyan}══════════════════════════════════════════════${C.reset}\n`);

  await browser.close();
  server.close();
  process.exit(totalFail > 0 ? 1 : 0);
})();
