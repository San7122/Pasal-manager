const puppeteer = require('puppeteer');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, 'pasal-manager.html');
const G='\x1b[32m✓\x1b[0m', R='\x1b[31m✗\x1b[0m', Y='\x1b[33m⚠\x1b[0m';
let passed=0, failed=0, warned=0;
const failures=[];
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function test(label, fn) {
  try { await fn(); console.log(`  ${G} ${label}`); passed++; }
  catch(e) { const m=e.message.replace(/\n/g,' ').slice(0,120); console.log(`  ${R} ${label}\n     → ${m}`); failed++; failures.push({label,error:m}); }
}
async function warn(label, fn) {
  try { await fn(); console.log(`  ${G} ${label}`); passed++; }
  catch(e) { console.log(`  ${Y} ${label}: ${e.message.slice(0,80)}`); warned++; }
}
const vis = (page, sel, t=5000) => page.waitForSelector(sel,{visible:true,timeout:t});
const click = async (page, sel, w=500) => { await page.click(sel); await sleep(w); };

async function run() {
  const browser = await puppeteer.launch({headless:true, args:['--no-sandbox','--disable-setuid-sandbox','--disable-web-security']});
  const page = await browser.newPage();
  page.setDefaultTimeout(7000);
  await page.setViewport({width:390,height:844});
  const jsErrors=[];
  page.on('console', m=>{ if(m.type()==='error') jsErrors.push(m.text()); });
  page.on('pageerror', e=>jsErrors.push('PAGE: '+e.message));

  console.log('\n\x1b[1mPasal Manager — E2E Test Suite\x1b[0m');
  console.log('═'.repeat(52));

  // [1] Load
  console.log('\n\x1b[1m[1] Page Load\x1b[0m');
  await page.goto(FILE,{waitUntil:'domcontentloaded'});
  await sleep(2000);
  await test('Auth page visible', ()=>vis(page,'#auth-page'));
  await test('Login/SignUp tabs present', async()=>{ await vis(page,'#tab-login'); await vis(page,'#tab-signup'); });
  await test('Guest button present', ()=>vis(page,'.btn-guest'));

  // [2] Guest mode
  console.log('\n\x1b[1m[2] Guest Mode\x1b[0m');
  await test('Click Guest → shop name prompt', async()=>{ await click(page,'.btn-guest',800); await vis(page,'#guest-setup'); });
  await test('Shop name input visible', ()=>vis(page,'#guest-shop-input'));
  await test('Confirm guest → app launches', async()=>{
    await page.focus('#guest-shop-input');
    await page.type('#guest-shop-input','Test Shop');
    await click(page,'#guest-start-btn',2500);
    const d = await page.$eval('#app', el=>el.style.display);
    if(d==='none') throw new Error('App div still hidden');
  });
  await test('Today tab active', ()=>vis(page,'#page-today.active'));
  await test('Bottom nav present', ()=>vis(page,'.bottom-nav'));
  await test('Guest banner shown', ()=>vis(page,'.guest-banner'));

  // [3] Tab nav
  console.log('\n\x1b[1m[3] Tab Navigation\x1b[0m');
  for(const tab of ['katha','udhaar','stock','more']) {
    await test(`Nav → ${tab}`, async()=>{ await click(page,`#nav-${tab}`,700); await vis(page,`#page-${tab}.active`); });
  }
  await click(page,'#nav-today',500);

  // [4] Sales
  console.log('\n\x1b[1m[4] Sales\x1b[0m');
  await test('Sale amount input (#s-amt) present', ()=>vis(page,'#s-amt'));
  await test('Add sale Rs 500', async()=>{
    await page.evaluate(()=>{ document.getElementById('s-amt').value=''; });
    await page.type('#s-amt','500');
    await click(page,'#btn-add-sale',1000);
    const items = await page.$$('#page-today .list-item');
    if(items.length===0) throw new Error('No list-items after add');
  });
  await test('Today hero amount updates', async()=>{
    const text = await page.$eval('.today-hero-amt', el=>el.textContent).catch(()=>'');
    if(!text.includes('500')&&!text.includes('5,')) throw new Error('Hero amount: '+text);
  });

  // [5] Udhaar
  console.log('\n\x1b[1m[5] Udhaar\x1b[0m');
  await click(page,'#nav-udhaar',600);
  await test('Udhaar inputs present', async()=>{ await vis(page,'#u-name'); await vis(page,'#u-amt'); });
  await test('Add udhaar (Ram Kumar Rs 200)', async()=>{
    await page.type('#u-name','Ram Kumar');
    await page.type('#u-amt','200');
    await click(page,'#btn-add-udhaar',1000);
    const items = await page.$$('#page-udhaar .list-item');
    if(items.length===0) throw new Error('No udhaar items after add');
  });

  // [6] Stock
  console.log('\n\x1b[1m[6] Stock\x1b[0m');
  await click(page,'#nav-stock',600);
  await test('Stock name input present', ()=>vis(page,'#st-name'));
  await test('Add stock (Sugar)', async()=>{
    await page.type('#st-name','Sugar');
    const q=await page.$('#st-qty'); if(q) await page.type('#st-qty','10');
    const p2=await page.$('#st-price'); if(p2) await page.type('#st-price','50');
    await click(page,'#btn-add-stock',1000);
    const items = await page.$$('#page-stock .list-item');
    if(items.length===0) throw new Error('No stock items after add');
  });

  // [7] More sub-pages
  console.log('\n\x1b[1m[7] More Sub-Pages\x1b[0m');
  await click(page,'#nav-more',600);
  await test('More menu items rendered', async()=>{
    const items = await page.$$('.more-menu-item');
    if(items.length===0) throw new Error('No .more-menu-item elements');
  });
  const morePages=[
    {id:'expense',label:'Expense',check:'#e-amt'},
    {id:'supplier',label:'Suppliers',check:null},
    {id:'export',label:'Export',check:'#audit-from'},
    {id:'score',label:'Business Score',check:null},
    {id:'morning',label:'Morning Dashboard',check:null},
    {id:'supplier-cal',label:'Supplier Calendar',check:null},
    {id:'reminders',label:'Smart Reminders',check:null},
    {id:'pl',label:'P&L',check:null},
    {id:'cashbook',label:'Cashbook',check:null},
    {id:'customers',label:'Customers',check:'#cust-search'},
    {id:'branches',label:'Branches',check:null},
    {id:'settings',label:'Settings',check:null},
  ];
  for(const p of morePages) {
    await test(`More → ${p.label}`, async()=>{
      await page.evaluate(id=>goMore(id), p.id); await sleep(700);
      const html = await page.$eval('#page-more', el=>el.innerHTML);
      if(html.length<80) throw new Error('Page empty (<80 chars)');
      if(!html.includes('back-btn')&&!html.includes('Back')) throw new Error('No back button');
      if(p.check) await vis(page,p.check,3000);
    });
  }

  // [8] Expense add
  console.log('\n\x1b[1m[8] Expense Form\x1b[0m');
  await page.evaluate(()=>goMore('expense')); await sleep(600);
  await test('Expense input present', ()=>vis(page,'#e-amt'));
  await test('Add expense Rs 150', async()=>{
    await page.type('#e-amt','150');
    await click(page,'#btn-add-exp',1000);
    const html = await page.$eval('#page-more', el=>el.innerHTML);
    if(html.length<80) throw new Error('Expense page empty after add');
  });

  // [9] Back button
  console.log('\n\x1b[1m[9] Back Button\x1b[0m');
  for(const id of ['export','score','customers','supplier-cal']) {
    await test(`Back from "${id}"`, async()=>{
      await page.evaluate(x=>goMore(x),id); await sleep(400);
      const btn = await page.$('.back-btn');
      if(!btn) throw new Error('No .back-btn found');
      await btn.click(); await sleep(500);
      const html = await page.$eval('#page-more', el=>el.innerHTML);
      if(!html.includes('more-menu-item')) throw new Error('Did not return to menu');
    });
  }

  // [10] Delete confirm
  console.log('\n\x1b[1m[10] Delete / Confirm Flow\x1b[0m');
  await click(page,'#nav-today',500);
  await test('Delete trigger on sale item', async()=>{
    const del = await page.$('#page-today .del-btn, #page-today [onclick*="confirmId"]');
    if(!del) throw new Error('No delete trigger on sale items');
  });
  await test('Confirm row appears + cancel works', async()=>{
    const del = await page.$('#page-today .del-btn, #page-today [onclick*="confirmId"]');
    if(!del) throw new Error('No delete trigger');
    await del.click(); await sleep(400);
    const cr = await page.$('.confirm-row');
    if(!cr) throw new Error('No confirm-row appeared');
    const cancel = await page.$('.btn-confirm.no');
    if(!cancel) throw new Error('No cancel btn');
    await cancel.click(); await sleep(300);
  });

  // [11] Sidebar
  console.log('\n\x1b[1m[11] Sidebar\x1b[0m');
  await test('Sidebar has >=4 nav items', async()=>{
    const items = await page.$$('.sidebar-item');
    if(items.length<4) throw new Error(`Only ${items.length} sidebar items`);
  });
  await test('Sidebar toggle clickable (desktop viewport)', async()=>{
    // Sidebar is hidden on mobile — resize to desktop to test toggle
    await page.setViewport({width:1280,height:800});
    await sleep(300);
    await page.evaluate(()=>document.getElementById('sidebar-toggle-btn').click());
    await sleep(300);
    await page.evaluate(()=>document.getElementById('sidebar-toggle-btn').click());
    await sleep(300);
    await page.setViewport({width:390,height:844}); // restore
  });

  // [12] Mic FAB
  console.log('\n\x1b[1m[12] Mic FAB\x1b[0m');
  await click(page,'#nav-today',400);
  await warn('Mic FAB visible', ()=>vis(page,'#mic-fab',3000));

  // [13] JS errors
  console.log('\n\x1b[1m[13] JS Errors\x1b[0m');
  const filtered=jsErrors.filter(e=>!e.includes('favicon')&&!e.includes('net::ERR')&&!e.includes('supabase')&&!e.includes('Failed to fetch')&&!e.includes('sw.js')&&!e.includes('manifest')&&!e.includes('lucide')&&!e.includes('fonts'));
  if(filtered.length===0){console.log(`  ${G} No JS errors`); passed++;}
  else{filtered.slice(0,8).forEach(e=>console.log(`  ${Y} ${e.slice(0,130)}`)); warned+=filtered.length;}

  await browser.close();

  console.log('\n'+'═'.repeat(52));
  console.log(`\x1b[1mResults: ${G} ${passed} passed  ${R} ${failed} failed  ${Y} ${warned} warnings\x1b[0m`);
  if(failures.length>0){
    console.log('\n\x1b[1mFailed tests:\x1b[0m');
    failures.forEach(f=>console.log(`  ${R} ${f.label}\n     → ${f.error}`));
  }
  console.log('');
  process.exit(failed>0?1:0);
}
run().catch(err=>{console.error('\nCrash:',err.message); process.exit(1);});
