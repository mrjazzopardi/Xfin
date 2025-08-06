import { supabase } from '../lib/supabase';

export const bankReconciliationService = {
  // Get bank transactions
  async getBankTransactions(filters = {}) {
    try {
      let query = supabase?.from('bank_transactions')?.select(`
        id,
        transaction_date,
        description,
        amount,
        balance_after,
        bank_account:bank_accounts(id, account_name, bank_name),
        is_reconciled,
        matched_transaction_id,
        created_at
      `)?.order('transaction_date', { ascending: false });

      // Apply filters
      if (filters?.bankAccountId) {
        query = query?.eq('bank_account_id', filters?.bankAccountId);
      }

      if (filters?.dateFrom) {
        query = query?.gte('transaction_date', filters?.dateFrom);
      }

      if (filters?.dateTo) {
        query = query?.lte('transaction_date', filters?.dateTo);
      }

      if (filters?.unreconciled) {
        query = query?.eq('is_reconciled', false);
      }

      if (filters?.search) {
        query = query?.ilike('description', `%${filters?.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      // Transform data for UI compatibility
      const bankTransactions = data?.map(transaction => ({
        id: transaction?.id,
        date: transaction?.transaction_date,
        description: transaction?.description,
        amount: parseFloat(transaction?.amount),
        type: parseFloat(transaction?.amount) >= 0 ? 'credit' : 'debit',
        reference: transaction?.id?.slice(-8),
        balance: parseFloat(transaction?.balance_after || 0),
        matched: transaction?.is_reconciled,
        confidence: transaction?.matched_transaction_id ? 1.0 : null,
        bankAccount: transaction?.bank_account
      }));

      return { success: true, bankTransactions };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        };
      }
      
      console.error('Bank reconciliation service error:', error);
      return { success: false, error: 'Failed to load bank transactions.' };
    }
  },

  // Get recorded transactions
  async getRecordedTransactions(filters = {}) {
    try {
      let query = supabase?.from('transactions')?.select(`
        id,
        transaction_date,
        description,
        amount,
        transaction_type,
        account:accounts(account_code, account_name),
        status,
        reconciled_at,
        created_at
      `)?.order('transaction_date', { ascending: false });

      // Apply filters
      if (filters?.dateFrom) {
        query = query?.gte('transaction_date', filters?.dateFrom);
      }

      if (filters?.dateTo) {
        query = query?.lte('transaction_date', filters?.dateTo);
      }

      if (filters?.unmatched) {
        query = query?.is('reconciled_at', null);
      }

      if (filters?.search) {
        query = query?.ilike('description', `%${filters?.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      // Transform data for UI compatibility
      const recordedTransactions = data?.map(transaction => ({
        id: transaction?.id,
        date: transaction?.transaction_date,
        description: transaction?.description,
        amount: parseFloat(transaction?.amount),
        type: transaction?.transaction_type === 'income' ? 'credit' : 'debit',
        account: transaction?.account?.account_name,
        reference: transaction?.id?.slice(-8),
        matched: !!transaction?.reconciled_at,
        confidence: null
      }));

      return { success: true, recordedTransactions };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch recorded transactions.' 
        };
      }
      
      console.error('Bank reconciliation service error:', error);
      return { success: false, error: 'Failed to load recorded transactions.' };
    }
  },

  // Get suggested matches
  async getSuggestedMatches() {
    try {
      // Get unreconciled bank transactions
      const { data: bankTxns, error: bankError } = await supabase?.from('bank_transactions')?.select(`
        id,
        transaction_date,
        description,
        amount,
        balance_after,
        bank_account:bank_accounts(account_name, bank_name)
      `)?.eq('is_reconciled', false)?.order('transaction_date', { ascending: false });

      if (bankError) {
        return { success: false, error: bankError?.message };
      }

      // Get unreconciled recorded transactions
      const { data: recordedTxns, error: recordedError } = await supabase?.from('transactions')?.select(`
        id,
        transaction_date,
        description,
        amount,
        transaction_type,
        account:accounts(account_name)
      `)?.is('reconciled_at', null)?.order('transaction_date', { ascending: false });

      if (recordedError) {
        return { success: false, error: recordedError?.message };
      }

      // Generate suggested matches using matching algorithm
      const suggestedMatches = [];

      bankTxns?.forEach(bankTxn => {
        const bankAmount = parseFloat(bankTxn?.amount);
        const bankDate = new Date(bankTxn?.transaction_date);

        recordedTxns?.forEach(recordedTxn => {
          const recordedAmount = parseFloat(recordedTxn?.amount);
          const recordedDate = new Date(recordedTxn?.transaction_date);
          
          // Amount matching (considering income/expense types)
          const amountMatch = Math.abs(Math.abs(bankAmount) - Math.abs(recordedAmount)) < 0.01;
          
          // Date matching (within 7 days)
          const daysDiff = Math.abs((bankDate - recordedDate) / (1000 * 60 * 60 * 24));
          const dateMatch = daysDiff <= 7;
          
          // Description similarity (basic keyword matching)
          const bankDesc = bankTxn?.description?.toLowerCase() || '';
          const recordedDesc = recordedTxn?.description?.toLowerCase() || '';
          const descWords = bankDesc?.split(' ')?.filter(word => word?.length > 3);
          const descMatch = descWords?.some(word => recordedDesc?.includes(word));
          
          // Calculate confidence score
          let confidence = 0;
          if (amountMatch) confidence += 0.4;
          if (dateMatch) confidence += 0.3;
          if (descMatch) confidence += 0.2;
          if (daysDiff <= 1) confidence += 0.1; // Same or next day bonus
          
          // Only suggest matches with confidence > 0.6
          if (confidence > 0.6) {
            suggestedMatches?.push({
              id: `match_${bankTxn?.id}_${recordedTxn?.id}`,
              bankTransaction: {
                id: bankTxn?.id,
                date: bankTxn?.transaction_date,
                description: bankTxn?.description,
                amount: bankAmount,
                type: bankAmount >= 0 ? 'credit' : 'debit',
                balance: parseFloat(bankTxn?.balance_after || 0)
              },
              recordedTransaction: {
                id: recordedTxn?.id,
                date: recordedTxn?.transaction_date,
                description: recordedTxn?.description,
                amount: recordedAmount,
                type: recordedTxn?.transaction_type,
                account: recordedTxn?.account?.account_name
              },
              confidence: Math.round(confidence * 100) / 100,
              matchReason: `${amountMatch ? 'Amount match' : ''} ${dateMatch ? 'Date match' : ''} ${descMatch ? 'Description similarity' : ''}`?.trim(),
              status: 'suggested'
            });
          }
        });
      });

      return { success: true, suggestedMatches };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to generate match suggestions.' 
        };
      }
      
      console.error('Bank reconciliation service error:', error);
      return { success: false, error: 'Failed to generate match suggestions.' };
    }
  },

  // Accept a match
  async acceptMatch(bankTransactionId, recordedTransactionId) {
    try {
      // Update bank transaction
      const { error: bankError } = await supabase?.from('bank_transactions')?.update({
        is_reconciled: true,
        matched_transaction_id: recordedTransactionId
      })?.eq('id', bankTransactionId);

      if (bankError) {
        return { success: false, error: bankError?.message };
      }

      // Update recorded transaction
      const { error: recordedError } = await supabase?.from('transactions')?.update({
        reconciled_at: new Date()?.toISOString(),
        status: 'reconciled'
      })?.eq('id', recordedTransactionId);

      if (recordedError) {
        return { success: false, error: recordedError?.message };
      }

      return { success: true };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to accept match.' 
        };
      }
      
      console.error('Bank reconciliation service error:', error);
      return { success: false, error: 'Failed to accept match.' };
    }
  },

  // Bulk accept high confidence matches
  async bulkAcceptMatches(matchThreshold = 0.9) {
    try {
      const { data: matches, error: matchError } = await this?.getSuggestedMatches();
      
      if (!matches?.success) {
        return matches;
      }

      const highConfidenceMatches = matches?.suggestedMatches?.filter(match => match?.confidence >= matchThreshold);
      
      const results = [];
      for (const match of highConfidenceMatches) {
        const result = await this?.acceptMatch(
          match?.bankTransaction?.id,
          match?.recordedTransaction?.id
        );
        results?.push(result);
      }

      const successCount = results?.filter(r => r?.success)?.length;
      
      return { 
        success: true, 
        acceptedCount: successCount,
        totalMatches: highConfidenceMatches?.length 
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database for bulk matching.' 
        };
      }
      
      console.error('Bank reconciliation service error:', error);
      return { success: false, error: 'Failed to process bulk matches.' };
    }
  },

  // Import bank transactions
  async importBankTransactions(transactions, bankAccountId) {
    try {
      // Process and validate transactions
      const validTransactions = transactions?.map(txn => ({
        bank_account_id: bankAccountId,
        transaction_date: txn?.date,
        description: txn?.narrative || txn?.description,
        amount: txn?.credit_amount > 0 ? txn?.credit_amount : -Math.abs(txn?.debit_amount),
        balance_after: txn?.balance || null,
        is_reconciled: false,
        created_at: new Date()?.toISOString()
      }));

      const { data, error } = await supabase?.from('bank_transactions')?.insert(validTransactions)?.select();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, importedCount: data?.length };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to import transactions.' 
        };
      }
      
      console.error('Bank reconciliation service error:', error);
      return { success: false, error: 'Failed to import bank transactions.' };
    }
  }
};