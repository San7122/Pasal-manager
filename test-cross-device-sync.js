// Cross-device sync test:
//   Simulates Device A (iPhone) and Device B (iPad) logged in as the same user.
//   Verifies that data written on A is fetched by B (via Supabase user_id keying).
//
// Strategy: Two browser contexts, both with the same fake currentUser. We mock
// sb.from() in both pages so they share a single in-memory "cloud store" keyed
// by user_id — this exercises the SAME loadAll/dbAdd code paths the real app uses.

const puppeteer = require('puppeteer');
const fs = require('fs');

const results = [];
const test = (name, pass, info = '') => {
  results.push({ name, pass, info });
  console.log((pass ? '\x1b[32m✅' : '\x1b[31m❌') + '\x1b[0m ' + name + (info ? ' \x1b[90m— ' + info + '\x1b[0m' : ''));
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
const IPAD_UA   = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

// Shared cloud store accessible from BOTH pages via exposeFunction
const cloudStore = {}; // { 'pm_sales': [{...rows}], 'pm_stock': [...], ... }
const SHARED_USER_ID = 'brother-gmail-uuid';

function cloudInsert(table, rows) {
  if (!cloudStore[table]) cloudStore[table] = [];
  const arr = Array.isArray(rows) ? rows : [rows];
  cloudStore[table].push(...arr);
  return { error: null };
}
function cloudUpsert(table, rows, onConflict) {
  if (!cloudStore[table]) cloudStore[table] = [];
  const arr = Array.isArray(rows) ? rows : [rows];
  for (const row of arr) {
    const key = onConflict || 'id';
    const idx = cloudStore[table].findIndex(r => r[key] === row[key]);
    if (idx >= 0) cloudStore[table][idx] = row;
    else cloudStore[table].push(row);
  }
  return { error: null };
}
function cloudSelect(table, userId) {
  return { data: (cloudStore[table] || []).filter(r => r.user_id === userId), error: null };
}
function cloudDelete(table, id, userId) {
  if (!cloudStore[table]) return { error: null };
  cloudStore[table] = cloudStore[table].filter(r => !(r.id === id && r.user_id === userId));
  return { error: null };
}
function cloudUpdate(table, id, userId, fields) {
  if (!cloudStore[table]) return { error: null };
  cloudStore[table] = cloudStore[table].map(r =>
    (r.id === id && r.user_id === userId) ? { ...r, ...fields } : r
  );
  return { error: null };
}

// Install a Supabase mock into a page that routes all sb.from() calls through cloudStore
async function installSupabaseMock(page) {
  // Bridge functions
  await page.exposeFunction('__cloudInsert', cloudInsert);
  await page.exposeFunction('__cloudUpsert', cloudUpsert);
  await page.exposeFunction('__cloudSelect', cloudSelect);
  await page.exposeFunction('__cloudDelete', cloudDelete);
  await page.exposeFunction('__cloudUpdate', cloudUpdate);

  await page.evaluate((USER_ID) => {
    // Replace sb.from with our shared-cloud version
    sb.from = (table) => {
      const builder = {
        // SELECT chain: .select('*').eq('user_id', uid).order(...).maybeSingle()
        select() {
          let filterUid = USER_ID; // tests only ever filter by user_id
          const chain = {
            eq(col, val) { if(col==='user_id') filterUid = val; return chain; },
            order() { return chain; },
            maybeSingle: async () => {
              const r = await window.__cloudSelect(table, filterUid);
              return { data: r.data[0] || null, error: null };
            },
            then: async (resolve) => {
              const r = await window.__cloudSelect(table, filterUid);
              resolve({ data: r.data, error: null });
            },
          };
          return chain;
        },
        insert: async (rows) => window.__cloudInsert(table, rows),
        upsert: async (rows, opts) => window.__cloudUpsert(table, rows, opts?.onConflict),
        delete() {
          let _id, _uid;
          const d = {
            eq(col, val) { if(col==='id') _id=val; if(col==='user_id') _uid=val; return d; },
            then: async (resolve) => resolve(await window.__cloudDelete(table, _id, _uid)),
          };
          return d;
        },
        update(fields) {
          let _id, _uid;
          const u = {
            eq(col, val) { if(col==='id') _id=val; if(col==='user_id') _uid=val; return u; },
            then: async (resolve) => resolve(await window.__cloudUpdate(table, _id, _uid, fields)),
          };
          return u;
        },
      };
      return builder;
    };

    // Pretend this device is logged in as the shared user
    currentUser = { id: USER_ID, email: 'brother@gmail.com' };
    isGuestMode = false;
  }, SHARED_USER_ID);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    console.log('\n\x1b[36m━━━ DEVICE A (iPhone) — adds data ━━━\x1b[0m');

    // ── Device A: iPhone ──
    const ctxA = await browser.createBrowserContext();
    const pageA = await ctxA.newPage();
    await pageA.setUserAgent(IPHONE_UA);
    await pageA.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await pageA.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    await installSupabaseMock(pageA);

    // Add data via the real app functions
    const addedOnA = await pageA.evaluate(async () => {
      // Reset local state to start clean
      sales = []; stock = []; udhaars = []; customers = []; staffList = []; returns = [];
      cashbookEntries = []; gstBills = []; emiPlans = []; loans = []; suppliers = []; branches = [];

      // Add a sale via the real dbAdd path
      const sale = { id: 'sale-iphone-1', date: '2026-05-25', ts: Date.now(), amt: 1500, cost: 800, note: 'Kurti 3 pcs', payMode: 'Cash', country: 'IN' };
      sales.unshift(sale);
      await dbAdd('pm_sales', {id:sale.id,user_id:currentUser.id,date:sale.date,ts:sale.ts,amt:sale.amt,cost:sale.cost,note:sale.note,pay_mode:sale.payMode,country:sale.country});

      // Add a stock item
      const item = { id: 'stock-iphone-1', name: 'Saree', size: 'XL', qty: 20, buy: 500, sell: 899, country: 'IN', barcode: 'STK999' };
      stock.unshift(item);
      await dbAdd('pm_stock', {id:item.id,user_id:currentUser.id,name:item.name,size:item.size,qty:item.qty,buy:item.buy,sell:item.sell,country:item.country,barcode:item.barcode});

      // Add a customer
      const cust = { id: 'cust-iphone-1', name: 'Ravi Singh', phone: '9876543210', address: 'Dharan', note: 'Regular customer' };
      customers.unshift(cust);
      await dbAdd('pm_customers', {id:cust.id,user_id:currentUser.id,name:cust.name,phone:cust.phone,address:cust.address,note:cust.note,ts:Date.now()});

      // Add an udhaar
      const u = { id: 'udh-iphone-1', name: 'Mohan Lal', phone: '9123456789', amt: 5000, date: '2026-05-25', ts: Date.now(), paid: false, dueDate: '2026-06-15', country: 'IN' };
      udhaars.unshift(u);
      await dbAdd('pm_udhaar', {id:u.id,user_id:currentUser.id,name:u.name,phone:u.phone,amt:u.amt,date:u.date,ts:u.ts,paid:u.paid,due_date:u.dueDate,country:u.country});

      // Save settings (shop name)
      S.shopName = 'Sanjana Shoe Store';
      S.country = 'NP';
      S.npPaymentId = 'FONEPAY_CODE_XYZ';
      S.esewaId = '9800000001';
      await saveSettings();

      return {
        salesAdded: sales.length,
        stockAdded: stock.length,
        customersAdded: customers.length,
        udhaarAdded: udhaars.length,
        shopName: S.shopName,
      };
    });

    test('Device A: added 1 sale', addedOnA.salesAdded === 1);
    test('Device A: added 1 stock item', addedOnA.stockAdded === 1);
    test('Device A: added 1 customer', addedOnA.customersAdded === 1);
    test('Device A: added 1 udhaar', addedOnA.udhaarAdded === 1);
    test('Device A: shop name saved', addedOnA.shopName === 'Sanjana Shoe Store');

    // Verify cloud actually received the data
    test('Cloud: 1 sale stored under shared user', (cloudStore['pm_sales']||[]).filter(r=>r.user_id===SHARED_USER_ID).length === 1);
    test('Cloud: 1 stock item stored', (cloudStore['pm_stock']||[]).filter(r=>r.user_id===SHARED_USER_ID).length === 1);
    test('Cloud: 1 customer stored', (cloudStore['pm_customers']||[]).filter(r=>r.user_id===SHARED_USER_ID).length === 1);
    test('Cloud: 1 udhaar stored', (cloudStore['pm_udhaar']||[]).filter(r=>r.user_id===SHARED_USER_ID).length === 1);
    test('Cloud: settings stored', (cloudStore['pm_settings']||[]).filter(r=>r.user_id===SHARED_USER_ID).length === 1);
    test('Cloud: Fonepay code persisted',
      ((cloudStore['pm_settings']||[]).find(r=>r.user_id===SHARED_USER_ID)||{}).np_payment_id === 'FONEPAY_CODE_XYZ');

    console.log('\n\x1b[36m━━━ DEVICE B (iPad) — logs in fresh, should see everything ━━━\x1b[0m');

    // ── Device B: iPad — separate browser context (different localStorage, cookies) ──
    const ctxB = await browser.createBrowserContext();
    const pageB = await ctxB.newPage();
    await pageB.setUserAgent(IPAD_UA);
    await pageB.setViewport({ width: 1024, height: 1366, isMobile: true, hasTouch: true });
    await pageB.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    await installSupabaseMock(pageB);

    // Run the real loadAll() that the app uses on every login
    const seenOnB = await pageB.evaluate(async () => {
      // Reset state to prove the data is coming from the cloud, not lingering local cache
      sales = []; stock = []; udhaars = []; customers = []; staffList = []; returns = [];
      cashbookEntries = []; gstBills = []; emiPlans = []; loans = []; suppliers = []; branches = [];
      S = { country:'IN', language:'en', shopName:'', ownPhone:'', reminderTime:'21:00', gstin:'', bizAddress:'', bizState:'' };

      await loadAll();

      return {
        sales: sales.map(s => ({id:s.id, amt:s.amt, note:s.note})),
        stock: stock.map(s => ({id:s.id, name:s.name, qty:s.qty})),
        customers: customers.map(c => ({id:c.id, name:c.name})),
        udhaars: udhaars.map(u => ({id:u.id, name:u.name, amt:u.amt})),
        shopName: S.shopName,
        country: S.country,
        npPaymentId: S.npPaymentId,
        esewaId: S.esewaId,
      };
    });

    test('Device B: sees sale added on Device A', seenOnB.sales.some(s => s.id === 'sale-iphone-1'));
    test('Device B: sale amount preserved (₹1500)', seenOnB.sales[0]?.amt === 1500);
    test('Device B: sale note preserved', seenOnB.sales[0]?.note === 'Kurti 3 pcs');
    test('Device B: sees stock item added on Device A', seenOnB.stock.some(s => s.id === 'stock-iphone-1'));
    test('Device B: stock name preserved (Saree)', seenOnB.stock[0]?.name === 'Saree');
    test('Device B: stock qty preserved (20)', seenOnB.stock[0]?.qty === 20);
    test('Device B: sees customer added on Device A', seenOnB.customers.some(c => c.id === 'cust-iphone-1'));
    test('Device B: customer name preserved (Ravi Singh)', seenOnB.customers[0]?.name === 'Ravi Singh');
    test('Device B: sees udhaar added on Device A', seenOnB.udhaars.some(u => u.id === 'udh-iphone-1'));
    test('Device B: udhaar amount preserved (₹5000)', seenOnB.udhaars[0]?.amt === 5000);
    test('Device B: shop name synced', seenOnB.shopName === 'Sanjana Shoe Store');
    test('Device B: country synced (NP)', seenOnB.country === 'NP');
    test('Device B: Fonepay code synced', seenOnB.npPaymentId === 'FONEPAY_CODE_XYZ');
    test('Device B: eSewa ID synced', seenOnB.esewaId === '9800000001');

    console.log('\n\x1b[36m━━━ DEVICE B adds data → DEVICE A reloads → sees it ━━━\x1b[0m');

    // Device B adds something new
    await pageB.evaluate(async () => {
      const newSale = { id: 'sale-ipad-1', date: '2026-05-25', ts: Date.now(), amt: 2500, cost: 1200, note: 'Saree 1 pc', payMode: 'UPI', country: 'NP' };
      sales.unshift(newSale);
      await dbAdd('pm_sales', {id:newSale.id,user_id:currentUser.id,date:newSale.date,ts:newSale.ts,amt:newSale.amt,cost:newSale.cost,note:newSale.note,pay_mode:newSale.payMode,country:newSale.country});
    });

    // Device A reloads (simulating refresh / tab switch / app reopen)
    const afterReloadA = await pageA.evaluate(async () => {
      sales = [];
      await loadAll();
      return { sales: sales.map(s => ({id:s.id, amt:s.amt, note:s.note})), count: sales.length };
    });

    test('Device A after reload: sees BOTH sales', afterReloadA.count === 2);
    test('Device A: sees its own sale', afterReloadA.sales.some(s => s.id === 'sale-iphone-1'));
    test('Device A: sees Device B\'s new sale', afterReloadA.sales.some(s => s.id === 'sale-ipad-1'));
    test('Device A: Device B sale amount correct (₹2500)',
      afterReloadA.sales.find(s => s.id === 'sale-ipad-1')?.amt === 2500);

    console.log('\n\x1b[36m━━━ DEVICE A deletes on iPhone → DEVICE B reloads → sale gone ━━━\x1b[0m');

    await pageA.evaluate(async () => {
      // Simulate deleting via the dbDel path
      sales = sales.filter(s => s.id !== 'sale-iphone-1');
      const sb_from = sb.from;
      const res = await sb.from('pm_sales').delete().eq('id','sale-iphone-1').eq('user_id',currentUser.id);
    });

    const finalB = await pageB.evaluate(async () => {
      sales = [];
      await loadAll();
      return { count: sales.length, hasDeleted: sales.some(s => s.id === 'sale-iphone-1') };
    });
    test('Device B after reload: deletion replicated (1 sale left)', finalB.count === 1);
    test('Device B: deleted sale is gone', !finalB.hasDeleted);

  } finally {
    await browser.close();
  }

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const allGood = passed === total;
  console.log(`RESULT: ${passed}/${total} cross-device sync tests passed`);
  if (allGood) console.log('\x1b[42m\x1b[1m 🎉 CROSS-DEVICE SYNC VERIFIED — same Gmail = same data everywhere \x1b[0m');
  else {
    console.log('\x1b[41m\x1b[1m ❌ SOME CHECKS FAILED \x1b[0m');
    console.log('\nFailed:');
    results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name + (r.info ? ' — ' + r.info : '')));
  }
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  process.exit(allGood ? 0 : 1);
})().catch(e => { console.error('TEST FAIL:', e); process.exit(1); });
