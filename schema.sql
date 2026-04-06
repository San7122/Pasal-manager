-- ============================================================
-- PASAL MANAGER v2.0 — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- SETTINGS (one row per user)
CREATE TABLE IF NOT EXISTS pm_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  country text DEFAULT 'IN',
  language text DEFAULT 'en',
  shop_name text DEFAULT '',
  udhaar_unlocked boolean DEFAULT false,
  bill_unlocked boolean DEFAULT false,
  export_unlocked boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- SALES
CREATE TABLE IF NOT EXISTS pm_sales (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  ts bigint,
  amt integer NOT NULL,
  note text DEFAULT '',
  pay_mode text DEFAULT 'Cash',
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS pm_expenses (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  ts bigint,
  amt integer NOT NULL,
  note text DEFAULT '',
  category text DEFAULT 'Shop',
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);

-- UDHAAR
CREATE TABLE IF NOT EXISTS pm_udhaar (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text DEFAULT '',
  amt integer NOT NULL,
  date text NOT NULL,
  ts bigint,
  paid boolean DEFAULT false,
  due_date text DEFAULT '',
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);

-- STOCK
CREATE TABLE IF NOT EXISTS pm_stock (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  size text DEFAULT '',
  qty integer DEFAULT 0,
  buy integer DEFAULT 0,
  sell integer DEFAULT 0,
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS pm_suppliers (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text DEFAULT '',
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE pm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_udhaar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_suppliers ENABLE ROW LEVEL SECURITY;

-- Each user can only see & edit their own data
CREATE POLICY "own_settings" ON pm_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_sales"    ON pm_sales    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_expenses" ON pm_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_udhaar"   ON pm_udhaar   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_stock"    ON pm_stock    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_suppliers"ON pm_suppliers FOR ALL USING (auth.uid() = user_id);

-- KHARIDI (Purchase Ledger — what you owe to suppliers)
CREATE TABLE IF NOT EXISTS pm_kharidi (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_name text NOT NULL,
  date text NOT NULL,
  ts bigint,
  amt integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase','payment')),
  note text DEFAULT '',
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);

-- DEALERS (Wholesale customers you give goods to on credit)
CREATE TABLE IF NOT EXISTS pm_dealers (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text DEFAULT '',
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- DEALER ENTRIES (Goods given / payments received per dealer)
CREATE TABLE IF NOT EXISTS pm_dealer_entries (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dealer_name text NOT NULL,
  date text NOT NULL,
  ts bigint,
  amt integer NOT NULL,
  type text NOT NULL CHECK (type IN ('given','received')),
  note text DEFAULT '',
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pm_kharidi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_dealer_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_kharidi"        ON pm_kharidi        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_dealers"        ON pm_dealers        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_dealer_entries" ON pm_dealer_entries FOR ALL USING (auth.uid() = user_id);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS pm_customers (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pm_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_customers" ON pm_customers FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON pm_customers(user_id);

-- Link sales to customers
ALTER TABLE pm_sales ADD COLUMN IF NOT EXISTS customer_id text DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_customer ON pm_sales(customer_id);

-- CASHBOOK (Daily Cash Register)
CREATE TABLE IF NOT EXISTS pm_cashbook (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  opening integer NOT NULL DEFAULT 0,
  expected integer,
  actual integer,
  difference integer,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pm_cashbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_cashbook" ON pm_cashbook FOR ALL USING (auth.uid() = user_id);

-- Ensure one record per user per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_cashbook_user_date ON pm_cashbook(user_id, date);

-- STAFF
CREATE TABLE IF NOT EXISTS pm_staff (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text DEFAULT '',
  salary_type text NOT NULL DEFAULT 'daily' CHECK (salary_type IN ('monthly','daily')),
  salary_amt integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- STAFF ENTRIES (attendance / advance / salary payments)
CREATE TABLE IF NOT EXISTS pm_staff_entries (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_name text NOT NULL,
  date text NOT NULL,
  type text NOT NULL CHECK (type IN ('attendance','advance','salary')),
  value real NOT NULL DEFAULT 0,   -- attendance: 1/0.5/0  |  advance/salary: amount
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pm_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_staff_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_staff"         ON pm_staff         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_staff_entries" ON pm_staff_entries FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user         ON pm_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_entries_user ON pm_staff_entries(user_id, staff_name, date);

-- ===== INDEXES for faster queries =====
CREATE INDEX IF NOT EXISTS idx_sales_user_date     ON pm_sales(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date  ON pm_expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_udhaar_user_paid    ON pm_udhaar(user_id, paid);
CREATE INDEX IF NOT EXISTS idx_stock_user          ON pm_stock(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user      ON pm_suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_cashbook_user       ON pm_cashbook(user_id);

-- ===== GST SETTINGS columns (added to pm_settings) =====
ALTER TABLE pm_settings ADD COLUMN IF NOT EXISTS gstin       text DEFAULT '';
ALTER TABLE pm_settings ADD COLUMN IF NOT EXISTS biz_address text DEFAULT '';
ALTER TABLE pm_settings ADD COLUMN IF NOT EXISTS biz_state   text DEFAULT '';
ALTER TABLE pm_settings ADD COLUMN IF NOT EXISTS own_phone   text DEFAULT '';
ALTER TABLE pm_settings ADD COLUMN IF NOT EXISTS reminder_time text DEFAULT '21:00';

-- ===== GST INVOICES =====
CREATE TABLE IF NOT EXISTS pm_gst_bills (
  id           text PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_no   text NOT NULL,
  date         text NOT NULL,
  buyer_name   text DEFAULT '',
  buyer_gstin  text DEFAULT '',
  buyer_address text DEFAULT '',
  buyer_state  text DEFAULT '',
  items        jsonb NOT NULL DEFAULT '[]',
  taxable      integer NOT NULL DEFAULT 0,
  cgst         integer NOT NULL DEFAULT 0,
  sgst         integer NOT NULL DEFAULT 0,
  igst         integer NOT NULL DEFAULT 0,
  total        integer NOT NULL DEFAULT 0,
  is_interstate boolean DEFAULT false,
  note         text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE pm_gst_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_gst_bills" ON pm_gst_bills FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_gst_bills_user ON pm_gst_bills(user_id);

-- ===== BARCODE column on pm_stock =====
ALTER TABLE pm_stock ADD COLUMN IF NOT EXISTS barcode text DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_stock_barcode ON pm_stock(user_id, barcode);

-- ===== RETURNS / REFUNDS =====
CREATE TABLE IF NOT EXISTS pm_returns (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  ts bigint,
  amt integer NOT NULL,
  type text NOT NULL CHECK (type IN ('customer','supplier')),
  reason text DEFAULT 'Defective',
  note text DEFAULT '',
  ref_name text DEFAULT '',
  country text DEFAULT 'IN',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pm_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_returns" ON pm_returns FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_date ON pm_returns(user_id, date);

-- ===== MULTI-BRANCH =====
CREATE TABLE IF NOT EXISTS pm_branches (
  id         text PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  location   text DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pm_branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_branches" ON pm_branches FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_branches_user ON pm_branches(user_id);

-- Add branch_id to data tables (NULL = original/unassigned, filled for new records)
ALTER TABLE pm_sales         ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;
ALTER TABLE pm_expenses      ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;
ALTER TABLE pm_udhaar        ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;
ALTER TABLE pm_stock         ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;
ALTER TABLE pm_kharidi       ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;
ALTER TABLE pm_dealer_entries ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;
ALTER TABLE pm_cashbook      ADD COLUMN IF NOT EXISTS branch_id text DEFAULT NULL;

-- Indexes for branch-filtered queries
CREATE INDEX IF NOT EXISTS idx_sales_branch     ON pm_sales(user_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch  ON pm_expenses(user_id, branch_id);

-- ===== EMI / INSTALLMENT TRACKER =====
CREATE TABLE IF NOT EXISTS pm_emi_plans (
  id            text PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  phone         text DEFAULT '',
  total_amt     integer NOT NULL,
  down_payment  integer NOT NULL DEFAULT 0,
  installments  integer NOT NULL,
  frequency     text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly','monthly')),
  start_date    text NOT NULL,
  note          text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE pm_emi_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_emi_plans" ON pm_emi_plans FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_emi_plans_user ON pm_emi_plans(user_id);

CREATE TABLE IF NOT EXISTS pm_emi_payments (
  id        text PRIMARY KEY,
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id   text NOT NULL REFERENCES pm_emi_plans(id) ON DELETE CASCADE,
  due_date  text NOT NULL,
  amt       integer NOT NULL,
  paid      boolean DEFAULT false,
  paid_date text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pm_emi_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_emi_payments" ON pm_emi_payments FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_emi_payments_plan ON pm_emi_payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_emi_payments_user_due ON pm_emi_payments(user_id, due_date, paid);

-- ===== LOAN / CREDIT MANAGER =====
CREATE TABLE IF NOT EXISTS pm_loans (
  id            text PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lender        text NOT NULL,
  loan_amt      integer NOT NULL,
  interest_rate numeric(5,2) NOT NULL DEFAULT 0,
  tenure        integer NOT NULL,
  emi_amt       integer NOT NULL,
  start_date    text NOT NULL,
  note          text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE pm_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_loans" ON pm_loans FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON pm_loans(user_id);

CREATE TABLE IF NOT EXISTS pm_loan_payments (
  id        text PRIMARY KEY,
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  loan_id   text NOT NULL REFERENCES pm_loans(id) ON DELETE CASCADE,
  due_date  text NOT NULL,
  emi_amt   integer NOT NULL,
  principal integer NOT NULL DEFAULT 0,
  interest  integer NOT NULL DEFAULT 0,
  paid      boolean DEFAULT false,
  paid_date text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pm_loan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_loan_payments" ON pm_loan_payments FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON pm_loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_due ON pm_loan_payments(user_id, due_date, paid);
