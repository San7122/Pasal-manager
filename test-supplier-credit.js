// Verifies the 4 supplier-credit improvements:
//   1. Running balance auto-calculated for every Purchase Book entry
//   2. Running balance auto-calculated for every Dealer Book entry
//   3. Purchase Book is on the MAIN menu (not Advanced)
//   4. "I OWE" KPI card on Dashboard shows total supplier debt
//   5. Smart payment suggestion banner logic
//   6. Dashboard grid handles 5 cards responsively

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const results = [];
const test = (name, pass, info = '') => {
  results.push({ name, pass, info });
  console.log((pass ? '\x1b[32m✅' : '\x1b[31m❌') + '\x1b[0m ' + name + (info ? ' \x1b[90m— ' + info + '\x1b[0m' : ''));
};

(async () => {
  console.log('\n\x1b[36m━━━ Static: Purchase Book running balance ━━━\x1b[0m');
  const html = fs.readFileSync(path.join(__dirname, 'pasal-manager.html'), 'utf8');

  test('renderKharidiDetail computes runningBalances object',
    /function renderKharidiDetail[\s\S]{0,1500}?runningBalances\s*=\s*\{/.test(html));
  test('Running balance iterates oldest → newest',
    /entriesOldFirst\s*=\s*\[\.\.\.entries\]\.sort\(\(a,b\)=>\(a\.ts\|\|0\)-\(b\.ts\|\|0\)\)/.test(html));
  test('Each ledger row displays "Balance after:" with auto-calc',
    /Balance after:\s*\$\{fmt\(Math\.abs\(bal\)\)\}\s*\$\{balLabel\}/.test(html));
  test('Balance label is contextual (owed/advance/settled)',
    /still owed/.test(html) && /advance paid/.test(html) && /settled/.test(html));

  console.log('\n\x1b[36m━━━ Static: Dealer Book running balance ━━━\x1b[0m');
  test('renderDealerDetail computes runningBalances',
    /function renderDealerDetail[\s\S]{0,1500}?runningBalances\s*=\s*\{/.test(html));
  test('Dealer balance label is contextual (receivable/overpaid/settled)',
    /still receivable/.test(html) && /overpaid/.test(html));

  console.log('\n\x1b[36m━━━ Static: Purchase Book on MAIN menu ━━━\x1b[0m');
  // Should appear in basicItems near 'supplier', NOT in advancedItems
  const basicItemsBlock = html.match(/const basicItems\s*=\s*\[[\s\S]+?\];/)?.[0] || '';
  const advancedItemsBlock = html.match(/const advancedItems\s*=\s*\[[\s\S]+?\];/)?.[0] || '';
  test('Purchase Book in basicItems (main menu)',
    /id:['"]kharidi['"][\s\S]{0,200}?Purchase Book/.test(basicItemsBlock));
  test('Purchase Book NOT in advancedItems (no duplicate)',
    !/id:['"]kharidi['"]/.test(advancedItemsBlock));
  test('Description mentions auto-balance for clarity',
    /Purchase Book[\s\S]{0,300}?auto-balance/i.test(basicItemsBlock));

  console.log('\n\x1b[36m━━━ Static: Dashboard "I OWE" KPI card ━━━\x1b[0m');
  test('supplierOwed computed from kharidiEntries',
    /supplierOwed\s*=[\s\S]{0,300}?kharidiEntries\.reduce/.test(html));
  test('supplierOwed handles purchase vs payment',
    /e\.type\s*===\s*['"]purchase['"]\s*\?\s*e\.amt\s*:\s*-e\.amt/.test(html));
  test('"I Owe" card rendered in summary grid',
    /'I Owe'[\s\S]{0,200}?fmt\(supplierOwed\)/.test(html));
  test('"To Collect" card replaces old "Udhaar" label',
    /'To Collect'[\s\S]{0,200}?fmt\(udhaarPending\)/.test(html));
  test('Supplier card color semantic — red when debt exists',
    /supplierColor\s*=\s*supplierOwed\s*>\s*0\s*\?\s*['"]#DC2626['"]/.test(html));

  console.log('\n\x1b[36m━━━ Static: Smart payment suggestion banner ━━━\x1b[0m');
  test('Suggestion banner only shows when both sales & debt exist',
    /if\s*\(supplierOwed\s*<=\s*0\s*\|\|\s*weekAmt\s*<=\s*0\)\s*return\s*['"]['"]/.test(html));
  test('Suggested amount = 30% of weekly sales, capped at debt',
    /Math\.min\(Math\.round\(weekAmt\s*\*\s*0\.30\),\s*supplierOwed\)/.test(html));
  test('Banner has "Pay now" CTA that opens Purchase Book',
    /goMore\(['"]kharidi['"]\)[\s\S]{0,200}?Pay now/.test(html));
  test('Banner uses yellow accent (warning/suggestion color)',
    /fef9c3|fef3c7|facc15/.test(html));

  console.log('\n\x1b[36m━━━ Static: PDF supplier statement ━━━\x1b[0m');
  test('_buildSupplierStatementPDF function exists',
    /function _buildSupplierStatementPDF\(supplierName\)/.test(html));
  test('PDF uses A4 portrait format',
    /_buildSupplierStatementPDF[\s\S]{0,1500}?format:\s*['"]a4['"][\s\S]{0,200}?orientation:\s*['"]portrait['"]/.test(html));
  test('PDF has Dr/Cr/Balance columns',
    /Dr \(Purchase\)/.test(html) && /Cr \(Payment\)/.test(html) && /BALANCE/.test(html));
  test('PDF shows running balance (Dr/Cr suffix) per row',
    /balLabel[\s\S]{0,200}?Dr['"]/.test(html) && /balLabel[\s\S]{0,200}?Cr['"]/.test(html));
  test('PDF has total row at bottom',
    /TOTAL[\s\S]{0,300}?fmt\(totalDr\)/.test(html));
  test('PDF has plain-language summary line',
    /owes\s+\$\{supplierName\}/.test(html));
  test('PDF has signature lines',
    /Please verify this statement/.test(html));
  test('downloadSupplierStatement uses Share Sheet on iOS',
    /downloadSupplierStatement[\s\S]{0,800}?navigator\.canShare[\s\S]{0,200}?navigator\.share/.test(html));
  test('downloadSupplierStatement falls back to doc.save on Android/Desktop',
    /downloadSupplierStatement[\s\S]{0,1200}?result\.doc\.save\(result\.filename\)/.test(html));
  test('PDF generation tracked as analytics event',
    /trackEvent\(['"]supplier_statement_generated['"]/.test(html));

  console.log('\n\x1b[36m━━━ Static: WhatsApp supplier statement ━━━\x1b[0m');
  test('shareSupplierStatementWhatsApp function exists',
    /function shareSupplierStatementWhatsApp\(supplierName\)/.test(html));
  test('WhatsApp message includes total purchased',
    /shareSupplierStatementWhatsApp[\s\S]{0,1500}?Total Purchased/.test(html));
  test('WhatsApp message includes total paid',
    /shareSupplierStatementWhatsApp[\s\S]{0,1500}?Total Paid/.test(html));
  test('WhatsApp message handles I owe / they owe / settled',
    /shareSupplierStatementWhatsApp[\s\S]{0,1500}?I owe you[\s\S]{0,400}?You owe me[\s\S]{0,400}?fully settled/.test(html));
  test('WhatsApp opens wa.me URL with prefilled message',
    /shareSupplierStatementWhatsApp[\s\S]{0,1500}?wa\.me/.test(html));
  test('WhatsApp share tracked as analytics event',
    /trackEvent\(['"]supplier_statement_shared_wa['"]/.test(html));

  console.log('\n\x1b[36m━━━ Static: PDF/WhatsApp buttons in Purchase Book detail ━━━\x1b[0m');
  test('"📄 PDF" button calls downloadSupplierStatement',
    /downloadSupplierStatement\(/.test(html) && /📄 PDF/.test(html));
  test('"💬 Share" button calls shareSupplierStatementWhatsApp',
    /shareSupplierStatementWhatsApp\(/.test(html) && /💬 Share/.test(html));

  console.log('\n\x1b[36m━━━ Static: Responsive grid for 5 cards ━━━\x1b[0m');
  test('Grid: 2 cols mobile',
    /\.summary-card-grid\s*\{[\s\S]{0,200}?grid-template-columns:\s*repeat\(2,\s*1fr\)/.test(html));
  test('Grid: 3 cols at 600px breakpoint',
    /@media\s*\(min-width:\s*600px\)\s*\{[\s\S]{0,200}?grid-template-columns:\s*repeat\(3,\s*1fr\)/.test(html));
  test('Grid: 5 cols at 900px breakpoint',
    /@media\s*\(min-width:\s*900px\)\s*\{[\s\S]{0,200}?grid-template-columns:\s*repeat\(5,\s*1fr\)/.test(html));

  console.log('\n\x1b[36m━━━ Runtime: Add entries → balance updates correctly ━━━\x1b[0m');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto('http://localhost:8001/app.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4500));

    // Set up: enter guest mode + add a supplier + open Purchase Book
    const setup = await page.evaluate(async () => {
      // Mock Supabase so dbAdd doesn't fail
      sb.from = (table) => ({
        insert: async () => ({ error: null }),
        upsert: async () => ({ error: null }),
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        select: () => ({ eq: () => ({ order: () => ({ then: r => r({data:[]}) }) }), order: () => ({ then: r => r({data:[]}) }) }),
      });
      isGuestMode = true;
      currentUser = null;
      S.shopName = 'Test Shop';
      S.country = 'IN';
      // Pretend we're already in the app
      document.getElementById('auth-page').style.display='none';
      document.getElementById('app').style.display='flex';
      // Seed a supplier so the kharidi page has someone to show
      suppliers = [{id:'sup1',name:'Atri Das',phone:'9800000001',note:''}];
      kharidiEntries = [];
      return true;
    });
    test('Test setup OK', setup === true);

    // Add purchases + payments in order, verify running balance after each
    const ledger = await page.evaluate(async () => {
      currentKharidiSupplier = 'Atri Das';
      // Manually add 4 entries (oldest → newest in real time)
      const baseTs = Date.now();
      kharidiEntries.push({id:'k1', supplierName:'Atri Das', date:'2026-01-05', ts:baseTs - 4*86400000, amt:15000, type:'purchase', note:'Initial stock', country:'IN'});
      kharidiEntries.push({id:'k2', supplierName:'Atri Das', date:'2026-01-15', ts:baseTs - 3*86400000, amt:5000,  type:'payment',  note:'Weekly',        country:'IN'});
      kharidiEntries.push({id:'k3', supplierName:'Atri Das', date:'2026-02-01', ts:baseTs - 2*86400000, amt:8000,  type:'purchase', note:'Festival',      country:'IN'});
      kharidiEntries.push({id:'k4', supplierName:'Atri Das', date:'2026-02-15', ts:baseTs - 1*86400000, amt:10000, type:'payment',  note:'Monthly',       country:'IN'});

      // Render the supplier detail page
      kharidiEntryType = 'purchase';
      goMore('kharidiDetail');
      await new Promise(r => setTimeout(r, 400));

      // Pull all "Balance after:" texts from the DOM
      const text = document.getElementById('page-more')?.innerText || '';
      // Match "Balance after: ₹<amount> <label>" lines (fmt() prefixes with ₹)
      const balances = [...text.matchAll(/Balance after:\s*[₹$]?\s*([\d,]+)\s*(still owed|advance paid|settled)/g)].map(m => ({
        amount: parseInt(m[1].replace(/,/g, ''), 10),
        label: m[2],
      }));
      // Total displayed at top
      const headerTotal = (text.match(/Balance Due\s*\n?\s*(?:\n)?(\d[\d,]*)/i) || [])[1] || '';
      return {
        balanceCount: balances.length,
        balances,
        bodyText: text.slice(0, 600),
      };
    });

    test('Renders 4 balance lines (one per entry)', ledger.balanceCount === 4,
      `got ${ledger.balanceCount}`);
    if (ledger.balanceCount !== 4) {
      console.log('  DEBUG body text:', JSON.stringify(ledger.bodyText).slice(0, 400));
    }

    // Expected balances (in DOM order = newest first, since list is sorted DESC by ts):
    //   Newest:  k4 (Payment 10k) → balance after = 8,000 owed
    //            k3 (Purchase 8k) → balance after = 18,000 owed
    //            k2 (Payment 5k)  → balance after = 10,000 owed
    //   Oldest:  k1 (Purchase 15k)→ balance after = 15,000 owed
    const expectedDescOrder = [
      { amount: 8000,  label: 'still owed' },
      { amount: 18000, label: 'still owed' },
      { amount: 10000, label: 'still owed' },
      { amount: 15000, label: 'still owed' },
    ];
    for (let i = 0; i < 4; i++) {
      const got = ledger.balances[i] || {};
      const exp = expectedDescOrder[i];
      test(`Entry ${i+1} (newest→oldest): balance after = ${exp.amount} ${exp.label}`,
        got.amount === exp.amount && got.label === exp.label,
        `got=${got.amount} ${got.label}`);
    }

    // Test the "settled" + "advance" labels
    const edgeCases = await page.evaluate(async () => {
      // Settled: 1 purchase 5k, 1 payment 5k → balance 0
      // Then advance: 1 purchase 5k, 2 payments 5k each → balance -5k (overpaid → "advance paid")
      kharidiEntries = [
        {id:'a1', supplierName:'Atri Das', date:'2026-01-01', ts:1, amt:5000, type:'purchase', note:'', country:'IN'},
        {id:'a2', supplierName:'Atri Das', date:'2026-01-02', ts:2, amt:5000, type:'payment',  note:'', country:'IN'},
      ];
      currentKharidiSupplier = 'Atri Das';
      goMore('kharidiDetail');
      await new Promise(r => setTimeout(r, 300));
      const text1 = document.getElementById('page-more')?.innerText || '';
      const hasSettled = /Balance after:\s*[₹$]?\s*0\s*settled/.test(text1);

      kharidiEntries.push({id:'a3', supplierName:'Atri Das', date:'2026-01-03', ts:3, amt:5000, type:'payment', note:'', country:'IN'});
      goMore('kharidiDetail');
      await new Promise(r => setTimeout(r, 300));
      const text2 = document.getElementById('page-more')?.innerText || '';
      const hasAdvance = /Balance after:\s*[₹$]?\s*5,000\s*advance paid/.test(text2);

      return { hasSettled, hasAdvance };
    });
    test('Label = "settled" when balance exactly 0', edgeCases.hasSettled);
    test('Label = "advance paid" when overpaid (negative balance)', edgeCases.hasAdvance);

    console.log('\n\x1b[36m━━━ Runtime: Dashboard "I OWE" card + smart suggestion ━━━\x1b[0m');

    const dashboard = await page.evaluate(async () => {
      // Set up: weekly sales = ₹10,000, supplier debt = ₹40,000
      const today = new Date().toISOString().slice(0,10);
      sales = [
        {id:'s1', date:today, ts:Date.now(), amt:6000, cost:3000, note:'', payMode:'Cash', country:'IN'},
        {id:'s2', date:today, ts:Date.now()+1, amt:4000, cost:2000, note:'', payMode:'Cash', country:'IN'},
      ];
      expenses = []; udhaars = [];
      kharidiEntries = [
        {id:'k1', supplierName:'Atri Das', date:'2026-01-01', ts:1, amt:40000, type:'purchase', note:'', country:'IN'},
      ];
      goMore('dashboard');
      await new Promise(r => setTimeout(r, 700));
      const text = document.getElementById('page-more')?.innerText || '';
      const html = document.getElementById('page-more')?.innerHTML || '';
      return {
        hasIOweCard: /I Owe/.test(text),
        showsSupplierAmount: /40,000/.test(text),
        hasToCollectCard: /To Collect/.test(text),
        hasSmartSuggestion: /Smart suggestion/.test(text) && /consider paying/i.test(text),
        suggestionAmount: (text.match(/Consider paying[^\d]{0,20}(\d[\d,]*)/i) || [])[1] || '',
        hasPayNowButton: /Pay now/.test(text),
        kpiCardCount: (html.match(/class="summary-card"/g) || []).length,
      };
    });

    test('Dashboard shows "I Owe" KPI card', dashboard.hasIOweCard);
    test('"I Owe" card shows ₹40,000 supplier debt', dashboard.showsSupplierAmount);
    test('Dashboard shows "To Collect" card (renamed from Udhaar)', dashboard.hasToCollectCard);
    test('Dashboard has 5 KPI cards total', dashboard.kpiCardCount === 5,
      `got ${dashboard.kpiCardCount}`);
    test('Smart suggestion banner appears when sales + debt both > 0', dashboard.hasSmartSuggestion);
    test('Suggested amount = 30% of week sales = ₹3,000 (cap to debt)',
      dashboard.suggestionAmount === '3,000', `got "${dashboard.suggestionAmount}"`);
    test('Smart suggestion has "Pay now" CTA', dashboard.hasPayNowButton);

    // Test: suggestion should NOT show when no supplier debt
    const noSuggestionNoDebt = await page.evaluate(async () => {
      kharidiEntries = []; // no debt
      goMore('dashboard');
      await new Promise(r => setTimeout(r, 500));
      return !/Smart suggestion/.test(document.getElementById('page-more')?.innerText || '');
    });
    test('Smart suggestion HIDDEN when no supplier debt', noSuggestionNoDebt);

    // Test: suggestion should NOT show when no weekly sales
    const noSuggestionNoSales = await page.evaluate(async () => {
      sales = [];
      kharidiEntries = [{id:'k1', supplierName:'X', date:'2026-01-01', ts:1, amt:5000, type:'purchase', note:'', country:'IN'}];
      goMore('dashboard');
      await new Promise(r => setTimeout(r, 500));
      return !/Smart suggestion/.test(document.getElementById('page-more')?.innerText || '');
    });
    test('Smart suggestion HIDDEN when no weekly sales', noSuggestionNoSales);

    console.log('\n\x1b[36m━━━ Runtime: PDF + WhatsApp generation ━━━\x1b[0m');
    // Wait for jsPDF script to load (it has defer attribute)
    await page.evaluate(() => new Promise(r => {
      if (window.jspdf?.jsPDF) return r();
      const check = setInterval(()=>{ if(window.jspdf?.jsPDF){clearInterval(check);r();} }, 80);
      setTimeout(()=>{clearInterval(check);r();}, 4000);
    }));

    const pdfTest = await page.evaluate(() => {
      kharidiEntries = [
        {id:'k1', supplierName:'Atri Das', date:'2026-01-05', ts:1, amt:15000, type:'purchase', note:'Initial stock', country:'IN'},
        {id:'k2', supplierName:'Atri Das', date:'2026-01-15', ts:2, amt:5000,  type:'payment',  note:'Weekly',        country:'IN'},
        {id:'k3', supplierName:'Atri Das', date:'2026-02-01', ts:3, amt:8000,  type:'purchase', note:'Festival',      country:'IN'},
        {id:'k4', supplierName:'Atri Das', date:'2026-02-15', ts:4, amt:10000, type:'payment',  note:'Monthly',       country:'IN'},
      ];
      suppliers = [{id:'sup1', name:'Atri Das', phone:'9800000001', note:''}];
      const result = _buildSupplierStatementPDF('Atri Das');
      if (!result) return { ok: false };
      // jsPDF outputs a blob of the PDF; just check it's >1KB
      const blob = result.doc.output('blob');
      return {
        ok: true,
        filename: result.filename,
        size: blob.size,
        startsWithPDF: blob.size > 1000,
      };
    });
    test('PDF generated successfully', pdfTest.ok === true);
    test('PDF filename has correct format', /^Statement_Atri_Das_/.test(pdfTest.filename || ''));
    test('PDF blob size > 1KB (real content)', pdfTest.size > 1000,
      `size=${pdfTest.size}`);

    const pdfEmpty = await page.evaluate(() => {
      kharidiEntries = [];
      const result = _buildSupplierStatementPDF('Nobody');
      return result === null;
    });
    test('PDF returns null when supplier has no entries', pdfEmpty);

    // WhatsApp test: capture window.open() target URL
    const waTest = await page.evaluate(() => {
      kharidiEntries = [
        {id:'k1', supplierName:'Atri Das', date:'2026-01-05', ts:1, amt:15000, type:'purchase', note:'', country:'IN'},
        {id:'k2', supplierName:'Atri Das', date:'2026-01-15', ts:2, amt:5000,  type:'payment',  note:'', country:'IN'},
      ];
      suppliers = [{id:'sup1', name:'Atri Das', phone:'9800000001', note:''}];
      S.country = 'NP';
      let openedUrl = '';
      const origOpen = window.open;
      window.open = (url) => { openedUrl = url; return null; };
      shareSupplierStatementWhatsApp('Atri Das');
      window.open = origOpen;
      return {
        openedUrl,
        hasWaMe: openedUrl.includes('wa.me/'),
        hasNepalCode: openedUrl.includes('977'),
        hasMessage: openedUrl.includes('Atri%20Das') || decodeURIComponent(openedUrl).includes('Atri Das'),
        hasOwedAmount: decodeURIComponent(openedUrl).includes('10,000') || decodeURIComponent(openedUrl).includes('Rs 10,000'),
      };
    });
    test('WhatsApp share opens wa.me URL', waTest.hasWaMe);
    test('WhatsApp share prepends country code (NP → 977)', waTest.hasNepalCode);
    test('WhatsApp message includes supplier name', waTest.hasMessage);
    test('WhatsApp message includes correct net balance (₹10,000 owed)', waTest.hasOwedAmount);

  } finally {
    await browser.close();
  }

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const allGood = passed === total;
  console.log(`RESULT: ${passed}/${total} supplier-credit tests passed`);
  if (allGood) console.log('\x1b[42m\x1b[1m 🎉 SUPPLIER CREDIT FEATURE FULLY VERIFIED \x1b[0m');
  else {
    console.log('\x1b[41m\x1b[1m ❌ SOME CHECKS FAILED \x1b[0m');
    console.log('\nFailed:');
    results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name + (r.info ? ' — ' + r.info : '')));
  }
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  process.exit(allGood ? 0 : 1);
})().catch(e => { console.error('TEST FAIL:', e); process.exit(1); });
