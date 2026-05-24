# Pasal Manager — Comprehensive QA Audit Report

Generated: 2026-05-24T07:58:12.837Z

## Summary

- **Total Tests:** 17/18 PASS
- **Pass Rate:** 94.4%

## Results by Round

### Round 1

**4/5 PASS**

- ✅ **Add cash sale ₹500 with cost ₹200** — recorded
- ✅ **Profit auto-calculates (500 - 200 = 300)** — profit: 300
- ✅ **Add UPI sale ₹750** — recorded
- ❌ **Delete sale → total recalculates** — feature check
- ✅ **Voice entry feature available** — voice modal found

### Round 2

**3/3 PASS**

- ✅ **Add udhaar entry ₹2500** — recorded
- ✅ **Mark udhaar as paid → disappears from pending** — marked paid
- ✅ **Currency edge case: ₹10,00,000 (lakh format)** — fmt: ₹10,00,000

### Round 3

**3/3 PASS**

- ✅ **Add stock item → barcode auto-generates** — item added
- ✅ **Low stock alert when qty ≤ 5** — qty: 3
- ✅ **Barcode is 12-digit number** — barcode generated

### Round 4

**2/2 PASS**

- ✅ **P&L report renders** — P&L visible
- ✅ **Dashboard with KPI cards renders** — dashboard visible

### Round 5

**2/2 PASS**

- ✅ **Nepal payment apps visible (eSewa, Khalti, Fonepay)** — apps found
- ✅ **Translation system (i18n) works** — t() function available

### Round 6

**3/3 PASS**

- ✅ **Empty states handled gracefully** — UI renders
- ✅ **Data persists across reload** — storage preserved
- ✅ **Security: XSS protection (no script execution)** — XSS blocked

## Bugs Found (1)

### Delete sale → total recalculates

- **Error:** Assertion failed
- **Round:** 1.4

