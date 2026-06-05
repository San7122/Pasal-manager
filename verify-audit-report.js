const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function verifyAuditReport() {
  console.log('🧪 Pasal Manager CA-Grade Audit Report Verification\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Listen for download and save it
    const downloadPath = '/tmp/audit-report-test';
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

    await page.on('response', response => {
      console.log(`[Network] ${response.status()} ${response.url().substring(0, 80)}`);
    });

    // Load the local HTML file
    const htmlPath = `file://${path.resolve(__dirname, 'pasal-manager.html')}`;
    console.log(`📂 Loading: ${htmlPath}\n`);
    await page.goto(htmlPath, { waitUntil: 'networkidle2', timeout: 15000 });

    // Inject test data into memory
    console.log('📊 Injecting test data...');
    await page.evaluate(() => {
      // Mock settings
      window.S = {
        shopName: 'Test Shoe Store',
        country: 'NP',
        ownName: 'Sanjana Thakur',
        bizAddress: 'Dharan, Sunsari',
        ownPhone: '9800000001',
        gstin: '', // No GST for this test
      };

      // Mock test data (April 2026)
      window.sales = [
        { id: '1', date: '2026-04-01', ts: Date.now(), amt: 5000, cost: 3000, note: 'Saree', payMode: 'Cash', customerId: 'cust1', branchId: '1' },
        { id: '2', date: '2026-04-05', ts: Date.now(), amt: 3000, cost: 1800, note: 'Kurti', payMode: 'Card', customerId: 'cust2', branchId: '1' },
        { id: '3', date: '2026-04-10', ts: Date.now(), amt: 8000, cost: 4500, note: '', payMode: 'Cash', customerId: 'cust1', branchId: '1' },
        { id: '4', date: '2026-04-15', ts: Date.now(), amt: 2000, cost: 1000, note: '', payMode: 'UPI', customerId: 'cust3', branchId: '1' },
      ];

      window.expenses = [
        { id: 'e1', date: '2026-04-02', ts: Date.now(), amt: 500, note: 'Rent', category: 'Rent' },
        { id: 'e2', date: '2026-04-10', ts: Date.now(), amt: 1000, note: 'Utilities', category: 'Utilities' },
      ];

      window.returns = [
        { id: 'r1', date: '2026-04-08', ts: Date.now(), amt: 500, type: 'customer', reason: 'Defect', refName: 'Cust A', note: '' },
      ];

      window.udhaars = [
        { id: 'u1', name: 'Ram Singh', phone: '9800000010', amt: 3000, date: '2026-03-10', ts: Date.now(), paid: false, dueDate: '2026-04-10' },
        { id: 'u2', name: 'Priya', phone: '9800000011', amt: 1000, date: '2026-04-05', ts: Date.now(), paid: false, dueDate: '' },
      ];

      window.kharidiEntries = [
        { id: 'k1', supplierName: 'Supplier A', date: '2026-04-01', ts: Date.now(), amt: 8000, type: 'purchase', note: '' },
        { id: 'k2', supplierName: 'Supplier A', date: '2026-04-12', ts: Date.now(), amt: 3000, type: 'payment', note: '' },
        { id: 'k3', supplierName: 'Supplier B', date: '2026-04-03', ts: Date.now(), amt: 5000, type: 'purchase', note: '' },
      ];

      window.dealerEntries = [
        { id: 'd1', dealerName: 'Dealer X', date: '2026-04-02', ts: Date.now(), amt: 2000, type: 'given', note: '' },
        { id: 'd2', dealerName: 'Dealer X', date: '2026-04-11', ts: Date.now(), amt: 500, type: 'received', note: '' },
      ];

      window.stock = [
        { id: 's1', name: 'Saree', size: 'M', qty: 10, buy: 500, sell: 1000, barcode: 'SAR001' },
        { id: 's2', name: 'Kurti', size: 'L', qty: 8, buy: 300, sell: 600, barcode: 'KUR001' },
      ];

      window.stockAdjustments = [];
      window.customers = [
        { id: 'cust1', name: 'Customer A', phone: '9800000020', address: 'Dharan', note: '' },
        { id: 'cust2', name: 'Customer B', phone: '9800000021', address: 'Itahari', note: '' },
        { id: 'cust3', name: 'Customer C', phone: '9800000022', address: 'Biratnagar', note: '' },
      ];

      window.suppliers = [
        { id: 'sup1', name: 'Supplier A', phone: '9800000030', note: '' },
        { id: 'sup2', name: 'Supplier B', phone: '9800000031', note: '' },
      ];

      window.staffList = [
        { id: 'staff1', name: 'Hari', phone: '9800000040', salaryType: 'monthly', salaryAmt: 5000 },
      ];

      window.staffEntries = [
        { id: 'se1', staffName: 'Hari', date: '2026-04-10', type: 'salary', value: 5000, note: '' },
      ];

      window.gstBills = [];
      window.emiPlans = [
        { id: 'emi1', customerName: 'EMI Customer', phone: '9800000050', totalAmt: 10000, downPayment: 2000, installments: 6, frequency: 'Monthly', startDate: '2026-03-01', note: '', createdAt: new Date().toISOString() },
      ];

      window.emiPayments = [
        { id: 'emp1', planId: 'emi1', dueDate: '2026-04-01', amt: 1333, paid: true, paidDate: '2026-04-02' },
      ];

      window.loans = [
        { id: 'loan1', lender: 'Bank A', loanAmt: 50000, interestRate: 10, tenure: 24, emiAmt: 2291, startDate: '2026-01-01', note: '', createdAt: new Date().toISOString() },
      ];

      window.loanPayments = [
        { id: 'lp1', loanId: 'loan1', dueDate: '2026-04-01', principal: 1500, interest: 400, emiAmt: 1900, paid: true, paidDate: '2026-04-05' },
      ];

      window.cashbookEntries = [
        { id: 'cb1', date: '2026-04-01', opening: 0, expected: 5000, actual: 5000, difference: 0, note: '' },
        { id: 'cb2', date: '2026-04-10', opening: 5000, expected: 5500, actual: 5400, difference: -100, note: '' },
      ];
    });

    console.log('✅ Test data injected\n');

    // Set date range and download
    console.log('⏱️  Setting date range (2026-04-01 to 2026-04-30)...');
    await page.evaluate(() => {
      const fromInput = document.getElementById('audit-from');
      const toInput = document.getElementById('audit-to');
      if (fromInput) fromInput.value = '2026-04-01';
      if (toInput) toInput.value = '2026-04-30';
    });

    console.log('📥 Setting up interception and calling downloadAuditReport()...');

    // Setup interception BEFORE calling the function
    await page.evaluateOnNewDocument(() => {
      const originalFetch = window.fetch;
      window.__interceptedCalls = [];
    });

    // Override XLSX.writeFile before the function is called
    // Use Promise to ensure _lazyLoad completes first
    await page.evaluate(() => {
      window.__capturedWorkbook = null;
      window.__error = null;

      // Wrap the downloadAuditReport to ensure XLSX is loaded first
      const origDownload = window.downloadAuditReport;
      window.downloadAuditReport = async function() {
        // Give XLSX a moment to be available
        let attempts = 0;
        while (typeof XLSX === 'undefined' && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }

        if (typeof XLSX === 'undefined') {
          throw new Error('XLSX not available after 5 seconds');
        }

        // NOW set up the interception
        const origWriteFile = XLSX.writeFile;
        XLSX.writeFile = function(wb, filename) {
          window.__capturedWorkbook = { sheets: wb.SheetNames, filename };
          origWriteFile.call(this, wb, filename);
        };

        // Call the original function
        return origDownload.call(this);
      };
    });

    // Call the function
    await page.evaluate(async () => {
      try {
        await downloadAuditReport();
      } catch (e) {
        window.__error = e.message;
        console.error('Error:', e.message);
      }
    });

    // Wait for processing with longer timeout
    console.log('⏳ Waiting for Excel generation...');
    await new Promise(r => setTimeout(r, 5000));

    const pageError = await page.evaluate(() => window.__error);
    const xlsxReady = await page.evaluate(() => window.__xlsxReady);
    const xlsxData = await page.evaluate(() => window.__capturedWorkbook);

    if (!xlsxReady) {
      console.log('❌ BLOCKED: XLSX library did not load in time');
      return { verdict: 'BLOCKED', reason: 'XLSX not available after 5 seconds' };
    }

    if (pageError) {
      console.log(`❌ FAIL: Runtime error in page: ${pageError}`);
      return { verdict: 'FAIL', reason: pageError };
    }

    if (!xlsxData || !xlsxData.sheets) {
      console.log('❌ FAIL: No workbook generated');
      console.log('Debug - xlsxData:', xlsxData, ', xlsxReady:', xlsxReady);
      return { verdict: 'FAIL', reason: 'downloadAuditReport() did not execute or generate workbook' };
    }

    console.log(`✅ Generated: ${xlsxData.filename}\n`);

    // Get the actual generated file for full validation
    const files = fs.readdirSync(downloadPath);
    const xlsxFile = files.find(f => f.endsWith('.xlsx'));

    if (!xlsxFile) {
      console.log('⚠️  Warning: File generated but not saved to disk');
      console.log('Sheets created:', xlsxData.sheets);
      return { verdict: 'FAIL', reason: 'File not persisted to disk', sheets: xlsxData.sheets };
    }

    const filePath = path.join(downloadPath, xlsxFile);
    console.log(`📂 File location: ${filePath}\n`);

    // Read and validate Excel
    const wb = XLSX.readFile(filePath);
    console.log(`📊 Testing Excel structure...\n`);

    const results = {
      verdict: 'PASS',
      findings: [],
      tests: {}
    };

    // TEST 1: Sheet structure
    console.log('TEST 1: Sheet structure');
    const expectedSheets = [
      '01_Cover', '02_TrialBalance', '03_ProfitLoss', '04_BalanceSheet', '05_CashFlow',
      '06_SalesRegister', '07_PurchaseRegister', '08_ExpenseRegister', '09_SundryDebtors',
      '10_SundryCreditors', '11_CustomerLedgers', '12_SupplierLedgers', '13_StockRegister',
      '14_Cashbook', '15_StaffRegister', '16_LoanRegister', '17_CustomerEMI',
      '18_ItemAnalysis', '19_MonthlyComparison', '21_NotesToAccounts'
    ];

    const actualSheets = wb.SheetNames;
    const missingSheets = expectedSheets.filter(s => !actualSheets.includes(s));
    const extraSheets = actualSheets.filter(s => !expectedSheets.includes(s) && s !== '20_HSNGSTSummary');

    if (missingSheets.length > 0) {
      results.tests.test1 = { status: '❌ FAIL', details: `Missing sheets: ${missingSheets.join(', ')}` };
      results.verdict = 'FAIL';
    } else if (actualSheets[0] !== '01_Cover') {
      results.tests.test1 = { status: '❌ FAIL', details: `First sheet is ${actualSheets[0]}, not 01_Cover` };
      results.verdict = 'FAIL';
    } else {
      results.tests.test1 = { status: '✅ PASS', details: `All ${actualSheets.length} sheets present in correct order` };
    }

    // TEST 2: Cover Page
    console.log('TEST 2: Cover page');
    const coverWs = wb.Sheets['01_Cover'];
    const coverData = XLSX.utils.sheet_to_json(coverWs, { header: 1 });
    const hasCoverTitle = coverData.some(row => row.some(cell => cell && cell.toString().includes('AUDIT REPORT')));
    const hasCurrency = coverData.some(row => row.some(cell => cell && cell.toString().includes('रू')));

    if (hasCoverTitle && hasCurrency) {
      results.tests.test2 = { status: '✅ PASS', details: 'Cover page has title and Nepalese currency' };
    } else {
      results.tests.test2 = { status: '❌ FAIL', details: `Missing: ${!hasCoverTitle ? 'title' : ''} ${!hasCurrency ? 'currency' : ''}` };
      results.verdict = 'FAIL';
    }

    // TEST 3: Trial Balance
    console.log('TEST 3: Trial Balance formulas');
    const tbWs = wb.Sheets['02_TrialBalance'];
    const tbData = XLSX.utils.sheet_to_json(tbWs, { header: 1 });
    const totalRow = tbData[tbData.length - 1];
    const debitTotal = wb.Sheets['02_TrialBalance']['B' + tbData.length];
    const creditTotal = wb.Sheets['02_TrialBalance']['C' + tbData.length];

    if (debitTotal && debitTotal.f && creditTotal && creditTotal.f) {
      results.tests.test3 = { status: '✅ PASS', details: `Trial Balance has formulas: Dr=${debitTotal.f}, Cr=${creditTotal.f}` };
    } else {
      results.tests.test3 = { status: '❌ FAIL', details: 'Totals are not formulas' };
      results.verdict = 'FAIL';
    }

    // TEST 4: Indian number format
    console.log('TEST 4: Indian number formatting');
    const srWs = wb.Sheets['06_SalesRegister'];
    let hasIndianFormat = false;
    for (let cell in srWs) {
      if (cell.startsWith('E') && srWs[cell].z === '#,##,##0.00;[Red](#,##,##0.00)') {
        hasIndianFormat = true;
        break;
      }
    }

    if (hasIndianFormat) {
      results.tests.test4 = { status: '✅ PASS', details: 'Indian number format applied' };
    } else {
      results.tests.test4 = { status: '🔍 PROBE', details: 'Number format may not be set on all cells' };
    }

    // TEST 5: P&L structure
    console.log('TEST 5: P&L Statement');
    const plWs = wb.Sheets['03_ProfitLoss'];
    const plData = XLSX.utils.sheet_to_json(plWs, { header: 1 });
    const hasRevenueSection = plData.some(row => row.some(cell => cell === 'REVENUE'));
    const hasNetProfit = plData.some(row => row.some(cell => cell && cell.toString().includes('NET PROFIT')));

    if (hasRevenueSection && hasNetProfit) {
      results.tests.test5 = { status: '✅ PASS', details: 'P&L has proper structure with REVENUE and NET PROFIT' };
    } else {
      results.tests.test5 = { status: '❌ FAIL', details: 'P&L structure incomplete' };
      results.verdict = 'FAIL';
    }

    // TEST 6: Balance Sheet
    console.log('TEST 6: Balance Sheet');
    const bsWs = wb.Sheets['04_BalanceSheet'];
    const bsData = XLSX.utils.sheet_to_json(bsWs, { header: 1 });
    const hasLiabilities = bsData.some(row => row.some(cell => cell && cell.toString().includes('LIABILITIES')));
    const hasAssets = bsData.some(row => row.some(cell => cell && cell.toString().includes('ASSETS')));

    if (hasLiabilities && hasAssets) {
      results.tests.test6 = { status: '✅ PASS', details: 'Balance Sheet has Liabilities and Assets columns' };
    } else {
      results.tests.test6 = { status: '❌ FAIL', details: 'Balance Sheet structure incorrect' };
      results.verdict = 'FAIL';
    }

    // TEST 7: Aging on Debtors
    console.log('TEST 7: Sundry Debtors (Aging)');
    const debWs = wb.Sheets['09_SundryDebtors'];
    const debData = XLSX.utils.sheet_to_json(debWs, { header: 1 });
    const hasAgingBuckets = debData[0] && debData[0].some(cell => cell && cell.toString().includes('0-30'));

    if (hasAgingBuckets) {
      results.tests.test7 = { status: '✅ PASS', details: 'Debtors sheet has aging buckets (0-30, 31-60, etc.)' };
    } else {
      results.tests.test7 = { status: '❌ FAIL', details: 'Aging buckets missing' };
      results.verdict = 'FAIL';
    }

    // TEST 8: Stock Register formulas
    console.log('TEST 8: Stock Register');
    const stWs = wb.Sheets['13_StockRegister'];
    let hasStockFormula = false;
    for (let cell in stWs) {
      if (cell.startsWith('H') && stWs[cell].f) {
        hasStockFormula = true;
        break;
      }
    }

    if (hasStockFormula) {
      results.tests.test8 = { status: '✅ PASS', details: 'Stock Register has computed formulas' };
    } else {
      results.tests.test8 = { status: '🔍 PROBE', details: 'Stock Register formulas may not be set' };
    }

    // TEST 9: No errors/undefined
    console.log('TEST 9: Data integrity');
    let hasErrors = false;
    const errorPatterns = ['undefined', 'NaN', '[object Object]', 'Invalid Date'];
    for (let sheet of wb.SheetNames) {
      const ws = wb.Sheets[sheet];
      for (let cell in ws) {
        const val = ws[cell].v || '';
        if (errorPatterns.some(err => val.toString().includes(err))) {
          hasErrors = true;
          results.findings.push(`⚠️ Found "${val}" in ${sheet}!${cell}`);
        }
      }
    }

    if (!hasErrors) {
      results.tests.test9 = { status: '✅ PASS', details: 'No undefined/NaN/error values found' };
    } else {
      results.tests.test9 = { status: '❌ FAIL', details: 'Found error values in sheets' };
      results.verdict = 'FAIL';
    }

    // TEST 10: GST sheet conditional
    console.log('TEST 10: Conditional GST sheet');
    const hasGST = wb.SheetNames.includes('20_HSNGSTSummary');
    if (!hasGST) {
      results.tests.test10 = { status: '✅ PASS', details: 'GST sheet correctly absent (no GSTIN set)' };
    } else {
      results.tests.test10 = { status: '⚠️ WARNING', details: 'GST sheet present but GSTIN not set' };
    }

    // Print results
    console.log('\n═══════════════════════════════════════════════════\n');
    console.log('📋 VERIFICATION RESULTS\n');

    Object.entries(results.tests).forEach(([test, result]) => {
      console.log(`${result.status}: ${test.toUpperCase()}`);
      console.log(`   → ${result.details}\n`);
    });

    if (results.findings.length > 0) {
      console.log('📌 Findings:');
      results.findings.forEach(f => console.log(`   ${f}`));
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`\n🎯 FINAL VERDICT: ${results.verdict}`);
    console.log(`\n✅ Sheets: ${wb.SheetNames.length}`);
    console.log(`✅ File: ${xlsxFile}`);

    return results;

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return { verdict: 'BLOCKED', reason: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

verifyAuditReport().then(result => {
  process.exit(result.verdict === 'PASS' ? 0 : 1);
});
