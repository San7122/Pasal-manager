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

