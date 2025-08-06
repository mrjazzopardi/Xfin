-- Location: supabase/migrations/20250802172431_accounting_pro_complete_schema.sql
-- Schema Analysis: Fresh project - no existing tables
-- Integration Type: Complete accounting application schema
-- Dependencies: None (fresh project)

-- 1. Types and Enums
CREATE TYPE public.user_role AS ENUM ('partner', 'staff', 'freelancer', 'client');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'reconciled');
CREATE TYPE public.compliance_status AS ENUM ('compliant', 'non_compliant', 'pending_review');
CREATE TYPE public.account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE public.report_type AS ENUM ('profit_loss', 'balance_sheet', 'cash_flow', 'tax_summary', 'custom');
CREATE TYPE public.document_type AS ENUM ('invoice', 'receipt', 'contract', 'tax_document', 'bank_statement', 'other');

-- 2. Core User Management
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'staff'::public.user_role,
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chart of Accounts
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    account_type public.account_type NOT NULL,
    parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clients Management
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB,
    tax_id TEXT,
    billing_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    assigned_to UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Financial Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type public.transaction_type NOT NULL,
    status public.transaction_status DEFAULT 'pending'::public.transaction_status,
    account_id UUID REFERENCES public.accounts(id) NOT NULL,
    client_id UUID REFERENCES public.clients(id),
    category TEXT,
    reference_number TEXT,
    reconciled_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Financial Reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    report_type public.report_type NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    generated_data JSONB,
    date_range_start DATE,
    date_range_end DATE,
    generated_by UUID REFERENCES public.user_profiles(id),
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tax Compliance
CREATE TABLE public.tax_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_period TEXT NOT NULL,
    tax_type TEXT NOT NULL,
    amount_due DECIMAL(15,2),
    amount_paid DECIMAL(15,2) DEFAULT 0,
    due_date DATE,
    filed_date DATE,
    status public.compliance_status DEFAULT 'pending_review'::public.compliance_status,
    client_id UUID REFERENCES public.clients(id),
    filed_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bank Reconciliation
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_type TEXT DEFAULT 'checking',
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES public.bank_accounts(id) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2),
    is_reconciled BOOLEAN DEFAULT false,
    matched_transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Document Management
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    document_type public.document_type NOT NULL,
    file_size BIGINT,
    file_url TEXT,
    client_id UUID REFERENCES public.clients(id),
    transaction_id UUID REFERENCES public.transactions(id),
    uploaded_by UUID REFERENCES public.user_profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Activity Logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_accounts_type ON public.accounts(account_type);
