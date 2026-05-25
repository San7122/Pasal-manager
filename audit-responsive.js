// Visual audit: render the live landing page at iPhone / iPad / laptop sizes
// and check for common responsive issues (overflow, tiny touch targets, etc.)

const puppeteer = require('puppeteer');

const VIEWPORTS = [
  { name: 'iPhone 14',     w: 390,  h: 844,  ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', mobile: true },
  { name: 'iPad',          w: 768,  h: 1024, ua: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', mobile: true },
  { name: 'iPad Pro 11"',  w: 834,  h: 1194, ua: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', mobile: true },
  { name: 'Laptop 13"',    w: 1280, h: 800,  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', mobile: false },
  { name: 'Laptop 15"',    w: 1440, h: 900,  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', mobile: false },
];

const URL = 'https://pasal-manager.vercel.app/';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const allIssues = {};

  for (const vp of VIEWPORTS) {
    console.log(`\n\x1b[36m━━━ ${vp.name} (${vp.w}x${vp.h}) ━━━\x1b[0m`);
    const page = await browser.newPage();
    await page.setUserAgent(vp.ua);
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.mobile, hasTouch: vp.mobile });
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2500));

    const issues = await page.evaluate(() => {
      const out = { overflowsX: [], tinyTouch: [], hiddenContent: [], tinyText: [], offscreen: [] };
      const vw = window.innerWidth;

      // 1. Horizontal overflow detection
      if (document.documentElement.scrollWidth > vw + 1) {
        out.overflowsX.push({
          docWidth: document.documentElement.scrollWidth,
          viewport: vw,
          overflowBy: document.documentElement.scrollWidth - vw,
        });
        // Find culprit elements
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 && r.width > 0 && r.width < 9999) {
            const tag = el.tagName.toLowerCase();
            const cls = (el.className || '').toString().slice(0, 60);
            const text = (el.innerText || '').slice(0, 40).replace(/\n/g, ' ');
            if (!out.overflowsX.some(o => o.tag === tag && o.cls === cls)) {
              out.overflowsX.push({ tag, cls, text, right: Math.round(r.right), width: Math.round(r.width) });
              if (out.overflowsX.length > 6) break;
            }
          }
        }
      }

      // 2. Touch targets — buttons & links smaller than 40x40 (Apple min: 44, Material: 48)
      const interactive = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
      for (const el of interactive) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40)) {
          const text = (el.innerText || el.getAttribute('aria-label') || el.title || '').slice(0, 30).trim();
          if (text) {
            out.tinyTouch.push({
              text,
              w: Math.round(r.width),
              h: Math.round(r.height),
              tag: el.tagName.toLowerCase(),
            });
          }
        }
      }

      // 3. Tiny text (< 12px is hard to read on mobile)
      const textElements = document.querySelectorAll('p, span, a, button, label, h1, h2, h3, h4, h5, h6, div');
      const seenTinyTextSamples = new Set();
      for (const el of textElements) {
        if (!el.innerText || !el.innerText.trim()) continue;
        if (el.children.length > 0) continue; // skip containers
        const cs = window.getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        if (fs > 0 && fs < 12) {
          const sample = el.innerText.slice(0, 30).trim();
          if (!seenTinyTextSamples.has(sample)) {
            seenTinyTextSamples.add(sample);
            out.tinyText.push({ text: sample, sizePx: fs.toFixed(1) });
            if (out.tinyText.length > 5) break;
          }
        }
      }

      // 4. Content cut off by viewport
      const sections = document.querySelectorAll('section, [class*="container"], [class*="hero"]');
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.left < -1 && r.width > 100) {
          out.offscreen.push({
            cls: (s.className || '').toString().slice(0, 60),
            left: Math.round(r.left),
          });
        }
      }

      return out;
    });

    allIssues[vp.name] = issues;

    if (issues.overflowsX.length) {
      console.log(`  ❌ Horizontal scroll detected (page wider than viewport)`);
      issues.overflowsX.slice(0, 4).forEach(o => {
        if (o.overflowBy) console.log(`     Overflows by ${o.overflowBy}px (doc ${o.docWidth}px vs vp ${o.viewport}px)`);
        else console.log(`     <${o.tag}> "${o.text}" extends to ${o.right}px (width ${o.width}px)`);
      });
    } else {
      console.log(`  ✅ No horizontal overflow`);
    }

    if (issues.tinyTouch.length) {
      console.log(`  ⚠️  ${issues.tinyTouch.length} small touch target${issues.tinyTouch.length>1?'s':''} (<40x40px)`);
      const unique = {};
      issues.tinyTouch.forEach(t => { unique[t.text] = t; });
      Object.values(unique).slice(0, 5).forEach(t => {
        console.log(`     "${t.text}" — ${t.w}x${t.h}px (${t.tag})`);
      });
    } else {
      console.log(`  ✅ All touch targets ≥40px`);
    }

    if (issues.tinyText.length) {
      console.log(`  ⚠️  ${issues.tinyText.length} text${issues.tinyText.length>1?'s':''} <12px (hard to read on mobile)`);
      issues.tinyText.slice(0, 4).forEach(t => console.log(`     "${t.text}" — ${t.sizePx}px`));
    } else {
      console.log(`  ✅ All text ≥12px`);
    }

    await page.close();
  }

  await browser.close();

  console.log('\n\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
  console.log('AUDIT COMPLETE — see per-viewport output above');
  console.log('\x1b[36m═══════════════════════════════════════════════════════\x1b[0m');
})().catch(e => { console.error('Audit failed:', e); process.exit(1); });
