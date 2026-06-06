// Production domain health check — verifies pasalmanagers.com is reachable + correctly configured.
// Run manually: `node test-domain.js`
// Exit code 0 = all pass, 1 = at least one failure (CI-friendly).
const https = require('https');
const dns = require('dns').promises;

const DOMAIN = 'pasalmanagers.com';
const ROOT_URL = `https://${DOMAIN}`;

const results = [];
const test = (name, pass, info='') => {
  results.push({ name, pass });
  console.log(`${pass?'✅':'❌'} ${name}${info?'  '+info:''}`);
};

// HTTP GET that follows redirects, returns {status, body, headers, ms}
function fetch(url, opts={}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': opts.ua || 'PasalManagerHealthCheck/1.0', ...(opts.headers||{}) },
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body,
        ms: Date.now() - start,
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout after 15s')); });
    req.end();
  });
}

(async () => {
  console.log(`\n━━━ Domain health check: ${DOMAIN} ━━━\n`);

  // ── 1. DNS resolution ──
  try {
    const addrs = await dns.resolve4(DOMAIN);
    test('DNS resolves to an IPv4 address', addrs.length > 0, addrs.join(', '));
    test('DNS points to Vercel (76.76.x.x)', addrs.some(a => a.startsWith('76.76.')), addrs[0]);
  } catch (e) {
    test('DNS resolves', false, e.message);
    test('DNS points to Vercel', false, 'skipped (DNS broken)');
  }

  // ── 2. HTTPS root reachable ──
  let rootPage;
  try {
    rootPage = await fetch(ROOT_URL);
    test('HTTPS https://pasalmanagers.com returns 200', rootPage.status === 200, `${rootPage.status}, ${rootPage.ms}ms`);
    test('Response time under 5 seconds (cold start tolerance)', rootPage.ms < 5000, `${rootPage.ms}ms`);
  } catch (e) {
    test('HTTPS reachable', false, e.message);
    process.exit(1);
  }

  // ── 3. HTTP → HTTPS redirect ──
  try {
    const httpResp = await new Promise((resolve, reject) => {
      require('http').get(`http://${DOMAIN}`, { timeout: 10000 }, (res) => {
        resolve({ status: res.statusCode, location: res.headers.location });
      }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
    });
    test('HTTP redirects to HTTPS (308/301)', httpResp.status === 308 || httpResp.status === 301, `→ ${httpResp.location}`);
    test('Redirect target uses pasalmanagers.com', (httpResp.location||'').includes(DOMAIN), httpResp.location);
  } catch (e) {
    test('HTTP redirect', false, e.message);
  }

  // ── 4. www variant works ──
  try {
    const wwwResp = await fetch(`https://www.${DOMAIN}`);
    test('www.pasalmanagers.com returns 200', wwwResp.status === 200, String(wwwResp.status));
  } catch (e) {
    test('www variant works', false, e.message);
  }

  // ── 5. Page content sanity ──
  const html = rootPage.body;
  test('Page contains <title>', /<title>[^<]*Pasal Manager[^<]*<\/title>/i.test(html));
  test('Page has meta description', /<meta name="description"/i.test(html));
  test('Page indexable (robots = index,follow)', /<meta name="robots"[^>]*"index, follow"/i.test(html));
  test('NOT marked noindex', !/<meta name="robots"[^>]*"noindex/i.test(html));

  // ── 6. SEO URLs point to custom domain (not old vercel URL) ──
  test('Canonical URL uses pasalmanagers.com', /<link rel="canonical" href="https:\/\/pasalmanagers\.com/.test(html),
       (html.match(/<link rel="canonical"[^>]*>/)||['?'])[0]);
  test('No leftover pasal-manager.vercel.app refs', !html.includes('pasal-manager.vercel.app'));
  test('og:url uses pasalmanagers.com', /<meta property="og:url" content="https:\/\/pasalmanagers\.com/.test(html));
  test('og:image uses pasalmanagers.com', /<meta property="og:image" content="https:\/\/pasalmanagers\.com/.test(html));

  // ── 7. robots.txt ──
  try {
    const robots = await fetch(`${ROOT_URL}/robots.txt`);
    test('robots.txt accessible (200)', robots.status === 200);
    test('robots.txt allows indexing (Allow: /)', /Allow:\s*\//i.test(robots.body));
    test('robots.txt sitemap points to pasalmanagers.com', /Sitemap:\s*https:\/\/pasalmanagers\.com/i.test(robots.body));
  } catch (e) {
    test('robots.txt', false, e.message);
  }

  // ── 8. sitemap.xml ──
  try {
    const sm = await fetch(`${ROOT_URL}/sitemap.xml`);
    test('sitemap.xml accessible (200)', sm.status === 200);
    test('sitemap.xml is XML', /<\?xml/i.test(sm.body) || /<urlset/i.test(sm.body));
    test('sitemap.xml urls use pasalmanagers.com', /https:\/\/pasalmanagers\.com/.test(sm.body));
    test('sitemap.xml has no old vercel URLs', !sm.body.includes('pasal-manager.vercel.app'));
  } catch (e) {
    test('sitemap.xml', false, e.message);
  }

  // ── 9. PWA app shell ──
  try {
    const app = await fetch(`${ROOT_URL}/app.html`);
    test('/app.html accessible (200)', app.status === 200);
    test('/app.html serves real HTML (>10KB)', app.body.length > 10000, `${(app.body.length/1024).toFixed(0)}KB`);
    test('/app.html has autoLoginFromReact bridge', app.body.includes('autoLoginFromReact'));
  } catch (e) {
    test('/app.html', false, e.message);
  }

  // ── 10. PWA manifest ──
  try {
    const mf = await fetch(`${ROOT_URL}/manifest.webmanifest`);
    test('manifest.webmanifest accessible', mf.status === 200);
    test('manifest is valid JSON', (()=>{ try { JSON.parse(mf.body); return true; } catch(e) { return false; } })());
  } catch (e) {
    test('manifest', false, e.message);
  }

  // ── 11. Service Worker ──
  try {
    const sw = await fetch(`${ROOT_URL}/sw.js`);
    test('sw.js (service worker) accessible', sw.status === 200);
  } catch (e) {
    test('sw.js', false, e.message);
  }

  // ── 12. Google indexing status (informational only — does not affect pass/fail) ──
  console.log('\n━━━ Informational: Google indexing status ━━━');
  try {
    const gsearch = await fetch(`https://www.google.com/search?q=site%3A${DOMAIN}`, {
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    const isIndexed = !gsearch.body.includes('did not match any documents') && !gsearch.body.includes('No results found');
    console.log(`  ${isIndexed ? '✅' : '⚠️ '} Google has indexed pasalmanagers.com: ${isIndexed ? 'YES' : 'NOT YET (submit to Search Console)'}`);
  } catch (e) {
    console.log(`  ⚠️  Could not check Google indexing: ${e.message}`);
  }

  // ── Summary ──
  console.log('\n═══════════════════════════════════════════════════════');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const failed = total - passed;
  console.log(`DOMAIN RESULT: ${passed}/${total} checks passed${failed ? ` (${failed} FAILED)` : ''}`);
  if (failed === 0) console.log('🎉 pasalmanagers.com is fully operational');
  else console.log(`⚠️  ${failed} check${failed>1?'s':''} failed — see ❌ above`);
  console.log('═══════════════════════════════════════════════════════');

  process.exit(failed === 0 ? 0 : 1);
})();
