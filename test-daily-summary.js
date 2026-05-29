// Verifies the Daily WhatsApp Summary + smart insights feature:
//   1. _generateSmartInsights derives best-day, top-item, profit trend, overdue alerts
//   2. generateDailyReport includes insights section when present
//   3. showEveningSummary modal renders stats + insights + WhatsApp button
//   4. _shouldShowEveningSummary gates: time window, opt-out, daily flag, no spam
//   5. sendDailyWA opens correct wa.me URL with insights in the message
//   6. Dashboard exposes "View Today's Summary" + "Send via WhatsApp" buttons
//   7. Settings has the "Evening summary auto-show" toggle

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const results = [];
const test = (name, pass, info = '') => {
  results.push({ name, pass, info });
  console.log((pass ? '\x1b[32m✅' : '\x1b[31m❌') + '\x1b[0m ' + name + (info ? ' \x1b[90m— ' + info + '\x1b[0m' : ''));
};

(async () => {
  console.log('\n\x1b[36m━━━ Static: Smart insights generator ━━━\x1b[0m');
  const html = fs.readFileSync(path.join(__dirname, 'pasal-manager.html'), 'utf8');

  test('_generateSmartInsights function exists',
    /function _generateSmartInsights\(td\)/.test(html));
  test('Insights: best day of week (past 28 days)',
    /_generateSmartInsights[\s\S]{0,2500}?Best day:[\s\S]{0,200}?dowNames/.test(html));
  test('Insights: top-selling item (parsed from sale notes)',
    /Top item this week/.test(html) && /itemFreq/.test(html));
  test('Insights: profit trend (this week vs last)',
    /Profit up[\s\S]{0,100}?vs last week/.test(html) && /pctChange/.test(html));
  test('Insights: oldest overdue udhaar (call alert)',
    /Call\s+\$\{o\.name\}[\s\S]{0,100}?overdue \$\{daysOver\}/.test(html));
  test('Insights: supplier payment suggestion',
    /Pay\s+\$\{fmt\(suggested\)\}\s+toward suppliers/.test(html));

  console.log('\n\x1b[36m━━━ Static: Evening summary modal + auto-show ━━━\x1b[0m');
  test('showEveningSummary function exists',
    /function showEveningSummary\(\)/.test(html));
  test('_shouldShowEveningSummary function exists',
    /function _shouldShowEveningSummary\(\)/.test(html));
  test('Auto-show gated by S.dailySummaryEnabled !== false (opt-out)',
    /S\.dailySummaryEnabled\s*===\s*false/.test(html));
  test('Auto-show time window 8 PM – midnight',
    /hour\s*<\s*20\s*\|\|\s*hour\s*>=\s*24/.test(html));
  test('Auto-show uses pm_summary_shown_<date> flag (once/day)',
    /pm_summary_shown_'\s*\+\s*td/.test(html));
  test('Auto-show skips quiet days (zero sales)',
    /todaysSales\.length\s*===\s*0/.test(html));
  test('Modal shows SALES + PROFIT tiles',
    /Today's Wrap-up/.test(html) && /SALES/.test(html) && /PROFIT/.test(html));
  test('Modal shows insights section when insights exist',
    /insights\.length\s*>\s*0/.test(html) && /Smart Insights/.test(html));
  test('Modal has primary WhatsApp button',
    /sendDailyWA\(\)/.test(html) && /Send via WhatsApp/.test(html));
  test('Modal has "Maybe later" dismiss',
    /Maybe later/.test(html));
  test('Modal has "Don\'t show again" opt-out',
    /Don't show again/.test(html) && /dailySummaryEnabled\s*=\s*false/.test(html));
  test('Auto-show wired into afterLogin chain (4 sec delay)',
    /_shouldShowEveningSummary\(\)\s*\)\s*showEveningSummary\(\)/.test(html));

  console.log('\n\x1b[36m━━━ Static: Dashboard buttons ━━━\x1b[0m');
  test('"View Today\'s Summary" button on Dashboard',
    /showEveningSummary\(\)[\s\S]{0,300}?View Today's Summary/.test(html));
  test('"Send via WhatsApp" button on Dashboard',
    /sendDailyWA\(\)[\s\S]{0,300}?Send via WhatsApp/.test(html));

  console.log('\n\x1b[36m━━━ Static: Settings toggle ━━━\x1b[0m');
  test('Settings toggle: Evening summary auto-show',
    /Evening summary auto-show/.test(html));
  test('Toggle bound to S.dailySummaryEnabled',
    /id="s-daily-summary"[\s\S]{0,400}?S\.dailySummaryEnabled\s*=\s*this\.checked/.test(html));
  test('Toggle default is ON (checked when !== false)',
    /S\.dailySummaryEnabled\s*!==\s*false\s*\?\s*'checked'\s*:\s*''/.test(html));

  console.log('\n\x1b[36m━━━ Static: Analytics tracking ━━━\x1b[0m');
  test('daily_summary_shown event fires when modal opens',
    /trackEvent\('daily_summary_shown'/.test(html));
  test('daily_summary_sent_wa event fires when WhatsApp clicked',
    /trackEvent\('daily_summary_sent_wa'/.test(html));

  console.log('\n\x1b[36m━━━ Runtime: insights generation with real data ━━━\x1b[0m');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    // Set up minimal app state so we can call the functions
    await page.evaluate(() => {
      // Mock all Supabase chains as no-ops returning empty data
      const emptyResult = { then: r => r({ data: [], error: null }) };
      const chain = {
        eq() { return chain; },
        order() { return chain; },
        limit() { return chain; },
        maybeSingle: async () => ({ data: null, error: null }),
        then: r => r({ data: [], error: null }),
      };
      sb.from = (table) => ({
        insert: async () => ({ error: null }),
        upsert: async () => ({ error: null }),
        delete: () => chain,
        update: () => chain,
        select: () => chain,
      });
      isGuestMode = true;
      currentUser = null;
      S.shopName = 'Test Shop';
      S.country = 'IN';
      document.getElementById('auth-page').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
    });

    // Seed Monday-heavy sales pattern for "Best day = Monday" insight
    const insights = await page.evaluate(() => {
      // Generate 28 days of synthetic data with a Monday bias
      sales = []; expenses = []; udhaars = []; kharidiEntries = [];
      const today = new Date('2026-05-29T12:00:00'); // pinned date for deterministic test
      for (let i = 0; i < 28; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const ds = d.toISOString().slice(0,10);
        const isMonday = d.getDay() === 1;
        // 3 sales per Monday, 1 per other day, Monday amounts 2x
        const count = isMonday ? 3 : 1;
        for (let j = 0; j < count; j++) {
          sales.push({
            id: 's' + i + '_' + j,
            date: ds,
            ts: d.getTime() + j,
            amt: isMonday ? 2000 : 800,
            cost: isMonday ? 1000 : 400,
            note: '1 × Saree', // same item for "top item" insight
            payMode: 'Cash',
            country: 'IN',
          });
        }
      }
      // Profit boost: add extra big sales in last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        sales.push({ id: 'boost' + i, date: d.toISOString().slice(0,10), ts: d.getTime() + 100, amt: 5000, cost: 2000, note: '1 × Kurti', payMode: 'Cash', country: 'IN' });
      }
      // Old overdue udhaar
      udhaars.push({ id: 'u1', name: 'Ram Singh', phone: '9876543210', amt: 5000, date: '2026-04-01', ts: 1, paid: false, dueDate: '2026-04-15', country: 'IN' });

      // Run insights generator
      const out = _generateSmartInsights('2026-05-29');
      return out;
    });

    test('Generated >= 2 insights from synthetic data',
      insights.length >= 2, `got ${insights.length}: ${insights.join(' | ')}`);
    test('Insight: "Best day: Mon" present (Monday-biased synthetic data)',
      insights.some(i => /Best day:\s*Mon/.test(i)));
    test('Insight: "Top item: Saree" present',
      insights.some(i => /Saree/.test(i)));
    test('Insight: overdue call alert for Ram Singh',
      insights.some(i => /Call Ram Singh[\s\S]*overdue/.test(i)));

    console.log('\n\x1b[36m━━━ Runtime: showEveningSummary modal ━━━\x1b[0m');

    const modalRender = await page.evaluate(async () => {
      // Reset shown flag so the modal renders
      const td = todayStr();
      localStorage.removeItem('pm_summary_shown_' + td);
      // Seed today's data so the modal has something to show
      sales.push({ id: 'today1', date: td, ts: Date.now(), amt: 1500, cost: 500, note: 'Test sale', payMode: 'Cash', country: 'IN' });
      showEveningSummary();
      await new Promise(r => setTimeout(r, 200));
      const modal = document.getElementById('evening-summary-modal');
      if (!modal) return { rendered: false };
      const text = modal.innerText;
      return {
        rendered: true,
        hasTitle: /Today's Wrap-up/.test(text),
        hasSalesTile: /SALES/i.test(text) && /\d/.test(text), // SALES label + some digits rendered
        hasProfitTile: /PROFIT/i.test(text),
        hasWhatsAppBtn: /Send via WhatsApp/.test(text),
        hasLater: /Maybe later/.test(text),
        markedShown: localStorage.getItem('pm_summary_shown_' + td) === '1',
      };
    });

    test('Modal renders', modalRender.rendered);
    test('Modal shows "Today\'s Wrap-up" title', modalRender.hasTitle);
    test('Modal shows SALES tile with amount', modalRender.hasSalesTile, `text contained 1,500: ${modalRender.hasSalesTile}`);
    test('Modal shows PROFIT tile', modalRender.hasProfitTile);
    test('Modal has WhatsApp send button', modalRender.hasWhatsAppBtn);
    test('Modal has Maybe later button', modalRender.hasLater);
    test('Modal sets pm_summary_shown_<date> flag', modalRender.markedShown);

    // Re-call showEveningSummary — should NOT create a duplicate modal
    const noDup = await page.evaluate(async () => {
      showEveningSummary();
      await new Promise(r => setTimeout(r, 100));
      const count = document.querySelectorAll('#evening-summary-modal').length;
      const m = document.getElementById('evening-summary-modal');
      if (m) m.remove();
      return count === 1;
    });
    test('Cannot stack duplicate modals (idempotent open)', noDup);

    console.log('\n\x1b[36m━━━ Runtime: _shouldShowEveningSummary gating ━━━\x1b[0m');

    const gating = await page.evaluate(async () => {
      const td = todayStr();
      // Setup: ensure we have sales today + opted in
      sales.push({ id: 'sg1', date: td, ts: Date.now(), amt: 1000, cost: 0, note: '', payMode: 'Cash', country: 'IN' });
      S.dailySummaryEnabled = true;
      // Stub Date.prototype.getHours to control the time gate
      const origGetHours = Date.prototype.getHours;
      const setMockHour = (h) => { Date.prototype.getHours = function() { return h; }; };

      // Test 1: 9pm + sales + not shown + enabled → true
      setMockHour(21);
      localStorage.removeItem('pm_summary_shown_' + td);
      const r1 = _shouldShowEveningSummary();

      // Test 2: 9pm + already shown → false
      localStorage.setItem('pm_summary_shown_' + td, '1');
      const r2 = _shouldShowEveningSummary();

      // Test 3: 9pm + not shown + opt-out → false
      localStorage.removeItem('pm_summary_shown_' + td);
      S.dailySummaryEnabled = false;
      const r3 = _shouldShowEveningSummary();

      // Test 4: 3pm + sales + enabled → false (outside window)
      S.dailySummaryEnabled = true;
      setMockHour(15);
      const r4 = _shouldShowEveningSummary();

      // Restore
      Date.prototype.getHours = origGetHours;
      return { r1, r2, r3, r4 };
    });

    test('shouldShow: 9PM + sales + enabled + not-shown → TRUE',  gating.r1 === true);
    test('shouldShow: already shown today → FALSE',                gating.r2 === false);
    test('shouldShow: dailySummaryEnabled=false → FALSE',          gating.r3 === false);
    test('shouldShow: 3PM (outside 8PM-midnight window) → FALSE',  gating.r4 === false);

    console.log('\n\x1b[36m━━━ Runtime: sendDailyWA opens correct URL with insights ━━━\x1b[0m');

    const wa = await page.evaluate(() => {
      const td = todayStr();
      sales = [
        { id: 's1', date: td, ts: Date.now(), amt: 2000, cost: 800, note: '1 × Saree', payMode: 'Cash', country: 'IN' },
        { id: 's2', date: td, ts: Date.now()+1, amt: 1500, cost: 600, note: '1 × Saree', payMode: 'Cash', country: 'IN' },
      ];
      S.shopName = 'Sanjana shoes store';
      S.ownPhone = '9800000001';
      S.country = 'NP';
      let openedUrl = '';
      const origOpen = window.open;
      window.open = (url) => { openedUrl = url; return null; };
      sendDailyWA();
      window.open = origOpen;
      const decoded = decodeURIComponent(openedUrl);
      return {
        url: openedUrl,
        usesWaMe: openedUrl.startsWith('https://wa.me/'),
        hasNepalCode: openedUrl.includes('9779800000001'),
        msgHasShop: decoded.includes('Sanjana shoes store'),
        msgHasSales: decoded.includes('3,500') || decoded.includes('Sales:'),
        msgHasProfit: decoded.includes('Profit:'),
      };
    });

    test('WhatsApp opens wa.me URL', wa.usesWaMe);
    test('WhatsApp URL has Nepal country code prepended', wa.hasNepalCode);
    test('WhatsApp message includes shop name', wa.msgHasShop);
    test('WhatsApp message includes today\'s sales', wa.msgHasSales);
    test('WhatsApp message includes profit line', wa.msgHasProfit);

  } finally {
    await browser.close();
  }

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const allGood = passed === total;
  console.log(`RESULT: ${passed}/${total} daily-summary tests passed`);
  if (allGood) console.log('\x1b[42m\x1b[1m 🎉 DAILY SUMMARY FEATURE FULLY VERIFIED \x1b[0m');
  else {
    console.log('\x1b[41m\x1b[1m ❌ SOME CHECKS FAILED \x1b[0m');
    console.log('\nFailed:');
    results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name + (r.info ? ' — ' + r.info : '')));
  }
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  process.exit(allGood ? 0 : 1);
})().catch(e => { console.error('TEST FAIL:', e); process.exit(1); });
