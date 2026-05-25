// Verifies the admin dashboard + event tracking are correctly wired:
//   1. OWNER_EMAILS / isOwner() defined and gates the admin menu
//   2. trackEvent() defined and writes to analytics_events
//   3. Key actions (sale/udhaar/stock/return/backup/scanner/bill/login)
//      all fire trackEvent
//   4. _syncAnalyticsUser() upserts to analytics_users on login
//   5. renderAdminDashboard exists and is registered in the page router
//   6. Landing page (index.html) has the lightweight tracking script

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const results = [];
const test = (name, pass, info = '') => {
  results.push({ name, pass, info });
  console.log((pass ? '\x1b[32m✅' : '\x1b[31m❌') + '\x1b[0m ' + name + (info ? ' \x1b[90m— ' + info + '\x1b[0m' : ''));
};

(async () => {
  console.log('\n\x1b[36m━━━ Static: Owner gate + tracking helpers ━━━\x1b[0m');
  const html = fs.readFileSync(path.join(__dirname, 'pasal-manager.html'), 'utf8');

  test('OWNER_EMAILS array defined', /const\s+OWNER_EMAILS\s*=\s*\[/.test(html));
  test('OWNER_EMAILS includes sanjanathakur302@gmail.com',
    /OWNER_EMAILS\s*=\s*\[\s*['"]sanjanathakur302@gmail\.com['"]/.test(html));
  test('isOwner() helper defined', /function\s+isOwner\(\)/.test(html));
  test('trackEvent() async helper defined',
    /async\s+function\s+trackEvent\([^)]*\)/.test(html));
  test('trackEvent writes to analytics_events table',
    /sb\.from\(['"]analytics_events['"]\)\.insert/.test(html));
  test('trackEvent passes user_id', /user_id\s*:\s*currentUser\?\.id/.test(html));
  test('_syncAnalyticsUser() upserts to analytics_users',
    /sb\.from\(['"]analytics_users['"]\)\.upsert/.test(html));
  test('Session-stable _pmSessionId reused for events ↔ visits',
    /window\._pmSessionId/.test(html));

  console.log('\n\x1b[36m━━━ Static: Event tracking points ━━━\x1b[0m');
  const events = [
    // Signup is now fired in 2 places: from afterLogin (after _migrateGuestData)
    // AND from the anonymous-upgrade path. Login is fired via the ternary in afterLogin.
    {name: 'signup',          re: /trackEvent\(['"]signup['"][\s\S]{0,200}?anon_upgrade|wasGuest\s*\?\s*['"]signup['"]/},
    {name: 'login',           re: /wasGuest\s*\?\s*['"]signup['"]\s*:\s*['"]login['"]/},
    {name: 'guest_start',     re: /trackEvent\(['"]guest_start['"]/},
    {name: 'sale_added',      re: /trackEvent\(['"]sale_added['"]/},
    {name: 'udhaar_added',    re: /trackEvent\(['"]udhaar_added['"]/},
    {name: 'stock_added',     re: /trackEvent\(['"]stock_added['"]/},
    {name: 'return_added',    re: /trackEvent\(['"]return_added['"]/},
    {name: 'backup_made',     re: /trackEvent\(['"]backup_made['"]/},
    {name: 'scanner_success', re: /trackEvent\(['"]scanner_success['"]/},
    {name: 'bill_generated',  re: /trackEvent\(['"]bill_generated['"]/},
    {name: 'sign_out',        re: /trackEvent\(['"]sign_out['"]/},
  ];
  for (const e of events) {
    test(`Event "${e.name}" instrumented`, e.re.test(html));
  }

  console.log('\n\x1b[36m━━━ Static: Admin Dashboard wiring ━━━\x1b[0m');
  test('renderAdminDashboard function defined',
    /async\s+function\s+renderAdminDashboard\(/.test(html));
  test('Admin page registered in pages router',
    /admin\s*:\s*renderAdminDashboard/.test(html));
  test('Admin menu item only shown to owners',
    /if\(isOwner\(\)\)\{[\s\S]{0,400}?id:['"]admin['"]/.test(html));
  test('Dashboard non-owner access shows refusal',
    /Admin Dashboard is owner-only/.test(html));
  test('Dashboard fetches analytics_users',
    /sb\.from\(['"]analytics_users['"]\)\.select/.test(html));
  test('Dashboard fetches analytics_events',
    /sb\.from\(['"]analytics_events['"]\)\.select/.test(html));
  test('Dashboard fetches analytics_visits',
    /sb\.from\(['"]analytics_visits['"]\)\.select/.test(html));
  test('Dashboard renders Chart.js charts',
    /new Chart\(/.test(html) && /admin-chart-signups/.test(html));
  test('Dashboard has 6 KPI cards',
    /Total Shops[\s\S]{0,2000}?Active Today[\s\S]{0,500}?Active 7-day[\s\S]{0,500}?Signed up 7d[\s\S]{0,500}?Landing visits 7d[\s\S]{0,500}?Signup rate/.test(html));
  test('Dashboard renders recent signups table',
    /admin-recent-signups/.test(html));
  test('Dashboard renders activity feed',
    /admin-activity-feed/.test(html));
  test('Dashboard renders top active shops',
    /admin-top-shops/.test(html));

  console.log('\n\x1b[36m━━━ Static: Landing page tracking ━━━\x1b[0m');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  test('Landing page imports Supabase client',
    /supabase-js@.*\+esm/.test(indexHtml));
  test('Landing page inserts to analytics_visits',
    /analytics_visits/.test(indexHtml) && /is_landing\s*:\s*true/.test(indexHtml));
  test('Landing page records duration on leave',
    /duration_seconds/.test(indexHtml) && /beforeunload/.test(indexHtml));

  console.log('\n\x1b[36m━━━ Runtime: tracking + owner gate ━━━\x1b[0m');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto('http://localhost:8001/app.html?guest=TestShop', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    const rt = await page.evaluate(() => ({
      hasOwnerArr: Array.isArray(OWNER_EMAILS),
      ownerArrLen: OWNER_EMAILS.length,
      isOwnerFn: typeof isOwner === 'function',
      trackFn: typeof trackEvent === 'function' && trackEvent.constructor.name === 'AsyncFunction',
      syncFn: typeof _syncAnalyticsUser === 'function',
      adminFn: typeof renderAdminDashboard === 'function',
      hasSessionId: typeof window._pmSessionId === 'string' && window._pmSessionId.length > 0,
    }));
    test('Runtime: OWNER_EMAILS is array', rt.hasOwnerArr);
    test('Runtime: OWNER_EMAILS has owner', rt.ownerArrLen >= 1);
    test('Runtime: isOwner() defined', rt.isOwnerFn);
    test('Runtime: trackEvent is async function', rt.trackFn);
    test('Runtime: _syncAnalyticsUser defined', rt.syncFn);
    test('Runtime: renderAdminDashboard defined', rt.adminFn);
    test('Runtime: _pmSessionId initialized', rt.hasSessionId);

    // Guest mode → isOwner() must be false (no currentUser)
    const guestOwner = await page.evaluate(() => isOwner());
    test('Runtime: guest is NOT owner', guestOwner === false);

    // Simulate logged-in non-owner → isOwner() false
    const nonOwner = await page.evaluate(() => {
      currentUser = { id: 'x', email: 'random@example.com' };
      return isOwner();
    });
    test('Runtime: random email is NOT owner', nonOwner === false);

    // Simulate the actual owner email → isOwner() true
    const isOwnerEmail = await page.evaluate(() => {
      currentUser = { id: 'x', email: 'sanjanathakur302@gmail.com' };
      return isOwner();
    });
    test('Runtime: owner email IS recognized', isOwnerEmail === true);

    // Verify trackEvent fires (mock sb.from to capture the insert)
    const captured = await page.evaluate(async () => {
      const calls = [];
      const realFrom = sb.from;
      sb.from = (table) => ({
        insert: async (row) => { calls.push({table, row}); return { error: null }; },
        upsert: async (row, opts) => { calls.push({table, row, op: 'upsert'}); return { error: null }; },
        select: () => ({ eq: () => ({ order: () => ({ then: r => r({data:[]}) }) }), order: () => ({ then: r => r({data:[]}) }) }),
      });
      currentUser = { id: 'test-uid', email: 'test@example.com' };
      await trackEvent('test_event', {foo: 'bar'});
      await _syncAnalyticsUser();
      sb.from = realFrom;
      return {
        eventCall: calls.find(c => c.table === 'analytics_events'),
        userCall:  calls.find(c => c.table === 'analytics_users'),
      };
    });
    test('Runtime: trackEvent inserts into analytics_events',
      !!captured.eventCall && captured.eventCall.row.event_name === 'test_event');
    test('Runtime: trackEvent passes user_id',
      captured.eventCall?.row.user_id === 'test-uid');
    test('Runtime: trackEvent passes event_data',
      captured.eventCall?.row.event_data?.foo === 'bar');
    test('Runtime: _syncAnalyticsUser upserts analytics_users',
      !!captured.userCall && captured.userCall.row.user_id === 'test-uid');

    // Render admin dashboard for owner → loads without error
    const adminRender = await page.evaluate(async () => {
      currentUser = { id: 'owner-uid', email: 'sanjanathakur302@gmail.com' };
      // Mock all the queries so we don't need a real backend
      const realFrom = sb.from;
      sb.from = (table) => {
        const builder = {
          select: (cols) => {
            const chain = {
              order: () => chain,
              limit: () => chain,
              eq: () => chain,
              gte: () => chain,
              then: (resolve) => resolve({ data: [] }),
            };
            return chain;
          },
        };
        return builder;
      };
      goMore('admin');
      await new Promise(r => setTimeout(r, 600));
      sb.from = realFrom;
      const contentEl = document.getElementById('admin-content');
      const loadingEl = document.getElementById('admin-loading');
      return {
        contentVisible: contentEl ? contentEl.style.display !== 'none' : false,
        hasKpis: !!document.getElementById('admin-kpis')?.innerHTML?.length,
        loadingHidden: loadingEl ? loadingEl.style.display === 'none' : true,
      };
    });
    test('Runtime: admin dashboard renders for owner', adminRender.contentVisible);
    test('Runtime: admin KPIs populated', adminRender.hasKpis);

    // Non-owner sees the refusal message
    const refuseTest = await page.evaluate(async () => {
      currentUser = { id: 'nope', email: 'nobody@example.com' };
      goMore('admin');
      await new Promise(r => setTimeout(r, 200));
      return document.getElementById('page-more')?.innerHTML?.includes('owner-only');
    });
    test('Runtime: non-owner sees refusal message', refuseTest);

  } finally {
    await browser.close();
  }

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const allGood = passed === total;
  console.log(`RESULT: ${passed}/${total} admin-dashboard tests passed`);
  if (allGood) console.log('\x1b[42m\x1b[1m 🎉 ADMIN DASHBOARD + EVENT TRACKING VERIFIED \x1b[0m');
  else {
    console.log('\x1b[41m\x1b[1m ❌ SOME CHECKS FAILED \x1b[0m');
    console.log('\nFailed:');
    results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name + (r.info ? ' — ' + r.info : '')));
  }
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  process.exit(allGood ? 0 : 1);
})().catch(e => { console.error('TEST FAIL:', e); process.exit(1); });
