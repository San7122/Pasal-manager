# Supabase migrations

Run these against your Supabase project (`dmacgmvideuylcpkocmz.supabase.co`):
SQL Editor → New query → paste → Run.

## 2026-06-13 — Sale cost, customer timestamp, payment tier columns (NOT YET APPLIED — CRITICAL)

Found while auditing for the same "missing column" bug class as the
pm_settings fix below. Run all three in one go:

```sql
-- 1) CRITICAL: every "Add Sale" (manual AND voice) writes `cost` to pm_sales,
-- but this column has never existed. Every sale insert fails with
-- PGRST204 "Could not find the 'cost' column of 'pm_sales'", falls back to
-- local-only + infinite retry. pm_sales is effectively EMPTY in the cloud
-- for every user — this is why the audited shops show 0 sales in Supabase
-- despite actively using the app.
ALTER TABLE pm_sales ADD COLUMN IF NOT EXISTS cost integer DEFAULT 0;

-- 2) pm_customers: CSV import AND the guest->cloud migration write `ts`,
-- which doesn't exist (PGRST204). Customers created in Guest Mode never
-- sync to the cloud after signup.
ALTER TABLE pm_customers ADD COLUMN IF NOT EXISTS ts bigint DEFAULT 0;

-- 3) pm_payment_requests: the Razorpay-success, manual UPI/eSewa, and
-- admin-grant flows all write `tier`, which doesn't exist (PGRST204).
-- These errors are only console-logged (not trackError), so they never
-- show up in analytics_events. The Admin Dashboard "Payment Requests"
-- queue stays empty — owner can't review/approve subscriptions in-app.
ALTER TABLE pm_payment_requests ADD COLUMN IF NOT EXISTS tier text DEFAULT 'pro';
```

After running, PostgREST's schema cache picks up the new columns
automatically — no app redeploy needed. Existing rows get the defaults;
new sales/customers/payment-requests will start saving correctly.

---

## 2026-06-13 — Opening balances + subscription columns on pm_settings (APPLIED)

`saveSettings()` has been writing `own_name`, `opening_cash`, `opening_capital`,
`opening_stock`, `trial_start_date`, `subscription_status`, and
`subscription_expiry` to `pm_settings` since these fields were added to the
app — but the columns were never created. Every settings save failed with
`PGRST204 — Could not find the 'opening_capital' column of 'pm_settings'`,
fell back to local-only storage, and queued an infinite retry (140+ failed
attempts logged for one user in 20 minutes). This meant opening balances,
owner name, and subscription/trial status never synced to the cloud for
ANY user.

```sql
ALTER TABLE pm_settings
  ADD COLUMN IF NOT EXISTS own_name            text DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_cash        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_capital     numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_stock       numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_start_date    bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS subscription_expiry bigint DEFAULT 0;
```

Applied 2026-06-13 — `saveSettings()` upserts now succeed without any app
code changes (PostgREST schema cache picks up new columns automatically).

**Verified 2026-06-13**: confirmed via `information_schema.columns` that all
7 columns exist on `pm_settings`, and `analytics_events` shows no
`opening_capital` PGRST204 errors after 10:41 UTC (last one was a stale
schema-cache hit right after the ALTER ran). Issue fully resolved.

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

---

## 2026-05-25 — Analytics: events + users + owner-only RLS

Unlocks the Admin Dashboard inside the app. Tracks every signup, login,
sale, udhaar, etc. across all users. Only your owner email can read the
data; anyone (including anonymous landing-page visitors) can insert.

**Run this in one go:**

```sql
-- Extend analytics_visits to capture user_id + landing-vs-app + country
ALTER TABLE analytics_visits
  ADD COLUMN IF NOT EXISTS user_id  uuid,
  ADD COLUMN IF NOT EXISTS path     text DEFAULT '/',
  ADD COLUMN IF NOT EXISTS country  text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_landing boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON analytics_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_user_id    ON analytics_visits(user_id);

-- Per-user profile snapshot so the dashboard can list shops without
-- needing admin-level auth.users access
CREATE TABLE IF NOT EXISTS analytics_users (
  user_id       uuid PRIMARY KEY,
  email         text,
  shop_name     text,
  country       text DEFAULT '',
  signed_up_at  timestamptz DEFAULT now(),
  last_seen_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON analytics_users(last_seen_at DESC);

-- Event stream — every meaningful action the app fires
CREATE TABLE IF NOT EXISTS analytics_events (
  id          bigint generated always as identity primary key,
  user_id     uuid,
  session_id  text,
  event_name  text NOT NULL,
  event_data  jsonb DEFAULT '{}'::jsonb,
  device_type text,
  country     text,
  ts          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_ts        ON analytics_events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_ts   ON analytics_events(event_name, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_ts   ON analytics_events(user_id, ts DESC);

-- Row-Level Security: anyone can write; ONLY owner email can read
ALTER TABLE analytics_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Visits
DROP POLICY IF EXISTS "visits_insert_all"    ON analytics_visits;
DROP POLICY IF EXISTS "visits_update_all"    ON analytics_visits;
DROP POLICY IF EXISTS "visits_owner_read"    ON analytics_visits;
CREATE POLICY "visits_insert_all"  ON analytics_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "visits_update_all"  ON analytics_visits FOR UPDATE USING (true);
CREATE POLICY "visits_owner_read"  ON analytics_visits FOR SELECT
  USING (auth.jwt() ->> 'email' = 'sanjanathakur302@gmail.com');

-- Users
DROP POLICY IF EXISTS "users_upsert_self" ON analytics_users;
DROP POLICY IF EXISTS "users_owner_read"  ON analytics_users;
CREATE POLICY "users_upsert_self" ON analytics_users FOR ALL
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'sanjanathakur302@gmail.com')
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_owner_read"  ON analytics_users FOR SELECT
  USING (auth.jwt() ->> 'email' = 'sanjanathakur302@gmail.com');

-- Events
DROP POLICY IF EXISTS "events_insert_all" ON analytics_events;
DROP POLICY IF EXISTS "events_owner_read" ON analytics_events;
CREATE POLICY "events_insert_all" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_owner_read" ON analytics_events FOR SELECT
  USING (auth.jwt() ->> 'email' = 'sanjanathakur302@gmail.com');
```

