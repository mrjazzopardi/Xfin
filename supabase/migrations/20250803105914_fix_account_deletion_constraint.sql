-- Fix Account Deletion Constraint Issues
-- This migration provides options for handling account deletions safely

-- Option 1: Create a function to safely archive accounts instead of deleting them
CREATE OR REPLACE FUNCTION public.archive_account(account_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_count INTEGER;
BEGIN
    -- Check if account has any transactions
    SELECT COUNT(*) INTO transaction_count
    FROM public.transactions
    WHERE account_id = account_uuid;
    
    IF transaction_count > 0 THEN
        -- Archive the account instead of deleting it
        UPDATE public.accounts
        SET is_active = false,
            account_name = account_name || ' (Archived)',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = account_uuid;
        
        RAISE NOTICE 'Account archived due to existing transactions. Transaction count: %', transaction_count;
        RETURN true;
    ELSE
        -- Safe to delete if no transactions
        DELETE FROM public.accounts WHERE id = account_uuid;
        RAISE NOTICE 'Account deleted successfully (no transactions found)';
        RETURN true;
    END IF;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Cannot delete account: Still referenced by transactions';
        RETURN false;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error archiving account: %', SQLERRM;
        RETURN false;
END;
$$;

-- Option 2: Create a function to transfer transactions to another account before deletion
CREATE OR REPLACE FUNCTION public.transfer_and_delete_account(
    source_account_uuid UUID,
    target_account_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_count INTEGER;
BEGIN
    -- Verify target account exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = target_account_uuid AND is_active = true
    ) THEN
        RAISE NOTICE 'Target account does not exist or is not active';
        RETURN false;
    END IF;
    
    -- Count transactions to be transferred
    SELECT COUNT(*) INTO transaction_count
    FROM public.transactions
    WHERE account_id = source_account_uuid;
    
    -- Transfer all transactions to the target account
    UPDATE public.transactions
    SET account_id = target_account_uuid,
        updated_at = CURRENT_TIMESTAMP
    WHERE account_id = source_account_uuid;
    
    -- Now safe to delete the source account
    DELETE FROM public.accounts WHERE id = source_account_uuid;
    
    RAISE NOTICE 'Transferred % transactions and deleted account successfully', transaction_count;
    RETURN true;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key constraint error: %', SQLERRM;
        RETURN false;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error transferring transactions: %', SQLERRM;
        RETURN false;
END;
$$;

-- Option 3: Create a view for active accounts to hide archived ones
CREATE OR REPLACE VIEW public.active_accounts AS
SELECT 
    id,
    account_code,
    account_name,
    account_type,
    parent_account_id,
    created_by,
    created_at
FROM public.accounts
WHERE is_active = true;

-- Option 4: Add a constraint to prevent deletion of accounts with transactions
-- (This is more restrictive but ensures data integrity)
CREATE OR REPLACE FUNCTION public.prevent_account_deletion_with_transactions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    transaction_count INTEGER;
BEGIN
    -- Check if account has any transactions
    SELECT COUNT(*) INTO transaction_count
    FROM public.transactions
    WHERE account_id = OLD.id;
    
    IF transaction_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete account: % transactions still reference this account. Use archive_account() function instead.', transaction_count;
    END IF;
    
    RETURN OLD;
END;
$$;

-- Create the trigger to prevent unsafe deletions
CREATE TRIGGER prevent_account_deletion_with_transactions
    BEFORE DELETE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_account_deletion_with_transactions();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.archive_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_and_delete_account(UUID, UUID) TO authenticated;
GRANT SELECT ON public.active_accounts TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.archive_account IS 'Safely archives an account instead of deleting it if transactions exist';
COMMENT ON FUNCTION public.transfer_and_delete_account IS 'Transfers all transactions to another account before deletion';
COMMENT ON VIEW public.active_accounts IS 'View showing only active (non-archived) accounts';
COMMENT ON TRIGGER prevent_account_deletion_with_transactions ON public.accounts IS 'Prevents deletion of accounts that have associated transactions';