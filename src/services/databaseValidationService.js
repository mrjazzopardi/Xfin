import { supabase } from '../lib/supabase';

export const databaseValidationService = {
  // Check if database schema is properly set up
  async validateDatabaseSchema() {
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase?.from('user_profiles')?.select('count', { count: 'exact', head: true });
      
      if (connectionError?.message?.includes('relation') && connectionError?.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Database schema not found. Please run the migration scripts.',
          type: 'SCHEMA_MISSING',
          details: connectionError?.message
        };
      }

      if (connectionError?.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Cannot connect to Supabase. Check your project status and network connection.',
          type: 'CONNECTION_ERROR',
          details: connectionError?.message
        };
      }

      if (connectionError) {
        return {
          success: false,
          error: connectionError?.message,
          type: 'DATABASE_ERROR',
          details: connectionError
        };
      }

      // Test core tables exist
      const tableTests = [
        'user_profiles',
        'accounts', 
        'clients',
        'transactions',
        'reports',
        'tax_filings',
        'bank_accounts',
        'bank_transactions',
        'documents',
        'activity_logs'
      ];

      const results = {};
      
      for (const table of tableTests) {
        try {
          const { error } = await supabase?.from(table)?.select('count', { count: 'exact', head: true });
          results[table] = !error;
          
          if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
            return {
              success: false,
              error: `Table '${table}' does not exist. Database migration required.`,
              type: 'SCHEMA_INCOMPLETE',
              details: `Missing table: ${table}`,
              missingTable: table
            };
          }
        } catch (err) {
          results[table] = false;
        }
      }

      // Test custom types exist
      try {
        const { error: enumError } = await supabase?.rpc('get_sample_rows');
        if (enumError?.message?.includes('function') && enumError?.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'Database functions not found. Please run the complete migration script.',
            type: 'FUNCTIONS_MISSING',
            details: 'get_sample_rows function missing'
          };
        }
      } catch (err) {
        // Function test failed, but this is not critical
        console.warn('Function test failed:', err);
      }

      return {
        success: true,
        message: 'Database schema validation passed',
        tableStatus: results
      };

    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network connection failed. Check your internet connection and Supabase project status.',
          type: 'NETWORK_ERROR',
          details: error?.message
        };
      }

      return {
        success: false,
        error: 'Unexpected error during database validation',
        type: 'UNKNOWN_ERROR',
        details: error?.message
      };
    }
  },

  // Get detailed database status
  async getDatabaseStatus() {
    try {
      const validation = await this.validateDatabaseSchema();
      
      if (!validation?.success) {
        return validation;
      }

      // Get row counts for each table
      const tableCounts = {};
      const tables = ['user_profiles', 'accounts', 'clients', 'transactions', 'reports'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase?.from(table)?.select('*', { count: 'exact', head: true });
          tableCounts[table] = error ? 0 : count;
        } catch (err) {
          tableCounts[table] = 0;
        }
      }

      return {
        success: true,
        status: 'CONNECTED',
        tableCounts,
        timestamp: new Date()?.toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: 'Failed to get database status',
        type: 'STATUS_ERROR',
        details: error?.message
      };
    }
  },

  // Test specific service functions
  async testServiceConnections() {
    const results = {};

    // Test transaction service
    try {
      const { success, error } = await import('../services/transactionService')?.then(module => 
        module.transactionService?.getTransactions({ limit: 1 })
      );
      results.transactionService = { success, error };
    } catch (err) {
      results.transactionService = { success: false, error: err?.message };
    }

    // Test dashboard service  
    try {
      const { success, error } = await import('../services/dashboardService')?.then(module =>
        module.dashboardService?.getKPIData()
      );
      results.dashboardService = { success, error };
    } catch (err) {
      results.dashboardService = { success: false, error: err?.message };
    }

    return results;
  }
};