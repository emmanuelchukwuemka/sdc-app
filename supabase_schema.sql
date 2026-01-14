-- SUPABASE COMPLETE DATABASE RESET SCHEMA
-- This script resets all tables and sets up the strict format for the SDC application.

-- 1. DROP EXISTING TABLES (CLEAN SLATE)
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.escrow_transactions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.kyc_documents CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CREATE TABLES

-- Core Agencies Table
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at timestamptz DEFAULT now()
);

-- Core KYC / Profile Table
CREATE TABLE public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('SURROGATE', 'DONOR', 'IP', 'AGENCY', 'ADMIN')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'approved', 'rejected')),
  form_data jsonb DEFAULT '{}'::jsonb,
  form_progress int DEFAULT 0,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL,
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compatibility Users Table (Mirroring KYC for App.js lookups)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now()
);

-- Finance: Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Finance: Escrow / Transactions
CREATE TABLE public.escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'NGN',
  type text NOT NULL CHECK (type IN ('payment', 'withdrawal', 'commission')),
  status text DEFAULT 'held' CHECK (status IN ('held', 'released', 'failed')),
  reference text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Support: Disputes / Inquiries
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid, -- Reference to a listing/another user
  reason text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Admin: Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
  created_at timestamptz DEFAULT now()
);

-- Legal: Contracts
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  signer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'void')),
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS POLICIES (BASIC SECURITY)

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own KYC" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own KYC" ON public.kyc_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can see own finance" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can see own transactions" ON public.escrow_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access" ON public.kyc_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.kyc_documents WHERE user_id = auth.uid() AND role = 'ADMIN')
);

-- 4. HELPER TRIGGERS

-- Automatically update updated_at on KYC change
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kyc_timestamp
BEFORE UPDATE ON public.kyc_documents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Sync public.users whenever KYC is created or updated
CREATE OR REPLACE FUNCTION sync_profiles()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, email, first_name, last_name)
  VALUES (
    NEW.user_id, 
    NEW.role, 
    NEW.form_data->>'email', 
    NEW.form_data->>'first_name', 
    NEW.form_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_kyc_to_users
AFTER INSERT OR UPDATE ON public.kyc_documents
FOR EACH ROW EXECUTE FUNCTION sync_profiles();
