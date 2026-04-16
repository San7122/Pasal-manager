// Pasal Manager — Auto Screenshot Generator
// Takes all 5 App Store screenshots at 1290x2796 (iPhone 14 Pro Max)
// Run: node take-screenshots.js

const puppeteer = require('puppeteer');
const path = require('path');

const WIDTH = 430;   // CSS pixels (iPhone 14 Pro Max logical width)
const HEIGHT = 932;  // CSS pixels
const DPR = 3;       // Device pixel ratio → produces 1290x2796 physical pixels

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:8080/pasal-manager.html';

const shots = [
  {
    name: '1-today-sales',
    label: "Today's Sales",
    steps: async (page) => {
      // Wait for app to load, click Today tab
      await page.waitForSelector('.nav-btn', { timeout: 10000 });
      await page.evaluate(() => {
        const btns = document.querySelectorAll('.nav-btn');
        btns[0]?.click(); // Today tab
      });
      await delay(800);
    }
  },
  {
    name: '2-udhaar',
    label: 'Udhaar (Credit) Book',
    steps: async (page) => {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('.nav-btn');
        btns[2]?.click(); // Udhaar tab
      });
      await delay(800);
    }
  },
  {
    name: '3-stock',
    label: 'Stock Management',
    steps: async (page) => {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('.nav-btn');
        btns[3]?.click(); // Stock tab
      });
      await delay(800);
    }
  },
  {
    name: '4-more-menu',
    label: 'More Features Menu',
    steps: async (page) => {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('.nav-btn');
        btns[4]?.click(); // More tab
        setTimeout(() => {
          if (typeof goMore === 'function') goMore('menu');
        }, 300);
      });
      await delay(1000);
    }
  },
  {
    name: '5-dashboard',
    label: 'Business Dashboard',
    steps: async (page) => {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('.nav-btn');
        btns[4]?.click();
        setTimeout(() => {
          if (typeof goMore === 'function') goMore('dashboard');
        }, 300);
      });
      await delay(1500); // Extra time for charts to render
    }
  }
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🚀 Starting Pasal Manager Screenshot Generator...\n');
  console.log(`📐 Output size: ${WIDTH * DPR} × ${HEIGHT * DPR} px (iPhone 14 Pro Max)\n`);

  // Make sure screenshots dir exists
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let success = 0;

  try {
    const page = await browser.newPage();

    // Set iPhone 14 Pro Max viewport
    await page.setViewport({
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: DPR,
      isMobile: true,
      hasTouch: true
    });

    // Set mobile user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );

    console.log(`⏳ Opening app at ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);

    // Check if login screen is shown — inject demo data if logged out
    const isLoggedOut = await page.evaluate(() => {
      return document.getElementById('auth-screen')?.style?.display !== 'none' ||
             document.querySelector('.auth-box') !== null;
    });

    if (isLoggedOut) {
      console.log('⚠️  App shows login screen. Injecting demo data for screenshots...');
      await page.evaluate(() => {
        // Hide auth, show main app
        const auth = document.getElementById('auth-screen');
        const app = document.querySelector('.app');
        if (auth) auth.style.display = 'none';
        if (app) app.style.display = 'flex';

        // Inject sample data
        const today = todayStr ? todayStr() : new Date().toISOString().split('T')[0];
        sales = [
          {id:'s1',date:today,ts:Date.now(),amt:12500,cost:0,note:'Mobile phone sale',payMode:'UPI',country:'IN'},
          {id:'s2',date:today,ts:Date.now()-3600000,amt:4200,cost:0,note:'Accessories',payMode:'Cash',country:'IN'},
          {id:'s3',date:today,ts:Date.now()-7200000,amt:8800,cost:0,note:'Bluetooth speaker',payMode:'PhonePe',country:'IN'},
          {id:'s4',date:today,ts:Date.now()-10800000,amt:2100,cost:0,note:'Charger',payMode:'Cash',country:'IN'},
        ];
        expenses = [
          {id:'e1',date:today,ts:Date.now()-1000,amt:1500,note:'Shop rent',category:'Rent',country:'IN'},
          {id:'e2',date:today,ts:Date.now()-2000,amt:300,note:'Electricity',category:'Utility',country:'IN'},
        ];
        udhaars = [
          {id:'u1',name:'Ramesh Kumar',phone:'9876543210',amt:5500,date:today,paid:false,dueDate:'2026-04-15',country:'IN'},
          {id:'u2',name:'Sunil Sharma',phone:'9812345678',amt:2200,date:today,paid:false,dueDate:'2026-04-20',country:'IN'},
          {id:'u3',name:'Priya Devi',phone:'9900112233',amt:8000,date:today,paid:false,dueDate:'',country:'IN'},
          {id:'u4',name:'Ajay Singh',phone:'',amt:1200,date:today,paid:true,dueDate:'',country:'IN'},
        ];
        stock = [
          {id:'st1',name:'Nike Air Max',size:'8',qty:15,buy:2500,sell:4500,country:'IN',barcode:''},
          {id:'st2',name:'Adidas Superstar',size:'9',qty:8,buy:3000,sell:5200,country:'IN',barcode:''},
          {id:'st3',name:'Bata Sandals',size:'7',qty:3,buy:450,sell:850,country:'IN',barcode:''},
          {id:'st4',name:'Red Tape Boots',size:'10',qty:22,buy:1800,sell:3200,country:'IN',barcode:''},
          {id:'st5',name:'Sparx Sports',size:'8',qty:0,buy:800,sell:1500,country:'IN',barcode:''},
        ];
        suppliers = [
          {id:'sp1',name:'Ram Footwear',phone:'9111222333',note:'Main supplier'},
          {id:'sp2',name:'City Wholesale',phone:'9444555666',note:''},
        ];
        S = S || {};
        S.shopName = 'Sharma Shoe Store';
        S.country = 'IN';
        S.language = 'en';

        if (typeof renderToday === 'function') renderToday();
        if (typeof updateTopbar === 'function') updateTopbar();
      });
      await delay(1000);
    }

    // Take each screenshot
    for (const shot of shots) {
      console.log(`📸 Taking screenshot: ${shot.label}...`);
      try {
        await shot.steps(page);
        const filepath = path.join(SCREENSHOTS_DIR, `${shot.name}.png`);
        await page.screenshot({ path: filepath, fullPage: false });
        const fs = require('fs');
        const stats = fs.statSync(filepath);
        const kb = Math.round(stats.size / 1024);
        console.log(`   ✅ Saved: screenshots/${shot.name}.png (${kb} KB)`);
        success++;
      } catch(e) {
        console.log(`   ❌ Failed: ${e.message}`);
      }
      await delay(500);
    }

  } finally {
    await browser.close();
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ ${success}/${shots.length} screenshots saved to: pasal-manager/screenshots/`);
  if (success === shots.length) {
    console.log('\n🎉 All screenshots ready for App Store submission!');
    console.log('\nNext steps:');
    console.log('  1. Check screenshots/ folder to review the images');
    console.log('  2. Upload them to App Store Connect / Google Play Console');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
