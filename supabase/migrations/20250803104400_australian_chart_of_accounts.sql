-- Location: supabase/migrations/20250803104400_australian_chart_of_accounts.sql
-- Schema Analysis: Existing accounting application with basic accounts table
-- Integration Type: Enhancement - adding Australian chart of accounts structure
-- Dependencies: Existing accounts table

-- 1. Add new columns to accounts table for Australian requirements
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tax_treatment TEXT DEFAULT 'BAS Excluded';

-- 2. Create index for tax_treatment for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_tax_treatment ON public.accounts(tax_treatment);

-- 3. Update existing account type enum to include Australian account categories
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'current_asset';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'fixed_asset';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'current_liability';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'non_current_liability';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'inventory';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'direct_costs';

-- 4. Clear existing accounts to replace with Australian chart of accounts
DELETE FROM public.accounts WHERE account_code IN ('1000', '1100', '1200', '4000', '4100', '5000', '5100', '2000');

-- 5. Insert comprehensive Australian Chart of Accounts
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Get a default user for created_by field
    SELECT id INTO default_user_id FROM public.user_profiles LIMIT 1;
    
    -- If no user exists, create a system user entry
    IF default_user_id IS NULL THEN
        -- Get first auth user
        SELECT id INTO default_user_id FROM auth.users LIMIT 1;
    END IF;
    
    -- Insert all Australian chart of accounts
    INSERT INTO public.accounts (account_code, account_name, account_type, description, tax_treatment, created_by, is_active) VALUES
        -- Bank and Assets
        ('1', 'FFLDS', 'asset'::public.account_type, 'Bank', 'BAS Excluded', default_user_id, true),
        ('200', 'Sales', 'revenue'::public.account_type, 'Income from any normal business activity', 'GST Free Income', default_user_id, true),
        ('230', 'Rent Revenue', 'revenue'::public.account_type, 'Rent paid to FFLDS, rental agreement in place', 'GST Free Income', default_user_id, true),
        ('260', 'Other Revenue', 'revenue'::public.account_type, 'Any other income that does not relate to normal business activities and is not recurring', 'GST on Income', default_user_id, true),
        ('270', 'Interest Income', 'revenue'::public.account_type, 'Interest income', 'GST Free Income', default_user_id, true),
        
        -- Direct Costs
        ('310', 'Cost of Goods Sold', 'direct_costs'::public.account_type, 'Cost of goods sold by the business', 'GST on Expenses', default_user_id, true),
        
        -- Operating Expenses
        ('400', 'Advertising', 'expense'::public.account_type, 'Expenses incurred for advertising while trying to increase sales', 'GST on Expenses', default_user_id, true),
        ('404', 'Bank Fees', 'expense'::public.account_type, 'Fees charged by your bank for transactions regarding your bank account(s)', 'GST Free Expenses', default_user_id, true),
        ('405', 'Filing Fees', 'expense'::public.account_type, 'ASIC Fee', 'BAS Excluded', default_user_id, true),
        ('408', 'Cleaning', 'expense'::public.account_type, 'Expenses incurred for cleaning business property', 'GST on Expenses', default_user_id, true),
        ('409', 'Client Amenities', 'expense'::public.account_type, 'Client boarding purchases, food, etc', 'GST on Expenses', default_user_id, true),
        ('412', 'Consulting & Accounting', 'expense'::public.account_type, 'Expenses related to paying consultants', 'GST on Expenses', default_user_id, true),
        ('413', 'WHS Expense', 'expense'::public.account_type, 'Work health and safety related items such as security patrols', 'GST on Expenses', default_user_id, true),
        ('416', 'Depreciation', 'expense'::public.account_type, 'The amount of the asset''s cost (based on the useful life) that was consumed during the period', 'BAS Excluded', default_user_id, true),
        ('420', 'Entertainment', 'expense'::public.account_type, 'Expenses paid by company for the business but are not deductable for income tax purposes', 'GST on Expenses', default_user_id, true),
        ('425', 'Freight & Courier', 'expense'::public.account_type, 'Expenses incurred on courier & freight costs', 'GST on Expenses', default_user_id, true),
        ('429', 'General Expenses', 'expense'::public.account_type, 'General expenses related to the running of the business', 'GST on Expenses', default_user_id, true),
        ('433', 'Insurance', 'expense'::public.account_type, 'Expenses incurred for insuring the business'' assets', 'GST on Expenses', default_user_id, true),
        ('437', 'Interest Expense', 'expense'::public.account_type, 'Any interest expenses paid to ATO, business bank accounts or credit card accounts', 'GST Free Expenses', default_user_id, true),
        ('441', 'Legal expenses', 'expense'::public.account_type, 'Expenses incurred on any legal matters', 'GST on Expenses', default_user_id, true),
        ('445', 'Light, Power, Heating', 'expense'::public.account_type, 'Expenses incurred for lighting, powering or heating the premises', 'GST on Expenses', default_user_id, true),
        ('446', 'Water Rates', 'expense'::public.account_type, 'Water bills', 'GST Free Expenses', default_user_id, true),
        ('449', 'Motor Vehicle Expenses', 'expense'::public.account_type, 'Expenses incurred on the running of company motor vehicles', 'GST on Expenses', default_user_id, true),
        ('452', 'Disability House Expenses', 'expense'::public.account_type, 'General expenses related to the running of the house', 'GST on Expenses', default_user_id, true),
        ('453', 'Office Expenses', 'expense'::public.account_type, 'General expenses related to the running of the business office', 'GST on Expenses', default_user_id, true),
        ('454', 'Medical equipment rental', 'expense'::public.account_type, 'Rented medical devices or medical equipment', 'GST on Expenses', default_user_id, true),
        ('461', 'Printing & Stationery', 'expense'::public.account_type, 'Expenses incurred by the entity as a result of printing and stationery', 'GST on Expenses', default_user_id, true),
        ('469', 'Rent', 'expense'::public.account_type, 'The payment to lease a building or area', 'GST Free Expenses', default_user_id, true),
        ('473', 'Repairs and Maintenance', 'expense'::public.account_type, 'Expenses incurred on a damaged or run down asset that will bring the asset back to its original condition', 'GST on Expenses', default_user_id, true),
        ('477', 'Wages and Salaries', 'expense'::public.account_type, 'Payment to employees in exchange for their resources', 'BAS Excluded', default_user_id, true),
        ('478', 'Superannuation', 'expense'::public.account_type, 'Superannuation contributions', 'BAS Excluded', default_user_id, true),
        ('479', 'Staff Amenities', 'expense'::public.account_type, 'Providing refreshments and minor comforts to employees during their working hours', 'GST on Expenses', default_user_id, true),
        ('485', 'Subscriptions', 'expense'::public.account_type, 'E.g. Magazines, professional bodies', 'GST on Expenses', default_user_id, true),
        ('489', 'Telephone & Internet', 'expense'::public.account_type, 'Expenditure incurred from any business-related phone calls, phone lines, or internet connections', 'GST on Expenses', default_user_id, true),
        ('493', 'Travel - National', 'expense'::public.account_type, 'Expenses incurred from domestic travel which has a business purpose', 'GST on Expenses', default_user_id, true),
        ('494', 'Travel - International', 'expense'::public.account_type, 'Expenses incurred from international travel which has a business purpose', 'GST Free Expenses', default_user_id, true),
        ('497', 'Bank Revaluations', 'expense'::public.account_type, 'Bank account revaluations due for foreign exchange rate changes', 'BAS Excluded', default_user_id, true),
        ('498', 'Unrealised Currency Gains', 'expense'::public.account_type, 'Unrealised currency gains on outstanding items', 'BAS Excluded', default_user_id, true),
        ('499', 'Realised Currency Gains', 'expense'::public.account_type, 'Gains or losses made due to currency exchange rate changes', 'BAS Excluded', default_user_id, true),
        ('505', 'Income Tax Expense', 'expense'::public.account_type, 'A percentage of total earnings paid to the government', 'BAS Excluded', default_user_id, true),
        
        -- Current Assets
        ('610', 'Accounts Receivable', 'current_asset'::public.account_type, 'Outstanding invoices the company has issued out to the client but has not yet received in cash at balance date', 'BAS Excluded', default_user_id, true),
        ('620', 'Prepayments', 'current_asset'::public.account_type, 'An expenditure that has been paid for in advance', 'BAS Excluded', default_user_id, true),
        ('630', 'Inventory', 'inventory'::public.account_type, 'Value of tracked items for resale', 'BAS Excluded', default_user_id, true),
        
        -- Fixed Assets
        ('710', 'Office Equipment', 'fixed_asset'::public.account_type, 'Office equipment that is owned and controlled by the business', 'GST on Expenses', default_user_id, true),
        ('711', 'Less Accumulated Depreciation on Office Equipment', 'fixed_asset'::public.account_type, 'The total amount of office equipment cost that has been consumed by the entity (based on the useful life)', 'BAS Excluded', default_user_id, true),
        ('712', 'Disability House Equipment', 'current_asset'::public.account_type, 'House equipment that is owner and controlled by the business', 'GST on Expenses', default_user_id, true),
        ('720', 'Computer Equipment', 'fixed_asset'::public.account_type, 'Computer equipment that is owned and controlled by the business', 'GST on Expenses', default_user_id, true),
        ('721', 'Less Accumulated Depreciation on Computer Equipment', 'fixed_asset'::public.account_type, 'The total amount of computer equipment cost that has been consumed by the business (based on the useful life)', 'BAS Excluded', default_user_id, true),
        
        -- Current Liabilities
        ('800', 'Accounts Payable', 'current_liability'::public.account_type, 'Outstanding invoices the company has received from suppliers but has not yet paid at balance date', 'BAS Excluded', default_user_id, true),
        ('801', 'Unpaid Expense Claims', 'current_liability'::public.account_type, 'Expense claims typically made by employees/shareholder employees still outstanding', 'BAS Excluded', default_user_id, true),
        ('804', 'Wages Payable - Payroll', 'current_liability'::public.account_type, 'Where this account is set as the nominated Wages Payable account within Payroll Settings, Xero allocates the net wage amount of each pay run created using Payroll to this account', 'BAS Excluded', default_user_id, true),
        ('820', 'GST', 'current_liability'::public.account_type, 'The balance in this account represents GST owing to or from the ATO. At the end of the GST period, it is this account that should be used to code against either the refunds from or payments to the ATO that will appear on the bank statement. Xero has been designed to use only one GST account to track GST on income and expenses, so there is no need to add any new GST accounts to Xero', 'BAS Excluded', default_user_id, true),
        ('825', 'PAYG Withholdings Payable', 'current_liability'::public.account_type, 'The amount of PAYE tax that is due to be paid', 'BAS Excluded', default_user_id, true),
        ('826', 'Superannuation Payable', 'current_liability'::public.account_type, 'The amount of superannuation that is due to be paid', 'BAS Excluded', default_user_id, true),
        ('830', 'Income Tax Payable', 'current_liability'::public.account_type, 'The amount of income tax that is due to be paid, also resident withholding tax paid on interest received', 'BAS Excluded', default_user_id, true),
        ('835', 'Net BAS Payable', 'liability'::public.account_type, 'Net BAS Payable', 'BAS Excluded', default_user_id, true),
        ('840', 'Historical Adjustment', 'current_liability'::public.account_type, 'For accountant adjustments', 'BAS Excluded', default_user_id, true),
        ('850', 'Suspense', 'current_liability'::public.account_type, 'An entry that allows an unknown transaction to be entered, so the accounts can still be worked on in balance and the entry can be dealt with later', 'BAS Excluded', default_user_id, true),
        ('860', 'Rounding', 'current_liability'::public.account_type, 'An adjustment entry to allow for rounding', 'BAS Excluded', default_user_id, true),
        ('877', 'Tracking Transfers', 'current_liability'::public.account_type, 'Transfers between tracking categories', 'BAS Excluded', default_user_id, true),
        
        -- Equity
        ('880', 'Owner A Drawings', 'equity'::public.account_type, 'Withdrawals by the owners', 'BAS Excluded', default_user_id, true),
        ('881', 'Owner A Funds Introduced', 'current_liability'::public.account_type, 'Funds contributed by the owner', 'BAS Excluded', default_user_id, true),
        
        -- Non-current Liabilities
        ('900', 'Loan', 'non_current_liability'::public.account_type, 'Money that has been borrowed from a creditor', 'BAS Excluded', default_user_id, true),
        
        -- Additional Equity
        ('960', 'Retained Earnings', 'equity'::public.account_type, 'Do not Use', 'BAS Excluded', default_user_id, true),
        ('970', 'Owner A Share Capital', 'equity'::public.account_type, 'The value of shares purchased by the shareholders', 'BAS Excluded', default_user_id, true);
        
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error during Australian chart of accounts creation: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error during Australian chart of accounts creation: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error during Australian chart of accounts creation: %', SQLERRM;
END $$;

-- 6. Create function to get accounts by type for UI components
CREATE OR REPLACE FUNCTION public.get_accounts_by_type(account_type_filter TEXT DEFAULT 'all')
RETURNS TABLE(
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    description TEXT,
    tax_treatment TEXT,
    is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT 
    a.account_code,
    a.account_name,
    a.account_type::TEXT,
    a.description,
    a.tax_treatment,
    a.is_active
FROM public.accounts a
WHERE 
    a.is_active = true 
    AND (
        account_type_filter = 'all' 
        OR a.account_type::TEXT = account_type_filter
        OR (account_type_filter = 'asset' AND a.account_type::TEXT IN ('asset', 'current_asset', 'fixed_asset', 'inventory'))
        OR (account_type_filter = 'liability' AND a.account_type::TEXT IN ('liability', 'current_liability', 'non_current_liability'))
    )
ORDER BY a.account_code;
$$;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_accounts_by_type TO authenticated;