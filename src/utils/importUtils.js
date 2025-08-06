// Import utilities for various data formats
export const importUtils = {
  // Parse CSV file
  parseCSV: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header row and one data row'));
            return;
          }
          
          const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
          const data = lines.slice(1).map((line, index) => {
            const values = parseCSVLine(line);
            const row = {};
            
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            
            row._originalLine = index + 2; // For error reporting
            return row;
          });
          
          resolve({ headers, data });
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  // Validate transaction import data
  validateTransactionImport: (data) => {
    const errors = [];
    const warnings = [];
    const validTransactions = [];
    
    // Required fields for transactions - updated to new column names
    const requiredFields = ['date', 'narrative', 'debit_amount', 'credit_amount'];
    const optionalFields = ['bank_account', 'balance', 'categories'];
    
    // Field mapping for compatibility with old and new formats
    const fieldMapping = {
      'date': ['date', 'Date', 'Transaction Date', 'transaction_date', 'TRANSACTION DATE'],
      'narrative': ['narrative', 'Narrative', 'description', 'Description', 'DESCRIPTION', 'Details', 'DETAILS', 'Transaction Details'],
      'debit_amount': ['debit_amount', 'Debit Amount', 'debit', 'Debit', 'DEBIT', 'Debit Amt', 'DEBIT AMOUNT'],
      'credit_amount': ['credit_amount', 'Credit Amount', 'credit', 'Credit', 'CREDIT', 'Credit Amt', 'CREDIT AMOUNT'],
      'bank_account': ['bank_account', 'Bank Account', 'account', 'Account', 'ACCOUNT', 'Account Name'],
      'balance': ['balance', 'Balance', 'BALANCE', 'Running Balance', 'Account Balance'],
      'categories': ['categories', 'Categories', 'category', 'Category', 'CATEGORY', 'Transaction Type']
    };
    
    data?.forEach((row, index) => {
      const rowErrors = [];
      const transaction = {};
      
      // Map fields using field mapping - check all possible header variations
      Object.keys(fieldMapping)?.forEach(standardField => {
        const possibleNames = fieldMapping?.[standardField];
        let value = null;
        
        for (const fieldName of possibleNames) {
          // Check for exact match first
          if (row?.[fieldName] !== undefined && row?.[fieldName] !== '') {
            value = row?.[fieldName];
            break;
          }
          // Check for case-insensitive match with trimmed spaces
          const matchingKey = Object.keys(row)?.find(key => 
            key?.toLowerCase()?.trim()?.replace(/\s+/g, ' ') === fieldName?.toLowerCase()?.trim()?.replace(/\s+/g, ' ')
          );
          if (matchingKey && row?.[matchingKey] !== undefined && row?.[matchingKey] !== '') {
            value = row?.[matchingKey];
            break;
          }
        }
        
        transaction[standardField] = value;
      });
      
      // Check required fields using mapped values
      requiredFields?.forEach(field => {
        if (!transaction?.[field] || transaction?.[field]?.toString()?.trim() === '') {
          const displayName = field?.replace('_', ' ')?.replace(/\b\w/g, l => l?.toUpperCase());
          rowErrors?.push(`Missing required field: ${displayName?.toLowerCase()}`);
        }
      });
      
      // Validate date format using mapped value
      if (transaction?.date) {
        const dateStr = transaction?.date?.toString()?.trim();
        let date = new Date(dateStr);
        
        // Try different date formats
        if (isNaN(date?.getTime())) {
          // Try DD/MM/YYYY format
          const parts = dateStr?.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (parts) {
            date = new Date(parts[3], parts[2] - 1, parts[1]); // Year, Month-1, Day
          }
        }
        
        if (isNaN(date?.getTime())) {
          rowErrors?.push('Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY');
        } else {
          // Store in ISO format for consistency
          transaction.date = date?.toISOString()?.split('T')?.[0];
        }
      }
      
      // Validate amounts using mapped values
      if (transaction?.debit_amount) {
        const amountStr = transaction?.debit_amount?.toString()?.replace(/[,$\s]/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) {
          rowErrors?.push('Invalid debit amount format');
        } else {
          transaction.debit_amount = amount;
        }
      }
      
      if (transaction?.credit_amount) {
        const amountStr = transaction?.credit_amount?.toString()?.replace(/[,$\s]/g, '');
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) {
          rowErrors?.push('Invalid credit amount format');
        } else {
          transaction.credit_amount = amount;
        }
      }
      
      // Validate balance using mapped value
      if (transaction?.balance && transaction?.balance !== '') {
        const balanceStr = transaction?.balance?.toString()?.replace(/[,$\s]/g, '');
        const balance = parseFloat(balanceStr);
        if (isNaN(balance)) {
          rowErrors?.push('Invalid balance format');
        } else {
          transaction.balance = balance;
        }
      }
      
      if (rowErrors?.length > 0) {
        errors?.push(`Row ${index + 1}: ${rowErrors?.join(', ')}`);
      } else {
        // Set defaults for optional fields
        transaction.status = transaction?.status || 'pending';
        transaction.categories = transaction?.categories || 'Uncategorized';
        transaction.bank_account = transaction?.bank_account || '';
        
        // Determine transaction type based on amounts
        if (transaction?.debit_amount > 0) {
          transaction.transaction_type = 'expense';
          transaction.amount = -Math.abs(transaction?.debit_amount);
        } else if (transaction?.credit_amount > 0) {
          transaction.transaction_type = 'income';
          transaction.amount = Math.abs(transaction?.credit_amount);
        } else {
          transaction.transaction_type = 'expense';
          transaction.amount = 0;
        }
        
        validTransactions?.push(transaction);
      }
    });
    
    return {
      isValid: errors?.length === 0,
      errors,
      warnings,
      validTransactions,
      totalRows: data?.length,
      validRows: validTransactions?.length
    };
  },

  // Validate bank statement import
  validateBankStatementImport: (data) => {
    const errors = [];
    const warnings = [];
    const validTransactions = [];
    
    // Bank statement required fields - updated to new column names
    const requiredFields = ['date', 'narrative', 'debit_amount', 'credit_amount'];
    
    // Field mapping for compatibility
    const fieldMapping = {
      'date': ['date', 'Date', 'Transaction Date', 'transaction_date', 'TRANSACTION DATE'],
      'narrative': ['narrative', 'Narrative', 'description', 'Description', 'DESCRIPTION', 'Details', 'DETAILS', 'Transaction Details'],
      'debit_amount': ['debit_amount', 'Debit Amount', 'debit', 'Debit', 'DEBIT', 'Debit Amt', 'DEBIT AMOUNT'],
      'credit_amount': ['credit_amount', 'Credit Amount', 'credit', 'Credit', 'CREDIT', 'Credit Amt', 'CREDIT AMOUNT'],
      'bank_account': ['bank_account', 'Bank Account', 'account', 'Account', 'ACCOUNT', 'Account Name'],
      'balance': ['balance', 'Balance', 'BALANCE', 'Running Balance', 'Account Balance'],
      'categories': ['categories', 'Categories', 'category', 'Category', 'CATEGORY', 'Transaction Type']
    };
    
    data?.forEach((row, index) => {
      const rowErrors = [];
      const transaction = {};
      
      // Map fields using field mapping - check all possible header variations
      Object.keys(fieldMapping)?.forEach(standardField => {
        const possibleNames = fieldMapping?.[standardField];
        let value = null;
        
        for (const fieldName of possibleNames) {
          // Check for exact match first
          if (row?.[fieldName] !== undefined && row?.[fieldName] !== '') {
            value = row?.[fieldName];
            break;
          }
          // Check for case-insensitive match with trimmed spaces
          const matchingKey = Object.keys(row)?.find(key => 
            key?.toLowerCase()?.trim()?.replace(/\s+/g, ' ') === fieldName?.toLowerCase()?.trim()?.replace(/\s+/g, ' ')
          );
          if (matchingKey && row?.[matchingKey] !== undefined && row?.[matchingKey] !== '') {
            value = row?.[matchingKey];
            break;
          }
        }
        
        transaction[standardField] = value;
      });
      
      // Check required fields using mapped values
      requiredFields?.forEach(field => {
        if (!transaction?.[field] || transaction?.[field]?.toString()?.trim() === '') {
          const displayName = field?.replace('_', ' ')?.replace(/\b\w/g, l => l?.toUpperCase());
          rowErrors?.push(`Missing required field: ${displayName?.toLowerCase()}`);
        }
      });
      
      // Parse amounts and determine type (debit/credit)
      let debitAmount = 0;
      let creditAmount = 0;
      
      if (transaction?.debit_amount) {
        const amountStr = transaction?.debit_amount?.toString()?.replace(/[,$\s]/g, '');
        debitAmount = parseFloat(amountStr);
        if (isNaN(debitAmount) || debitAmount < 0) {
          rowErrors?.push('Invalid debit amount format');
          debitAmount = 0;
        }
      }
      
      if (transaction?.credit_amount) {
        const amountStr = transaction?.credit_amount?.toString()?.replace(/[,$\s]/g, '');
        creditAmount = parseFloat(amountStr);
        if (isNaN(creditAmount) || creditAmount < 0) {
          rowErrors?.push('Invalid credit amount format');
          creditAmount = 0;
        }
      }
      
      // If neither debit nor credit is provided, try to parse from a single amount field
      if (debitAmount === 0 && creditAmount === 0 && transaction?.amount) {
        const amountStr = transaction?.amount?.toString()?.replace(/[,$\s]/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          if (amount < 0) {
            debitAmount = Math.abs(amount);
          } else {
            creditAmount = amount;
          }
        }
      }
      
      transaction.debit_amount = debitAmount;
      transaction.credit_amount = creditAmount;
      transaction.transaction_type = debitAmount > 0 ? 'expense' : 'income';
      
      // Format date using mapped value
      if (transaction?.date) {
        const dateStr = transaction?.date?.toString()?.trim();
        let date = new Date(dateStr);
        
        // Try different date formats
        if (isNaN(date?.getTime())) {
          // Try DD/MM/YYYY format
          const parts = dateStr?.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (parts) {
            date = new Date(parts[3], parts[2] - 1, parts[1]); // Year, Month-1, Day
          }
        }
        
        if (isNaN(date?.getTime())) {
          rowErrors?.push('Invalid date format');
        } else {
          transaction.date = date?.toISOString()?.split('T')?.[0];
        }
      }
      
      if (rowErrors?.length > 0) {
        errors?.push(`Row ${index + 1}: ${rowErrors?.join(', ')}`);
      } else {
        // Add bank-specific fields
        transaction.source = 'bank_import';
        transaction.status = 'pending';
        transaction.matched = false;
        transaction.categories = transaction?.categories || 'Uncategorized';
        transaction.bank_account = transaction?.bank_account || 'Default Account';
        
        validTransactions?.push(transaction);
      }
    });
    
    return {
      isValid: errors?.length === 0,
      errors,
      warnings,
      validTransactions,
      totalRows: data?.length,
      validRows: validTransactions?.length
    };
  },

  // Show import preview modal
  showImportPreview: (data, onConfirm, onCancel) => {
    // This would typically show a modal - for now, we'll use confirm
    const message = `
      Import Preview:
      - Total rows: ${data?.totalRows}
      - Valid rows: ${data?.validRows}
      - Errors: ${data?.errors?.length}
      - Warnings: ${data?.warnings?.length}
      
      ${data?.errors?.length > 0 ? 'Errors:\n' + data?.errors?.slice(0, 5)?.join('\n') : ''}
      ${data?.warnings?.length > 0 ? '\nWarnings:\n' + data?.warnings?.slice(0, 3)?.join('\n') : ''}
      
      Do you want to proceed with importing ${data?.validRows} valid transactions?
    `;
    
    if (confirm(message)) {
      onConfirm(data?.validTransactions);
    } else {
      onCancel();
    }
  }
};

// Helper function to parse CSV line handling quoted values
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line?.length; i++) {
    const char = line?.[i];
    
    if (char === '"') {
      if (inQuotes && line?.[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result?.push(current?.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result?.push(current?.trim());
  return result;
};

export default importUtils;