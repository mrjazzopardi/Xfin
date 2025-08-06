import { supabase } from '../lib/supabase';

export const accountService = {
  // Get all accounts
  async getAccounts(filters = {}) {
    try {
      let query = supabase?.from('accounts')?.select(`
        id,
        account_code,
        account_name,
        account_type,
        is_active,
        parent_account_id,
        created_at,
        parent_account:accounts!parent_account_id(account_code, account_name),
        created_by_user:user_profiles!created_by(full_name, email)
      `)?.order('account_code', { ascending: true });

      // Apply filters
      if (filters?.type && filters?.type !== 'all') {
        query = query?.eq('account_type', filters?.type);
      }

      if (filters?.active !== undefined) {
        query = query?.eq('is_active', filters?.active);
      }

      if (filters?.search) {
        query = query?.or(`account_code.ilike.%${filters?.search}%,account_name.ilike.%${filters?.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, accounts: data || [] };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to load accounts.' };
    }
  },

  // Get account by ID
  async getAccountById(accountId) {
    try {
      const { data, error } = await supabase?.from('accounts')?.select(`
        *,
        parent_account:accounts!parent_account_id(*),
        created_by_user:user_profiles!created_by(*)
      `)?.eq('id', accountId)?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          return { success: false, error: 'Account not found.' };
        }
        return { success: false, error: error?.message };
      }

      return { success: true, account: data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch account details.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to load account details.' };
    }
  },

  // Create new account
  async createAccount(accountData) {
    try {
      const { data, error } = await supabase?.from('accounts')?.insert({
        account_code: accountData?.account_code,
        account_name: accountData?.account_name,
        account_type: accountData?.account_type,
        parent_account_id: accountData?.parent_account_id || null,
        is_active: accountData?.is_active !== undefined ? accountData?.is_active : true
      })?.select(`
        *,
        parent_account:accounts!parent_account_id(account_code, account_name)
      `)?.single();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, account: data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to create account.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to create account.' };
    }
  },

  // Update account
  async updateAccount(accountId, updates) {
    try {
      const { data, error } = await supabase?.from('accounts')?.update(updates)?.eq('id', accountId)?.select(`
        *,
        parent_account:accounts!parent_account_id(account_code, account_name)
      `)?.single();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, account: data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to update account.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to update account.' };
    }
  },

  // Get account hierarchy (chart of accounts)
  async getAccountsHierarchy() {
    try {
      const { data, error } = await supabase?.from('accounts')?.select(`
        id,
        account_code,
        account_name,
        account_type,
        parent_account_id,
        is_active
      `)?.order('account_code', { ascending: true });

      if (error) {
        return { success: false, error: error?.message };
      }

      // Build hierarchy
      const accountMap = {};
      const rootAccounts = [];

      // First pass: create map and identify root accounts
      data?.forEach(account => {
        accountMap[account?.id] = { ...account, children: [] };
        
        if (!account?.parent_account_id) {
          rootAccounts?.push(accountMap?.[account?.id]);
        }
      });

      // Second pass: build parent-child relationships
      data?.forEach(account => {
        if (account?.parent_account_id && accountMap?.[account?.parent_account_id]) {
          accountMap?.[account?.parent_account_id]?.children?.push(accountMap?.[account?.id]);
        }
      });

      return { success: true, accountsHierarchy: rootAccounts };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch accounts hierarchy.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to load accounts hierarchy.' };
    }
  },

  // Get account balances
  async getAccountBalances(asOfDate = null) {
    try {
      let query = supabase?.from('transactions')?.select(`
        account_id,
        amount,
        transaction_type,
        transaction_date,
        account:accounts(account_code, account_name, account_type)
      `)?.eq('status', 'completed');

      if (asOfDate) {
        query = query?.lte('transaction_date', asOfDate);
      }

      const { data: transactions, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      // Calculate balances by account
      const balances = {};

      transactions?.forEach(txn => {
        const accountId = txn?.account_id;
        if (!balances?.[accountId]) {
          balances[accountId] = {
            account_id: accountId,
            account_code: txn?.account?.account_code,
            account_name: txn?.account?.account_name,
            account_type: txn?.account?.account_type,
            balance: 0,
            debit_total: 0,
            credit_total: 0
          };
        }

        const amount = parseFloat(txn?.amount);
        
        if (txn?.transaction_type === 'income') {
          balances[accountId].credit_total += Math.abs(amount);
          // For asset/expense accounts, credits decrease balance; for revenue/liability/equity, credits increase balance
          if (['asset', 'expense']?.includes(txn?.account?.account_type)) {
            balances[accountId].balance -= Math.abs(amount);
          } else {
            balances[accountId].balance += Math.abs(amount);
          }
        } else if (txn?.transaction_type === 'expense') {
          balances[accountId].debit_total += Math.abs(amount);
          // For asset/expense accounts, debits increase balance; for revenue/liability/equity, debits decrease balance
          if (['asset', 'expense']?.includes(txn?.account?.account_type)) {
            balances[accountId].balance += Math.abs(amount);
          } else {
            balances[accountId].balance -= Math.abs(amount);
          }
        }
      });

      const accountBalances = Object.values(balances);

      return { success: true, accountBalances };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to calculate account balances.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to calculate account balances.' };
    }
  },

  // Get trial balance
  async getTrialBalance(asOfDate = null) {
    try {
      const result = await this?.getAccountBalances(asOfDate);
      
      if (!result?.success) {
        return result;
      }

      const balances = result?.accountBalances;
      
      // Group by account type
      const trialBalance = {
        assets: balances?.filter(acc => acc?.account_type === 'asset'),
        liabilities: balances?.filter(acc => acc?.account_type === 'liability'),
        equity: balances?.filter(acc => acc?.account_type === 'equity'),
        revenue: balances?.filter(acc => acc?.account_type === 'revenue'),
        expenses: balances?.filter(acc => acc?.account_type === 'expense')
      };

      // Calculate totals
      const totals = {
        total_debits: balances?.reduce((sum, acc) => sum + acc?.debit_total, 0),
        total_credits: balances?.reduce((sum, acc) => sum + acc?.credit_total, 0),
        assets_total: trialBalance?.assets?.reduce((sum, acc) => sum + acc?.balance, 0),
        liabilities_total: trialBalance?.liabilities?.reduce((sum, acc) => sum + acc?.balance, 0),
        equity_total: trialBalance?.equity?.reduce((sum, acc) => sum + acc?.balance, 0),
        revenue_total: trialBalance?.revenue?.reduce((sum, acc) => sum + acc?.balance, 0),
        expenses_total: trialBalance?.expenses?.reduce((sum, acc) => sum + acc?.balance, 0)
      };

      // Check if trial balance balances
      totals.is_balanced = Math.abs(totals?.total_debits - totals?.total_credits) < 0.01;

      return { 
        success: true, 
        trialBalance: {
          ...trialBalance,
          totals,
          as_of_date: asOfDate || new Date()?.toISOString()?.split('T')?.[0]
        }
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to generate trial balance.' 
        };
      }
      
      console.error('Account service error:', error);
      return { success: false, error: 'Failed to generate trial balance.' };
    }
  }
};

function safeDeleteAccount(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: safeDeleteAccount is not implemented yet.', args);
  return null;
}

export { safeDeleteAccount };