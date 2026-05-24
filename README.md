# Pasal Manager v1.0

Mobile-first shopkeeper business tool for shoe & slipper shop owners in India and Nepal.

## Features (All 10)

1. **Daily Sale Entry** — Tap amount, tap +, done in 3 seconds
2. **Katha (Ledger)** — Daily / Monthly / Yearly history with navigation
3. **Udhaar Book** — Track customer credit with amounts and dates
4. **WhatsApp Reminder** — 1-tap sends udhaar reminder to customer
5. **Expense Tracker** — Categorized daily expenses (Shop, Rent, Staff, etc.)
6. **Stock Manager** — Item name, size, qty, buy/sell price, low-stock alerts
7. **Supplier Book** — Wholesale contact list with 1-tap call
8. **Digital Bill** — Generate itemized bills, share via WhatsApp
9. **Profit & Loss Report** — 6-month P&L summary
10. **Export** — Text summary for CA/bank, copy or WhatsApp share

## Dual Market Support

| Feature       | India (IN)                    | Nepal (NP)                     |
|---------------|-------------------------------|--------------------------------|
| Currency      | ₹                             | रू                              |
| Payments      | Cash, UPI, PhonePe, GPay, Paytm, Card | Cash, eSewa, Khalti, IME Pay, Fonepay, Card |
| Language      | English, हिंदी                  | English, नेपाली                   |

## Tech Stack

- Pure HTML + CSS + Vanilla JS (no frameworks)
- Single file — just open `pasal-manager.html`
- Data stored in `window.storage` (persistent key-value)
- Works offline — no backend, no login needed
- Optimized for budget Android phones (₹8K-15K range)

## Storage Keys

| Key             | Data                                                    |
|-----------------|--------------------------------------------------------|
| `pm_settings`   | `{ country, language, shopName }`                       |
| `pm_sales`      | `[{ id, date, ts, amt, note, payMode, country }]`       |
| `pm_expenses`   | `[{ id, date, ts, amt, note, category, country }]`      |
| `pm_udhaar`     | `[{ id, name, phone, amt, date, ts, paid, country }]`   |
| `pm_stock`      | `[{ id, name, size, qty, buy, sell, country }]`          |
| `pm_suppliers`  | `[{ id, name, phone, note }]`                           |

## How to Use

1. Open `pasal-manager.html` in any browser
2. Go to Settings (More → Settings) to set your country and shop name
3. Start adding sales on the Today tab
4. Track everything from the Katha tab

## Navigation

- **Today** — Quick sale entry (home screen)
- **Katha** — History & P&L overview
- **Udhaar** — Credit ledger (Premium)
- **Stock** — Inventory management
- **More** — Expenses, Suppliers, Bill, P&L Report, Export, Settings

## Premium Features (Locked by Default)

- Udhaar Book
- Digital Bill Generator
- Export

These show a lock icon and unlock with a tap (integrate with your payment system).

---

Built for local shopkeepers who want to replace their katha copy with a digital tool.
