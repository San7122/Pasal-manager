# Supabase migrations

Run these against your Supabase project (`dmacgmvideuylcpkocmz.supabase.co`):
SQL Editor → New query → paste → Run.

## 2026-05-25 — Nepal payment fields on pm_settings

Adds Fonepay merchant code, eSewa ID, and Khalti ID to the cloud settings
so they survive PWA uninstall / re-install on a new device. Without this,
the `saveSettings()` upsert will fail and the fields stay local-only
(the app handles that gracefully — it falls back to upserting the other
columns).

```sql
ALTER TABLE pm_settings
  ADD COLUMN IF NOT EXISTS np_payment_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS esewa_id      text DEFAULT '',
  ADD COLUMN IF NOT EXISTS khalti_id     text DEFAULT '',
  ADD COLUMN IF NOT EXISTS upi_id        text DEFAULT '';
```

After running this, Nepal merchants will see their Fonepay/eSewa/Khalti
codes auto-restore when they log in on a new device.
