// Verifies the offline-first sync flow:
//   1. Full _migrateGuestData covers all 18 tables (not just 4)
//   2. saveSettings queues to _wq on failure (and includes Nepal fields)
//   3. _wqFlush handles 'upsert' op type (for settings)
//   4. Offline badge appears when offline / queue non-empty
//   5. window 'online' event triggers flush + loadAll refresh

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const results = [];
const test = (name, pass, info = '') => {
  results.push({ name, pass, info });
  console.log((pass ? '\x1b[32m✅' : '\x1b[31m❌') + '\x1b[0m ' + name + (info ? ' \x1b[90m— ' + info + '\x1b[0m' : ''));
};

(async () => {
  console.log('\n\x1b[36m━━━ Static: _migrateGuestData covers all tables ━━━\x1b[0m');
  const html = fs.readFileSync(path.join(__dirname, 'pasal-manager.html'), 'utf8');

  // Pull out the body of _migrateGuestData
  const migrate = html.match(/async function _migrateGuestData[\s\S]+?\n\}/)?.[0] || '';
  const tables = [
    'pm_sales','pm_expenses','pm_udhaar','pm_stock','pm_suppliers',
    'pm_customers','pm_staff','pm_staff_entries','pm_returns','pm_cashbook',
    'pm_kharidi','pm_dealers','pm_dealer_entries','pm_gst_bills','pm_branches',
    'pm_emi_plans','pm_emi_payments','pm_loans','pm_loan_payments',
  ];
  for (const t of tables) {
    test(`Migration includes ${t}`, migrate.includes(`'${t}'`));
  }
  test('Migration uses upsert (not insert) for idempotency',
    /sb\.from\(table\)\.upsert\(mapped,\s*\{onConflict:'id'\}\)/.test(migrate));
  test('Migration queues failed rows via _wqPush',
    /_wqPush\(\{type:'insert',\s*table,\s*row\}\)/.test(migrate));
  test('Migration also pushes settings via saveSettings()',
    /await saveSettings\(\)/.test(migrate));
  test('Migration shows toast with row count', /_showToast\(`✓ \$\{totalMigrated\}/.test(migrate));

  console.log('\n\x1b[36m━━━ Static: saveSettings includes Nepal fields + queues on failure ━━━\x1b[0m');
  const saveSet = html.match(/async function saveSettings\(\)[\s\S]+?\n\}/)?.[0] || '';
  test('saveSettings includes np_payment_id', /np_payment_id\s*:\s*S\.npPaymentId/.test(saveSet));
  test('saveSettings includes esewa_id',     /esewa_id\s*:\s*S\.esewaId/.test(saveSet));
  test('saveSettings includes khalti_id',    /khalti_id\s*:\s*S\.khaltiId/.test(saveSet));
  test('saveSettings includes upi_id',       /upi_id\s*:\s*S\.upiId/.test(saveSet));
  test('saveSettings has fallback upsert without optional cols',
    /delete fallback\.np_payment_id/.test(saveSet) && /delete fallback\.esewa_id/.test(saveSet));
  test('saveSettings queues failure via _wqPush as upsert op',
    /_wqPush\(\{type:'upsert',\s*table:'pm_settings'/.test(saveSet));

  console.log('\n\x1b[36m━━━ Static: _wqFlush handles upsert + triggers loadAll on reconnect ━━━\x1b[0m');
  const wqFlush = html.match(/async function _wqFlush[\s\S]+?\n\}/)?.[0] || '';
  test('_wqFlush handles upsert op type', /op\.type==='upsert'/.test(wqFlush));
  const onlineHandler = html.match(/window\.addEventListener\('online'[\s\S]+?\}\);/)?.[0] || '';
  test('online event triggers _wqFlush', /_wqFlush\(\)/.test(onlineHandler));
  test('online event triggers loadAll for fresh data',
    /loadAll\(\)/.test(onlineHandler) && /renderTab\(\)/.test(onlineHandler));
  test('offline event also wired',
    /window\.addEventListener\('offline'/.test(html));

  console.log('\n\x1b[36m━━━ Static: Offline badge ━━━\x1b[0m');
  test('_updateOfflineBadge function defined', /function _updateOfflineBadge\(\)/.test(html));
  test('Badge shows "Offline" when navigator.onLine is false',
    /navigator\.onLine[\s\S]{0,500}?Offline/.test(html));
  test('Badge shows queue count when items pending',
    /waiting to sync/.test(html) && /Syncing \$\{queued\}/.test(html));
  test('Badge initialized after login via setTimeout',
    /setTimeout\(_updateOfflineBadge/.test(html));

  console.log('\n\x1b[36m━━━ Static: loadAll reads Nepal fields from cloud ━━━\x1b[0m');
  test('loadAll merges d.np_payment_id from server',
    /npPaymentId\s*:\s*d\.np_payment_id\s*\|\|\s*_localOnly\.npPaymentId/.test(html));
  test('loadAll merges d.esewa_id from server',
    /esewaId\s*:\s*d\.esewa_id\s*\|\|\s*_localOnly\.esewaId/.test(html));
  test('loadAll merges d.khalti_id from server',
    /khaltiId\s*:\s*d\.khalti_id\s*\|\|\s*_localOnly\.khaltiId/.test(html));

  console.log('\n\x1b[36m━━━ Runtime: offline → queue → online → flush ━━━\x1b[0m');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 900, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:8001/app.html?guest=TestShop', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    // Verify the offline-queue runtime API exists
    const apis = await page.evaluate(() => ({
      hasWqLoad: typeof _wqLoad === 'function',
      hasWqPush: typeof _wqPush === 'function',
      hasWqFlush: typeof _wqFlush === 'function',
      hasBadgeFn: typeof _updateOfflineBadge === 'function',
    }));
    test('Runtime: _wqLoad defined', apis.hasWqLoad);
    test('Runtime: _wqPush defined', apis.hasWqPush);
    test('Runtime: _wqFlush defined', apis.hasWqFlush);
    test('Runtime: _updateOfflineBadge defined', apis.hasBadgeFn);

    // Simulate offline: push something to queue, verify badge appears
    const badgeFlow = await page.evaluate(async () => {
      // Clear queue first
      localStorage.removeItem('pm_write_queue');
      // Queue a fake offline write
      _wqPush({type:'insert', table:'pm_sales', row:{id:'x', user_id:'u', amt:100, date:'2026-05-25', ts:Date.now()}});
      _wqPush({type:'insert', table:'pm_sales', row:{id:'y', user_id:'u', amt:200, date:'2026-05-25', ts:Date.now()}});
      _updateOfflineBadge();
      await new Promise(r => setTimeout(r, 200));
      const el = document.getElementById('offline-badge');
      return {
        queueLen: _wqLoad().length,
        badgeShown: !!el,
        badgeText: el ? el.textContent : '',
      };
    });
    test('Queue accepts pushed offline writes (2 items)', badgeFlow.queueLen === 2);
    test('Badge appears when queue non-empty', badgeFlow.badgeShown);
    test('Badge text shows queue count', /2/.test(badgeFlow.badgeText));

    // Simulate flush: mock sb.from to succeed, then flush
    const flushResult = await page.evaluate(async () => {
      // Mock sb.from to return success
      const realFrom = sb.from;
      sb.from = (table) => ({
        insert: async () => ({ error: null }),
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        upsert: async () => ({ error: null }),
      });
      // Pretend user is logged in and online
      currentUser = { id: 'fake-user', email: 'test@example.com' };
      await _wqFlush();
      sb.from = realFrom;
      return {
        queueAfter: _wqLoad().length,
        badgeStillThere: !!document.getElementById('offline-badge'),
      };
    });
    test('After flush: queue is empty', flushResult.queueAfter === 0);
    test('After flush: badge auto-removed (nothing to show)', !flushResult.badgeStillThere);

    // Test the full guest-data migration
    console.log('\n\x1b[36m━━━ Runtime: guest data migrates to cloud ━━━\x1b[0m');

    const migrationFlow = await page.evaluate(async () => {
      // Seed guest data in EVERY table's local cache
      localStorage.setItem('local_sales', JSON.stringify([{id:'s1',date:'2026-05-25',ts:Date.now(),amt:100,cost:50,note:'Test',payMode:'Cash',country:'IN'}]));
      localStorage.setItem('local_customers', JSON.stringify([{id:'c1',name:'Ravi',phone:'9999999999',address:'',note:''}]));
      localStorage.setItem('local_staffList', JSON.stringify([{id:'sf1',name:'Mohan',phone:'8888888888',salaryType:'monthly',salaryAmt:15000}]));
      localStorage.setItem('local_returns', JSON.stringify([{id:'r1',date:'2026-05-25',ts:Date.now(),amt:50,type:'sale_return',reason:'Defective',note:'',refName:'',country:'IN'}]));
      localStorage.setItem('local_cashbook', JSON.stringify([{id:'cb1',date:'2026-05-25',opening:1000,expected:1500,actual:1500,difference:0,note:''}]));
      localStorage.setItem('local_branches', JSON.stringify([{id:'b1',name:'Main',location:'Dharan',isDefault:true}]));

      // Track which tables get upserted
      const calls = [];
      const realFrom = sb.from;
      sb.from = (table) => ({
        upsert: async (rows) => { calls.push({table, count: Array.isArray(rows)?rows.length:1}); return { error: null }; },
        insert: async () => ({ error: null }),
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      });

      currentUser = { id: 'fake-uid', email: 'test@example.com' };
      isGuestMode = true;
      await _migrateGuestData();
      sb.from = realFrom;
      isGuestMode = false;

      return {
        upsertedTables: calls.map(c => c.table),
        totalCalls: calls.length,
        localStillThere: {
          sales: !!localStorage.getItem('local_sales'),
          customers: !!localStorage.getItem('local_customers'),
          branches: !!localStorage.getItem('local_branches'),
        },
      };
    });
    test('Migration: pm_sales upserted', migrationFlow.upsertedTables.includes('pm_sales'));
    test('Migration: pm_customers upserted', migrationFlow.upsertedTables.includes('pm_customers'));
    test('Migration: pm_staff upserted', migrationFlow.upsertedTables.includes('pm_staff'));
    test('Migration: pm_returns upserted', migrationFlow.upsertedTables.includes('pm_returns'));
    test('Migration: pm_cashbook upserted', migrationFlow.upsertedTables.includes('pm_cashbook'));
    test('Migration: pm_branches upserted', migrationFlow.upsertedTables.includes('pm_branches'));
    test('Migration: pm_settings called (via saveSettings)',
      migrationFlow.upsertedTables.includes('pm_settings'));
    test('Migration: local_sales cleared after migration', !migrationFlow.localStillThere.sales);
    test('Migration: local_customers cleared after migration', !migrationFlow.localStillThere.customers);
    test('Migration: local_branches cleared after migration', !migrationFlow.localStillThere.branches);

  } finally {
    await browser.close();
  }

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const allGood = passed === total;
  console.log(`RESULT: ${passed}/${total} offline-sync tests passed`);
  if (allGood) console.log('\x1b[42m\x1b[1m 🎉 OFFLINE-FIRST SYNC FULLY VERIFIED \x1b[0m');
  else {
    console.log('\x1b[41m\x1b[1m ❌ SOME CHECKS FAILED \x1b[0m');
    console.log('\nFailed:');
    results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name + (r.info ? ' — ' + r.info : '')));
  }
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  process.exit(allGood ? 0 : 1);
})().catch(e => { console.error('TEST FAIL:', e); process.exit(1); });
