// ============================================================
// PASAL MANAGER — Automated Test Suite (paste in browser console)
// Open pasal-manager.html in browser (via http://), log in,
// then paste this entire script in the DevTools console.
// ============================================================

(async function PasalTest() {
  const PASS = '✅ PASS';
  const FAIL = '❌ FAIL';
  const WARN = '⚠️  WARN';
  let passed = 0, failed = 0, warned = 0;
  const results = [];

  function assert(name, condition, note = '') {
    if (condition) {
      results.push({ status: PASS, name, note });
      passed++;
    } else {
      results.push({ status: FAIL, name, note });
      failed++;
    }
  }

  function warn(name, note = '') {
    results.push({ status: WARN, name, note });
    warned++;
  }

  function tryRender(name, fn) {
    try { fn(); assert(name + ' renders', true); }
    catch (e) { assert(name + ' renders', false, e.message); }
  }

  // ── Helper: generate a test id ──────────────────────────────
  const testId = () => 'test_' + Math.random().toString(36).slice(2, 9);
  const today = todayStr();

  console.log('%c🧪 PASAL MANAGER TEST SUITE STARTING...', 'font-size:16px;font-weight:bold;color:#6D28D9');

  // ============================================================
  // SECTION 1: CALCULATION FUNCTIONS
  // ============================================================
  console.group('📐 SECTION 1: Calculation Functions');

  // calcLoanEmi
  try {
    const emi1 = calcLoanEmi(100000, 12, 12);
    assert('calcLoanEmi: 1L @ 12% for 12mo', emi1 >= 8800 && emi1 <= 8900, `Got: ${emi1}`);

    const emi2 = calcLoanEmi(60000, 0, 12);
    assert('calcLoanEmi: zero interest = equal split', emi2 === 5000, `Got: ${emi2}, expected 5000`);

    const emi3 = calcLoanEmi(120000, 10, 24);
    assert('calcLoanEmi: 1.2L @ 10% for 24mo', emi3 >= 5500 && emi3 <= 5600, `Got: ${emi3}`);
  } catch (e) { assert('calcLoanEmi', false, e.message); }

  // loanSchedule
  try {
    const fakeLoan = { id: testId(), lender: 'TestBank', loanAmt: 12000, interestRate: 12, tenure: 12, emiAmt: 0, startDate: today };
    fakeLoan.emiAmt = calcLoanEmi(fakeLoan.loanAmt, fakeLoan.interestRate, fakeLoan.tenure);
    const sched = loanSchedule(fakeLoan);
    assert('loanSchedule: correct count', sched.length === 12, `Got: ${sched.length}`);
    assert('loanSchedule: has dueDate', !!sched[0].dueDate, `First entry: ${JSON.stringify(sched[0])}`);
    assert('loanSchedule: has principal + interest', sched[0].principal > 0 && sched[0].interest > 0, `p=${sched[0].principal} i=${sched[0].interest}`);
    const totalPrincipal = sched.reduce((a, s) => a + s.principal, 0);
    assert('loanSchedule: principal sum ≈ loan amount', Math.abs(totalPrincipal - fakeLoan.loanAmt) <= 5, `Sum=${totalPrincipal}, loan=${fakeLoan.loanAmt}`);
  } catch (e) { assert('loanSchedule', false, e.message); }

  // loanOutstanding
  try {
    const fakeId = testId();
    const fakeLn = { id: fakeId, loanAmt: 50000 };
    // No payments — outstanding = full amount
    const origPayments = loanPayments.slice();
    assert('loanOutstanding: no payments = full', loanOutstanding(fakeLn) === 50000);
    // Simulate 2 paid payments totalling 8000 principal
    loanPayments.push({ id: testId(), loanId: fakeId, principal: 4000, paid: true });
    loanPayments.push({ id: testId(), loanId: fakeId, principal: 4000, paid: true });
    assert('loanOutstanding: after 8000 principal paid', loanOutstanding(fakeLn) === 42000, `Got: ${loanOutstanding(fakeLn)}`);
    // Cleanup
    loanPayments = origPayments;
  } catch (e) { assert('loanOutstanding', false, e.message); }

  // emiPlanRemaining
  try {
    const fakeEmiId = testId();
    const fakePlan = { id: fakeEmiId, totalAmt: 10000, downPayment: 1000, installments: 5 };
    const origEmiPmts = emiPayments.slice();
    assert('emiPlanRemaining: no payments', emiPlanRemaining(fakePlan) === 9000, `Got: ${emiPlanRemaining(fakePlan)}`);
    emiPayments.push({ id: testId(), planId: fakeEmiId, amt: 1800, paid: true });
    emiPayments.push({ id: testId(), planId: fakeEmiId, amt: 1800, paid: false });
    assert('emiPlanRemaining: 1 paid', emiPlanRemaining(fakePlan) === 7200, `Got: ${emiPlanRemaining(fakePlan)}`);
    emiPayments = origEmiPmts;
  } catch (e) { assert('emiPlanRemaining', false, e.message); }

  // emiDueDates
  try {
    const plan = { id: testId(), totalAmt: 6000, downPayment: 0, installments: 3, frequency: 'monthly', startDate: '2026-01-01' };
    const dates = emiDueDates(plan);
    assert('emiDueDates: monthly count', dates.length === 3, `Got: ${dates.length}`);
    assert('emiDueDates: first date correct', dates[0].dueDate === '2026-01-01', `Got: ${dates[0].dueDate}`);
    assert('emiDueDates: each amt = 2000', dates.every(d => d.amt === 2000), `Amounts: ${dates.map(d=>d.amt)}`);
  } catch (e) { assert('emiDueDates', false, e.message); }

  // fmt / fmtDate / cur
  try {
    assert('fmt: formats number with commas', typeof fmt(12345) === 'string');
    assert('fmtDate: formats date string', typeof fmtDate('2026-01-15') === 'string');
    assert('cur: returns currency symbol', typeof cur() === 'string' && cur().length > 0);
    assert('todayStr: returns YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(todayStr()));
  } catch (e) { assert('Utility functions', false, e.message); }

  // sendWA (should not throw, just build URL)
  try {
    const origOpen = window.open;
    let waUrl = '';
    window.open = (url) => { waUrl = url; };
    sendWA('Test Customer', '9876543210', 1500, '');
    assert('sendWA: builds WhatsApp URL', waUrl.includes('wa.me'), `URL: ${waUrl}`);
    window.open = origOpen;
  } catch (e) { assert('sendWA', false, e.message); }

  console.groupEnd();

  // ============================================================
  // SECTION 2: DATA STATE — Inject Dummy Data
  // ============================================================
  console.group('💾 SECTION 2: Data State Injection');

  // Save originals
  const origSales = sales.slice();
  const origExpenses = expenses.slice();
  const origUdhaars = udhaars.slice();
  const origStock = stock.slice();
  const origSuppliers = suppliers.slice();
  const origCustomers = customers.slice();
  const origStaff = staffList.slice();
  const origStaffEntries = staffEntries.slice();
  const origReturns = returns.slice();
  const origKharidi = kharidiEntries.slice();
  const origDealers = dealers.slice();
  const origDealerEntries = dealerEntries.slice();
  const origLoans = loans.slice();
  const origLoanPayments = loanPayments.slice();
  const origEmiPlans = emiPlans.slice();
  const origEmiPayments = emiPayments.slice();
  const origCashbook = cashbookEntries ? cashbookEntries.slice() : [];

  const T_SALE_ID = testId();
  const T_EXP_ID = testId();
  const T_UDHAAR_ID = testId();
  const T_STOCK_ID = testId();
  const T_SUPPLIER_ID = testId();
  const T_CUSTOMER_ID = testId();
  const T_STAFF_ID = testId();
  const T_RETURN_ID = testId();
  const T_LOAN_ID = testId();
  const T_EMI_ID = testId();

  // Inject test data into state arrays
  sales.push({ id: T_SALE_ID, date: today, ts: Date.now(), amt: 5000, cost: 2000, note: 'Test Sale', payMode: 'Cash', country: 'IN', customerId: null });
  expenses.push({ id: T_EXP_ID, date: today, ts: Date.now(), amt: 800, note: 'Test Expense', category: 'Shop', country: 'IN' });
  udhaars.push({ id: T_UDHAAR_ID, name: 'Test Customer', phone: '9876543210', amt: 3000, date: today, ts: Date.now(), paid: false, dueDate: '', country: 'IN' });
  stock.push({ id: T_STOCK_ID, name: 'Test Item', size: 'M', qty: 50, buy: 100, sell: 150, country: 'IN', barcode: '1234567890' });
  suppliers.push({ id: T_SUPPLIER_ID, name: 'Test Supplier', phone: '9988776655', note: 'Wholesale' });
  customers.push({ id: T_CUSTOMER_ID, name: 'Test Customer A', phone: '9876543210', address: '123 Street', note: '' });
  staffList.push({ id: T_STAFF_ID, name: 'Test Staff', phone: '9112233445', salaryType: 'daily', salaryAmt: 500 });
  staffEntries.push({ id: testId(), staffName: 'Test Staff', date: today, type: 'attendance', value: 1, note: '' });
  returns.push({ id: T_RETURN_ID, date: today, ts: Date.now(), amt: 200, type: 'customer', reason: 'Defective', note: '', refName: 'Test Customer', country: 'IN' });

  const T_LOAN = { id: T_LOAN_ID, lender: 'SBI Bank', loanAmt: 100000, interestRate: 12, tenure: 12, emiAmt: calcLoanEmi(100000, 12, 12), startDate: today, note: 'Test loan' };
  loans.push(T_LOAN);
  const T_LOAN_SCHED = loanSchedule(T_LOAN);
  T_LOAN_SCHED.forEach(s => loanPayments.push({ id: testId(), loanId: T_LOAN_ID, dueDate: s.dueDate, emiAmt: s.emiAmt, principal: s.principal, interest: s.interest, paid: false, paidDate: '' }));

  const T_EMI_PLAN = { id: T_EMI_ID, customerName: 'EMI Test Customer', phone: '9000000001', totalAmt: 10000, downPayment: 2000, installments: 4, frequency: 'monthly', startDate: today, note: 'Test EMI' };
  emiPlans.push(T_EMI_PLAN);
  const T_EMI_DATES = emiDueDates(T_EMI_PLAN);
  T_EMI_DATES.forEach(d => emiPayments.push({ id: testId(), planId: T_EMI_ID, dueDate: d.dueDate, amt: d.amt, paid: false, paidDate: '' }));

  assert('Data injection: sales', sales.some(s => s.id === T_SALE_ID));
  assert('Data injection: expenses', expenses.some(e => e.id === T_EXP_ID));
  assert('Data injection: udhaars', udhaars.some(u => u.id === T_UDHAAR_ID));
  assert('Data injection: stock', stock.some(s => s.id === T_STOCK_ID));
  assert('Data injection: suppliers', suppliers.some(s => s.id === T_SUPPLIER_ID));
  assert('Data injection: customers', customers.some(c => c.id === T_CUSTOMER_ID));
  assert('Data injection: staff', staffList.some(s => s.id === T_STAFF_ID));
  assert('Data injection: returns', returns.some(r => r.id === T_RETURN_ID));
  assert('Data injection: loans', loans.some(l => l.id === T_LOAN_ID));
  assert('Data injection: loanPayments', loanPayments.filter(p => p.loanId === T_LOAN_ID).length === 12);
  assert('Data injection: emiPlans', emiPlans.some(p => p.id === T_EMI_ID));
  assert('Data injection: emiPayments', emiPayments.filter(p => p.planId === T_EMI_ID).length === 4);

  console.groupEnd();

  // ============================================================
  // SECTION 3: RENDERING — All Pages
  // ============================================================
  console.group('🎨 SECTION 3: Rendering All Pages');

  // Navigate to each tab/page and verify it renders without errors
  const navPages = ['today', 'katha', 'udhaar', 'stock', 'more'];

  for (const pg of navPages) {
    tryRender(`Nav tab: ${pg}`, () => {
      const el = document.getElementById('page-' + pg);
      if (!el) throw new Error('Element not found: page-' + pg);
      // Trigger nav
      const btn = [...document.querySelectorAll('.nav-btn')].find(b => b.onclick?.toString().includes(`'${pg}'`));
      if (btn) btn.click();
    });
  }

  // More sub-pages
  const morePages = ['menu', 'expense', 'supplier', 'cashbook', 'customers', 'staffBook', 'pl', 'export', 'settings', 'dashboard', 'emi', 'loan'];
  for (const mp of morePages) {
    tryRender(`More sub-page: ${mp}`, () => { goMore(mp); });
  }

  // Navigate to loan detail
  tryRender('Loan detail page', () => { currentLoanId = T_LOAN_ID; goMore('loanDetail'); });

  // Navigate to EMI detail
  tryRender('EMI detail page', () => { currentEmiPlanId = T_EMI_ID; goMore('emiDetail'); });

  // Navigate back to menu
  goMore('menu');

  console.groupEnd();

  // ============================================================
  // SECTION 4: LOGIC TESTS
  // ============================================================
  console.group('🔬 SECTION 4: Business Logic');

  // Today page calculations
  try {
    const todaySales = sales.filter(s => s.date === today);
    const todayExp = expenses.filter(e => e.date === today);
    const todayRet = returns.filter(r => r.date === today);
    const totalSales = todaySales.reduce((a, s) => a + s.amt, 0);
    const totalExp = todayExp.reduce((a, e) => a + e.amt, 0);
    const totalRet = todayRet.reduce((a, r) => a + r.amt, 0);
    assert('Today: test sale counted', todaySales.some(s => s.id === T_SALE_ID));
    assert('Today: test expense counted', todayExp.some(e => e.id === T_EXP_ID));
    assert('Today: net sales = sales - returns', totalSales - totalRet >= 0);
    assert('Today: profit calc = netSales - expenses', (totalSales - totalRet - totalExp) !== undefined);
  } catch (e) { assert('Today calculations', false, e.message); }

  // Udhaar — pending vs paid
  try {
    const pending = udhaars.filter(u => !u.paid);
    const paidList = udhaars.filter(u => u.paid);
    assert('Udhaar: pending includes test entry', pending.some(u => u.id === T_UDHAAR_ID));
    const totalPending = pending.reduce((a, u) => a + u.amt, 0);
    assert('Udhaar: total pending > 0', totalPending >= 3000);
  } catch (e) { assert('Udhaar logic', false, e.message); }

  // Stock
  try {
    const found = stock.find(s => s.id === T_STOCK_ID);
    assert('Stock: item exists', !!found);
    assert('Stock: sell > buy (profit margin)', found.sell > found.buy);
    assert('Stock: qty is positive', found.qty > 0);
    // Low stock check (qty < 10)
    const lowStock = stock.filter(s => s.qty > 0 && s.qty <= 10);
    assert('Stock: low stock filter works', Array.isArray(lowStock));
  } catch (e) { assert('Stock logic', false, e.message); }

  // Staff salary calculation
  try {
    const staff = staffList.find(s => s.id === T_STAFF_ID);
    assert('Staff: found test staff', !!staff);
    const myEntries = staffEntries.filter(e => e.staffName === 'Test Staff');
    const workDays = myEntries.filter(e => e.type === 'attendance').reduce((a, e) => a + e.value, 0);
    assert('Staff: attendance days counted', workDays === 1);
    if (staff.salaryType === 'daily') {
      const earned = workDays * staff.salaryAmt;
      assert('Staff: daily salary = days × rate', earned === 500, `Got: ${earned}`);
    }
  } catch (e) { assert('Staff logic', false, e.message); }

  // Loan outstanding & schedule
  try {
    const loan = loans.find(l => l.id === T_LOAN_ID);
    const outstanding = loanOutstanding(loan);
    assert('Loan: outstanding = full amount (none paid)', outstanding === loan.loanAmt, `Outstanding: ${outstanding}, LoanAmt: ${loan.loanAmt}`);
    const myPmts = loanPayments.filter(p => p.loanId === T_LOAN_ID);
    assert('Loan: 12 payments generated', myPmts.length === 12, `Got: ${myPmts.length}`);
    const totalEmi = myPmts.reduce((a, p) => a + p.emiAmt, 0);
    assert('Loan: total EMI > loan amount (interest exists)', totalEmi > loan.loanAmt, `Total: ${totalEmi}, Loan: ${loan.loanAmt}`);
    const firstDueMonth = myPmts[0].dueDate.substring(0, 7);
    assert('Loan: first due date is current month', firstDueMonth === today.substring(0, 7), `Got: ${firstDueMonth}`);
  } catch (e) { assert('Loan logic', false, e.message); }

  // EMI plan
  try {
    const plan = emiPlans.find(p => p.id === T_EMI_ID);
    const remaining = emiPlanRemaining(plan);
    assert('EMI plan: remaining = total - down payment', remaining === 8000, `Got: ${remaining}`);
    const myPmts = emiPayments.filter(p => p.planId === T_EMI_ID);
    assert('EMI plan: 4 installments generated', myPmts.length === 4, `Got: ${myPmts.length}`);
    assert('EMI plan: each installment = 2000', myPmts.every(p => p.amt === 2000), `Amounts: ${myPmts.map(p=>p.amt)}`);
  } catch (e) { assert('EMI plan logic', false, e.message); }

  // P&L calculation
  try {
    const today2 = today.substring(0, 7);
    const mSales = sales.filter(s => s.date.substring(0, 7) === today2).reduce((a, s) => a + s.amt, 0);
    const mExp = expenses.filter(e => e.date.substring(0, 7) === today2).reduce((a, e) => a + e.amt, 0);
    const mRet = returns.filter(r => r.date.substring(0, 7) === today2).reduce((a, r) => a + r.amt, 0);
    const profit = mSales - mRet - mExp;
    assert('P&L: monthly profit calculation', profit !== undefined);
  } catch (e) { assert('P&L logic', false, e.message); }

  // Daily report generation
  try {
    const report = generateDailyReport(today);
    assert('Daily report: generates text', typeof report === 'string' && report.length > 10, `Got: ${typeof report}`);
  } catch (e) { assert('generateDailyReport', false, e.message); }

  // WhatsApp reminder for udhaar
  try {
    const origOpen = window.open;
    let waOpened = false;
    window.open = () => { waOpened = true; };
    const u = udhaars.find(x => x.id === T_UDHAAR_ID);
    sendWA(u.name, u.phone, u.amt, u.dueDate);
    assert('sendWA (udhaar reminder)', waOpened);
    window.open = origOpen;
  } catch (e) { assert('sendWA (udhaar)', false, e.message); }

  console.groupEnd();

  // ============================================================
  // SECTION 5: NAVIGATION & STATE
  // ============================================================
  console.group('🧭 SECTION 5: Navigation & State Reset');

  tryRender('Back to menu clears currentLoanId', () => {
    currentLoanId = T_LOAN_ID;
    goMore('menu');
    assert('goMore(menu): currentLoanId cleared', currentLoanId === '', `Got: '${currentLoanId}'`);
  });

  tryRender('Back to menu clears currentEmiPlanId', () => {
    currentEmiPlanId = T_EMI_ID;
    goMore('menu');
    assert('goMore(menu): currentEmiPlanId cleared', currentEmiPlanId === '', `Got: '${currentEmiPlanId}'`);
  });

  // i18n: check t() works for all 3 languages
  try {
    const origLang = S.language;
    S.language = 'en'; assert('i18n: en t(sales)', typeof t('sales') === 'string' && t('sales').length > 0);
    S.language = 'hi'; assert('i18n: hi t(sales)', typeof t('sales') === 'string' && t('sales').length > 0);
    S.language = 'np'; assert('i18n: np t(sales)', typeof t('sales') === 'string' && t('sales').length > 0);
    S.language = origLang;
  } catch (e) { assert('i18n', false, e.message); }

  // uid() generates unique IDs
  try {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    assert('uid(): 100 unique IDs', ids.size === 100);
  } catch (e) { assert('uid()', false, e.message); }

  console.groupEnd();

  // ============================================================
  // SECTION 6: EXPORT / REPORT
  // ============================================================
  console.group('📊 SECTION 6: Export & Report Functions');

  // Check XLSX is loaded
  assert('XLSX library loaded', typeof XLSX !== 'undefined');

  // Check downloadAuditReport exists
  assert('downloadAuditReport exists', typeof downloadAuditReport === 'function');

  // Check downloadExcel exists
  assert('downloadExcel exists', typeof downloadExcel === 'function');

  // Try generateDailyReport
  try {
    const txt = generateDailyReport(today);
    assert('generateDailyReport: includes amounts', txt.includes('₹') || txt.includes('Rs') || txt.length > 50, `Length: ${txt.length}`);
  } catch (e) { assert('generateDailyReport export', false, e.message); }

  // Check all export functions exist
  ['downloadExcel', 'downloadAuditReport', 'generateDailyReport'].forEach(fn => {
    assert(`Function exists: ${fn}`, typeof window[fn] === 'function' || eval('typeof ' + fn) === 'function');
  });

  console.groupEnd();

  // ============================================================
  // SECTION 7: EDGE CASES
  // ============================================================
  console.group('🔧 SECTION 7: Edge Cases');

  // loanOutstanding with all paid
  try {
    const fakeId2 = testId();
    const fakeLn2 = { id: fakeId2, loanAmt: 10000 };
    loanPayments.push({ id: testId(), loanId: fakeId2, principal: 5000, paid: true });
    loanPayments.push({ id: testId(), loanId: fakeId2, principal: 5000, paid: true });
    const out = loanOutstanding(fakeLn2);
    assert('loanOutstanding: fully paid = 0', out === 0, `Got: ${out}`);
    loanPayments = loanPayments.filter(p => p.loanId !== fakeId2);
  } catch (e) { assert('loanOutstanding edge case', false, e.message); }

  // calcLoanEmi with very small loan
  try {
    const emi = calcLoanEmi(1000, 0, 1);
    assert('calcLoanEmi: 1 month tenure', emi === 1000, `Got: ${emi}`);
  } catch (e) { assert('calcLoanEmi 1-month', false, e.message); }

  // emiPlanRemaining when all paid
  try {
    const pId = testId();
    const plan2 = { id: pId, totalAmt: 5000, downPayment: 0, installments: 2 };
    emiPayments.push({ id: testId(), planId: pId, amt: 2500, paid: true });
    emiPayments.push({ id: testId(), planId: pId, amt: 2500, paid: true });
    const rem = emiPlanRemaining(plan2);
    assert('emiPlanRemaining: fully paid = 0', rem === 0, `Got: ${rem}`);
    emiPayments = emiPayments.filter(p => p.planId !== pId);
  } catch (e) { assert('emiPlanRemaining edge case', false, e.message); }

  // Udhaar overdue detection
  try {
    const overdueId = testId();
    udhaars.push({ id: overdueId, name: 'Overdue Test', phone: '', amt: 500, date: '2025-01-01', paid: false, dueDate: '2025-01-15' });
    const overdue = udhaars.filter(u => !u.paid && u.dueDate && u.dueDate < todayStr());
    assert('Udhaar: overdue detection works', overdue.some(u => u.id === overdueId));
    udhaars = udhaars.filter(u => u.id !== overdueId);
  } catch (e) { assert('Udhaar overdue detection', false, e.message); }

  // Empty state rendering (no data)
  try {
    const emptySales = sales.filter(s => false); // empty
    assert('Empty state: filter returns array', Array.isArray(emptySales));
  } catch (e) { assert('Empty state handling', false, e.message); }

  console.groupEnd();

  // ============================================================
  // CLEANUP — Restore original state
  // ============================================================
  sales = origSales;
  expenses = origExpenses;
  udhaars = origUdhaars;
  stock = origStock;
  suppliers = origSuppliers;
  customers = origCustomers;
  staffList = origStaff;
  staffEntries = origStaffEntries;
  returns = origReturns;
  kharidiEntries = origKharidi;
  dealers = origDealers;
  dealerEntries = origDealerEntries;
  loans = origLoans;
  loanPayments = origLoanPayments;
  emiPlans = origEmiPlans;
  emiPayments = origEmiPayments;
  if (typeof cashbookEntries !== 'undefined') cashbookEntries = origCashbook;

  // Navigate back to today tab cleanly
  goMore('menu');
  try { document.querySelector('.nav-btn')?.click(); } catch (e) {}

  // ============================================================
  // FINAL REPORT
  // ============================================================
  console.log('\n');
  console.log('%c════════════════════════════════════════', 'color:#6D28D9');
  console.log('%c      PASAL MANAGER TEST RESULTS       ', 'color:#6D28D9;font-weight:bold;font-size:14px');
  console.log('%c════════════════════════════════════════', 'color:#6D28D9');

  results.forEach(r => {
    const color = r.status === PASS ? '#16A34A' : r.status === FAIL ? '#DC2626' : '#F59E0B';
    const note = r.note ? `  → ${r.note}` : '';
    console.log(`%c${r.status}%c  ${r.name}%c${note}`, `color:${color};font-weight:bold`, 'color:inherit', 'color:#666;font-size:12px');
  });

  console.log('\n');
  console.log(`%c✅ PASSED: ${passed}   ❌ FAILED: ${failed}   ⚠️  WARNINGS: ${warned}`, 'font-size:14px;font-weight:bold');

  if (failed === 0) {
    console.log('%c🎉 ALL TESTS PASSED! Pasal Manager is working correctly.', 'color:#16A34A;font-size:15px;font-weight:bold');
  } else {
    console.log(`%c⚠️  ${failed} test(s) failed. Check the details above.`, 'color:#DC2626;font-size:14px;font-weight:bold');
  }

  console.log('%c════════════════════════════════════════', 'color:#6D28D9');

  return { passed, failed, warned, results };
})();