CREATE INDEX idx_accounts_code ON public.accounts(account_code);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX idx_bank_transactions_account_id ON public.bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions(transaction_date);
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_documents_transaction_id ON public.documents(transaction_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 12. Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies - Following Pattern 1 for user_profiles
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 2: Simple user ownership for most tables
CREATE POLICY "users_manage_own_accounts"
ON public.accounts
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_manage_assigned_clients"
ON public.clients
FOR ALL
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "users_manage_own_transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_manage_own_reports"
ON public.reports
FOR ALL
TO authenticated
USING (generated_by = auth.uid())
WITH CHECK (generated_by = auth.uid());

CREATE POLICY "users_manage_own_tax_filings"
ON public.tax_filings
FOR ALL
TO authenticated
USING (filed_by = auth.uid())
WITH CHECK (filed_by = auth.uid());

-- Pattern 4: Public read for bank accounts (within organization)
CREATE POLICY "authenticated_users_view_bank_accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_users_manage_bank_transactions"
ON public.bank_transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "users_manage_own_documents"
ON public.documents
FOR ALL
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "users_manage_own_activity_logs"
ON public.activity_logs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 14. Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- 16. Complete Mock Data for Accounting Application
DO $$
DECLARE
    partner_uuid UUID := gen_random_uuid();
    staff_uuid UUID := gen_random_uuid();
    freelancer_uuid UUID := gen_random_uuid();
    client_user_uuid UUID := gen_random_uuid();
    
    asset_account_uuid UUID := gen_random_uuid();
    revenue_account_uuid UUID := gen_random_uuid();
    expense_account_uuid UUID := gen_random_uuid();
    
    client1_uuid UUID := gen_random_uuid();
    client2_uuid UUID := gen_random_uuid();
    
    bank_account_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (partner_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sarah.johnson@accountingpro.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Sarah Johnson", "role": "partner"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (staff_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'michael.chen@accountingpro.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Michael Chen", "role": "staff"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (freelancer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'emily.rodriguez@freelance.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Emily Rodriguez", "role": "freelancer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (client_user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'david.thompson@client.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "David Thompson", "role": "client"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create Chart of Accounts
    INSERT INTO public.accounts (id, account_code, account_name, account_type, created_by) VALUES
        (asset_account_uuid, '1000', 'Cash and Cash Equivalents', 'asset'::public.account_type, partner_uuid),
        (gen_random_uuid(), '1100', 'Accounts Receivable', 'asset'::public.account_type, partner_uuid),
        (gen_random_uuid(), '1200', 'Office Equipment', 'asset'::public.account_type, partner_uuid),
        (revenue_account_uuid, '4000', 'Service Revenue', 'revenue'::public.account_type, partner_uuid),
        (gen_random_uuid(), '4100', 'Consulting Revenue', 'revenue'::public.account_type, partner_uuid),
        (expense_account_uuid, '5000', 'Office Expenses', 'expense'::public.account_type, partner_uuid),
        (gen_random_uuid(), '5100', 'Software Licenses', 'expense'::public.account_type, partner_uuid),
        (gen_random_uuid(), '2000', 'Accounts Payable', 'liability'::public.account_type, partner_uuid);

    -- Create Sample Clients
    INSERT INTO public.clients (id, name, email, phone, billing_rate, assigned_to) VALUES
        (client1_uuid, 'TechStart Solutions', 'contact@techstart.com', '+1-555-0101', 150.00, staff_uuid),
        (client2_uuid, 'Green Energy Corp', 'billing@greenenergy.com', '+1-555-0102', 200.00, partner_uuid),
        (gen_random_uuid(), 'Downtown Restaurant', 'owner@downtown-eats.com', '+1-555-0103', 125.00, freelancer_uuid),
        (gen_random_uuid(), 'Smith Law Office', 'admin@smithlaw.com', '+1-555-0104', 175.00, staff_uuid);

    -- Create Bank Account
    INSERT INTO public.bank_accounts (id, account_name, account_number, bank_name, current_balance) VALUES
        (bank_account_uuid, 'Business Checking', '****1234', 'First National Bank', 124580.00);

    -- Create Sample Transactions
    INSERT INTO public.transactions (transaction_date, description, amount, transaction_type, status, account_id, client_id, created_by) VALUES
        (CURRENT_DATE - INTERVAL '5 days', 'Consulting Services - TechStart', 7500.00, 'income'::public.transaction_type, 'completed'::public.transaction_status, revenue_account_uuid, client1_uuid, staff_uuid),
        (CURRENT_DATE - INTERVAL '3 days', 'Office Rent Payment', -2500.00, 'expense'::public.transaction_type, 'completed'::public.transaction_status, expense_account_uuid, null, partner_uuid),
        (CURRENT_DATE - INTERVAL '2 days', 'Software License Renewal', -299.00, 'expense'::public.transaction_type, 'completed'::public.transaction_status, expense_account_uuid, null, staff_uuid),
        (CURRENT_DATE - INTERVAL '1 day', 'Tax Advisory Services - Green Energy', 3500.00, 'income'::public.transaction_type, 'completed'::public.transaction_status, revenue_account_uuid, client2_uuid, partner_uuid),
        (CURRENT_DATE, 'Equipment Purchase', -1200.00, 'expense'::public.transaction_type, 'pending'::public.transaction_status, expense_account_uuid, null, staff_uuid);

    -- Create Bank Transactions for Reconciliation
    INSERT INTO public.bank_transactions (bank_account_id, transaction_date, description, amount, balance_after, is_reconciled) VALUES
        (bank_account_uuid, CURRENT_DATE - INTERVAL '5 days', 'TechStart Solutions Payment', 7500.00, 132080.00, true),
        (bank_account_uuid, CURRENT_DATE - INTERVAL '3 days', 'Office Rent ACH', -2500.00, 129580.00, true),
        (bank_account_uuid, CURRENT_DATE - INTERVAL '2 days', 'Software Co. Subscription', -299.00, 129281.00, false),
        (bank_account_uuid, CURRENT_DATE - INTERVAL '1 day', 'Green Energy Corp Wire', 3500.00, 132781.00, false),
        (bank_account_uuid, CURRENT_DATE, 'Pending Equipment Purchase', -1200.00, 131581.00, false);

    -- Create Sample Tax Filings
    INSERT INTO public.tax_filings (filing_period, tax_type, amount_due, amount_paid, due_date, status, client_id, filed_by) VALUES
        ('Q3 2024', 'Quarterly Sales Tax', 2450.00, 2450.00, CURRENT_DATE + INTERVAL '15 days', 'compliant'::public.compliance_status, client1_uuid, partner_uuid),
        ('Q4 2024', 'Payroll Tax', 3200.00, 0.00, CURRENT_DATE + INTERVAL '30 days', 'pending_review'::public.compliance_status, client2_uuid, staff_uuid);

    -- Create Sample Reports
    INSERT INTO public.reports (report_name, report_type, parameters, generated_by) VALUES
        ('Monthly P&L - January 2024', 'profit_loss'::public.report_type, '{"month": "2024-01", "include_details": true}'::jsonb, partner_uuid),
        ('Cash Flow Analysis Q1', 'cash_flow'::public.report_type, '{"quarter": "Q1-2024", "detailed": false}'::jsonb, staff_uuid);

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error during mock data creation: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error during mock data creation: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error during mock data creation: %', SQLERRM;
END $$;