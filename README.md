# 🛍️ Pasal Manager

> **Free shop management app for shopkeepers in India & Nepal**

[![Live](https://img.shields.io/badge/Live-pasal--manager.vercel.app-7c3aed)](https://pasal-manager.vercel.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-7c3aed)](https://pasal-manager.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-72%2F72%20passing-22c55e)](#testing)

Track sales, manage credit (udhaar), monitor stock with auto-generated barcodes, send PDF bills via WhatsApp, and collect payments through UPI / eSewa / Khalti / Fonepay.

🌐 **Live:** https://pasal-manager.vercel.app

## ✨ Features (27 Total)

**Sales & Payments:** 3-sec sale entry · UPI QR (India) · eSewa/Khalti/Fonepay (Nepal) · Voice entry · Profit tracking
**Credit:** Udhaar ledger · WhatsApp reminders · Due date tracking · Bulk overdue alerts
**Stock:** Auto barcodes (Code 128) · Printable labels · Low-stock alerts · Camera scanner
**Billing:** Simple + GST bills · A5 PDF receipts · Send PDF via WhatsApp · Print
**Reports:** Business Dashboard · P&L · Daily WhatsApp reports · CSV/PDF export
**More:** Customers · Suppliers · Staff Book · Cash Book · EMI/Loans · Multi-branch · Photo Khata · PIN lock

## 🌍 Regions & Languages

| Country | Currency | Payment Apps |
|---------|----------|--------------|
| 🇮🇳 India | ₹ INR | GPay, PhonePe, Paytm, BHIM |
| 🇳🇵 Nepal | रू NPR | eSewa, Khalti, Fonepay, IME Pay (+ BS Calendar) |

**UI Languages:** English · हिंदी · नेपाली

## 📱 Installation (PWA — Like a Native App)

| Platform | Steps |
|----------|-------|
| **Android** | Chrome → install banner → tap Install |
| **iPhone** | Safari → Share button → Add to Home Screen |
| **Desktop** | Chrome/Edge → install icon in address bar |

## 🛠️ Tech Stack

- **Landing:** React 19 + Vite 8 + Tailwind v4
- **App:** Vanilla JS + HTML5 (9400+ lines)
- **Storage:** localStorage (offline-first) + optional Supabase cloud sync
- **PWA:** Service Worker (network-first HTML, cache-first assets)
- **Libraries:** Chart.js, JsBarcode, jsPDF, Lucide icons
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Testing:** 72 Puppeteer automated tests

## 🚀 Development

```bash
git clone https://github.com/San7122/Pasal-manager.git
cd Pasal-manager
npm install
npm run dev      # http://localhost:8001
npm run build    # → dist/
npm test         # 72 Puppeteer tests
```

## 📂 Structure

```
pasal-manager/
├── index.html                # React entry (landing)
├── pasal-manager.html        # Pasal Manager app (master)
├── public/
│   ├── app.html              # Synced from pasal-manager.html
│   ├── share.html            # Printable QR poster
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service worker
│   ├── og-image.png          # Social share preview
│   ├── sitemap.xml + robots.txt
│   ├── logo-icon.svg + logo-full.svg
│   ├── icons/                # PWA icons (72-1024px)
│   └── tool-screens/         # Mobile screenshots
├── src/
│   ├── App.jsx · main.jsx · index.css
│   ├── pages/Landing.jsx
│   └── components/Landing-comp/  # 10 sections
├── run-tests.js              # 72 tests
├── vite.config.js · vercel.json
└── README.md
```

## 📢 Marketing

- [`SHARE-KIT.md`](./SHARE-KIT.md) — WhatsApp/SMS templates in English/Hindi/Nepali, QR codes
- `pasal-qr.png` — Purple QR (social media)
- `pasal-qr-print.png` — Black QR (printing)
- [`/share`](https://pasal-manager.vercel.app/share) — Printable poster

## 📊 QA Report

See [`QA-REPORT.md`](./QA-REPORT.md) — 98.9% pass rate, security-audited, cross-browser tested, 375px/768px/1440px responsive.

## 🩹 Recent Fixes

- Preserve local settings when reconnecting: fixed an issue where a user's offline change to `Country` could be overwritten by server settings on reconnect. The app now prefers the newer local cache when merging settings.

## 📄 License

Free forever for individual shops. Use, share, modify — just don't sell as your own.

---

**🌐** https://pasal-manager.vercel.app
**📦** https://github.com/San7122/Pasal-manager
**📣** See [SHARE-KIT.md](./SHARE-KIT.md) to share with shopkeepers