After running, the Admin tab appears in the More page when you log in
with `sanjanathakur302@gmail.com`. No other user sees it.

**To add more owner emails** (e.g. for a teammate): edit the three RLS
policy expressions above and the `OWNER_EMAILS` array in `pasal-manager.html`.

---

## 2026-05-25 — Anonymous auth (guests become real Supabase users)

This makes every "Start as Guest" user automatically get a Supabase
account (no email/password required) so their data flows to the cloud
from the very first sale. You see all guests in the Admin Dashboard
immediately instead of waiting for them to sign up.

### Step 1 — Enable in Supabase Dashboard

There's no SQL for this. Do it in the UI:

1. Open https://supabase.com/dashboard/project/dmacgmvideuylcpkocmz/auth/sign-in-up
2. Find the **"Allow anonymous sign-ins"** toggle (under "User Sign Ups" section)
3. Toggle it **ON**
4. Click **Save**

That's it. The app's guest button will start using `sb.auth.signInAnonymously()`
automatically once this is enabled. If you leave it disabled, the app
falls back to the old localStorage-only guest behavior — no breakage.

### Step 2 — (Optional) RLS check for anonymous users

If you ever want to do something different for anonymous users in SQL,
you can detect them via `auth.jwt() ->> 'is_anonymous' = 'true'`.
Example — block anonymous users from generating large bills:

```sql
-- (NOT applied — example only)
CREATE POLICY "no_anon_bulk" ON pm_gst_bills
  FOR INSERT WITH CHECK (auth.jwt() ->> 'is_anonymous' = 'false');
```

Right now we don't restrict anything — anonymous users have the same
permissions as email-signed-in users (their own data only, via existing
`auth.uid() = user_id` policies).

---

## 2026-05-25 — Stock adjustment audit log

Every time the shopkeeper increases or decreases stock, the app now records
WHY (reason + optional note) and the running balance. This gives a complete
audit trail per item — useful for proving losses, returns, damage etc.

Without this table, the app falls back to localStorage-only adjustments
(still works, just not cloud-synced and not viewable on other devices).

```sql
CREATE TABLE IF NOT EXISTS pm_stock_adjustments (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  stock_id text NOT NULL,
  stock_name text,
  qty_change int NOT NULL,             -- negative for removals, positive for additions
  reason text,                          -- 'sold_offline', 'damaged', 'returned', etc.
  note text DEFAULT '',
  balance_after int,
  ts bigint,                            -- millisecond timestamp
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_adj_user  ON pm_stock_adjustments(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_stock_adj_stock ON pm_stock_adjustments(stock_id, ts DESC);

ALTER TABLE pm_stock_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_adj_owner" ON pm_stock_adjustments;
CREATE POLICY "stock_adj_owner" ON pm_stock_adjustments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

After running, the History (📋) button next to each stock item will show
every adjustment with reason, note, qty change, and the running balance.



---

## Payment Subscription System (pm_payment_requests)

Tracks subscription payment submissions from users so the owner can approve
them from the Admin Dashboard. Without this table, payments still work
(WhatsApp fallback) but the owner won't see them in the in-app admin view.

```sql
CREATE TABLE IF NOT EXISTS pm_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  email text,
  shop_name text,
  country text DEFAULT 'IN',
  amount numeric NOT NULL,
  currency text NOT NULL,            -- 'INR' or 'NPR'
  method text,                        -- 'UPI' or 'eSewa/Khalti'
  txn_id text NOT NULL,
  note text DEFAULT '',
  status text DEFAULT 'pending',     -- 'pending' / 'approved' / 'rejected'
  approved_at timestamptz,
  approved_until timestamptz,        -- when subscription expires
  approved_by text,                   -- email of owner who approved
  rejection_reason text,
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_pay_user   ON pm_payment_requests(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pm_pay_status ON pm_payment_requests(status, submitted_at DESC);

ALTER TABLE pm_payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can INSERT their own payment requests + SELECT to see status
DROP POLICY IF EXISTS "pm_pay_user_insert" ON pm_payment_requests;
CREATE POLICY "pm_pay_user_insert" ON pm_payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pm_pay_user_select" ON pm_payment_requests;
CREATE POLICY "pm_pay_user_select" ON pm_payment_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Owner (sanjanathakur302@gmail.com) can do everything
DROP POLICY IF EXISTS "pm_pay_owner_all" ON pm_payment_requests;
CREATE POLICY "pm_pay_owner_all" ON pm_payment_requests FOR ALL
  USING ((auth.jwt() ->> 'email') = 'sanjanathakur302@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'sanjanathakur302@gmail.com');
```

After running, the Admin Dashboard will show a "Payment Requests" card with
pending submissions and Approve/Reject buttons. Approving sets
`subscription_expiry = now() + 30 days` for that user.
