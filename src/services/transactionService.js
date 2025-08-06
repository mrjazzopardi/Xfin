import { supabase } from '../lib/supabase';

export const transactionService = {
  // Get all transactions with optional filtering
  async getTransactions(filters = {}) {
    try {
      let query = supabase?.from('transactions')?.select(`
          id,
          transaction_date,
          description,
          amount,
          transaction_type,
          status,
          category,
          reference_number,
          reconciled_at,
          created_at,
          updated_at,
          account:accounts(account_code, account_name),
          client:clients(name, email),
          created_by_user:user_profiles!transactions_created_by_fkey(full_name, email)
        `)?.order('transaction_date', { ascending: false })

      // Apply filters
      if (filters?.type && filters?.type !== 'all') {
        query = query?.eq('transaction_type', filters?.type)
      }

      if (filters?.status && filters?.status !== 'all') {
        query = query?.eq('status', filters?.status)
      }

      if (filters?.dateFrom) {
        query = query?.gte('transaction_date', filters?.dateFrom)
      }

      if (filters?.dateTo) {
        query = query?.lte('transaction_date', filters?.dateTo)
      }

      if (filters?.search) {
        query = query?.or(`description.ilike.%${filters?.search}%,reference_number.ilike.%${filters?.search}%`)
      }

      if (filters?.clientId) {
        query = query?.eq('client_id', filters?.clientId)
      }

      const { data, error } = await query

      if (error) {
        // Enhanced error handling for specific database issues
        if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
          return { 
            success: false, 
            error: 'Database schema not found. Please run the migration scripts to set up your database.',
            type: 'SCHEMA_ERROR',
            details: error?.message
          };
        }
        
        if (error?.message?.includes('Failed to fetch')) {
          return { 
            success: false, 
            error: 'Cannot connect to database. Your Supabase project may be paused or deleted.',
            type: 'CONNECTION_ERROR',
            details: error?.message
          };
        }

        return { success: false, error: error?.message };
      }

      return { success: true, transactions: data || [] }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.',
          type: 'CONNECTION_ERROR',
          details: error?.message
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to load transactions.' }
    }
  },

  // Get transaction by ID
  async getTransactionById(transactionId) {
    try {
      const { data, error } = await supabase?.from('transactions')?.select(`
          *,
          account:accounts(*),
          client:clients(*),
          created_by_user:user_profiles!transactions_created_by_fkey(*)
        `)?.eq('id', transactionId)?.single()

      if (error) {
        if (error?.code === 'PGRST116') {
          return { success: false, error: 'Transaction not found.' }
        }
        return { success: false, error: error?.message };
      }

      return { success: true, transaction: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch transaction details.' 
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to load transaction details.' }
    }
  },

  // Create new transaction
  async createTransaction(transactionData) {
    try {
      const { data, error } = await supabase?.from('transactions')?.insert({
          transaction_date: transactionData?.transaction_date,
          description: transactionData?.description,
          amount: transactionData?.amount,
          transaction_type: transactionData?.transaction_type,
          status: transactionData?.status || 'pending',
          account_id: transactionData?.account_id,
          client_id: transactionData?.client_id,
          category: transactionData?.category,
          reference_number: transactionData?.reference_number
        })?.select(`
          *,
          account:accounts(account_code, account_name),
          client:clients(name, email)
        `)?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, transaction: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to create transaction.' 
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to create transaction.' }
    }
  },

  // Update transaction
  async updateTransaction(transactionId, updates) {
    try {
      const { data, error } = await supabase?.from('transactions')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', transactionId)?.select(`
          *,
          account:accounts(account_code, account_name),
          client:clients(name, email)
        `)?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, transaction: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to update transaction.' 
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to update transaction.' }
    }
  },

  // Delete transaction
  async deleteTransaction(transactionId) {
    try {
      const { error } = await supabase?.from('transactions')?.delete()?.eq('id', transactionId)

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to delete transaction.' 
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to delete transaction.' }
    }
  },

  // Bulk operations
  async bulkUpdateTransactions(transactionIds, updates) {
    try {
      const { data, error } = await supabase?.from('transactions')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.in('id', transactionIds)?.select()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, transactions: data || [] }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database for bulk update.' 
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to update transactions.' }
    }
  },

  // Get transaction summary/statistics
  async getTransactionSummary(filters = {}) {
    try {
      let query = supabase?.from('transactions')?.select('amount, transaction_type, status, transaction_date')

      // Apply same filters as getTransactions
      if (filters?.dateFrom) {
        query = query?.gte('transaction_date', filters?.dateFrom)
      }

      if (filters?.dateTo) {
        query = query?.lte('transaction_date', filters?.dateTo)
      }

      if (filters?.clientId) {
        query = query?.eq('client_id', filters?.clientId)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error?.message };
      }

      // Calculate summary statistics
      const summary = {
        total_income: 0,
        total_expense: 0,
        net_amount: 0,
        pending_count: 0,
        completed_count: 0,
        total_count: data?.length || 0
      }

      data?.forEach(transaction => {
        if (transaction?.transaction_type === 'income') {
          summary.total_income += parseFloat(transaction?.amount)
        } else if (transaction?.transaction_type === 'expense') {
          summary.total_expense += Math.abs(parseFloat(transaction?.amount))
        }

        if (transaction?.status === 'pending') {
          summary.pending_count += 1
        } else if (transaction?.status === 'completed') {
          summary.completed_count += 1
        }
      })

      summary.net_amount = summary?.total_income - summary?.total_expense

      return { success: true, summary }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to calculate summary.' 
        }
      }
      
      console.error('Transaction service error:', error)
      return { success: false, error: 'Failed to calculate transaction summary.' }
    }
  }
}