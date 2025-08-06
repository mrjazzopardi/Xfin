import { supabase } from '../lib/supabase';

export const taxService = {
  // Calculate GST from transactions
  async calculateGST(dateFrom, dateTo) {
    try {
      // Get all completed transactions in the period
      const { data: transactions, error } = await supabase?.from('transactions')?.select(`
        id,
        amount,
        transaction_type,
        transaction_date,
        description,
        account:accounts(account_name, account_type)
      `)?.eq('status', 'completed')?.gte('transaction_date', dateFrom)?.lte('transaction_date', dateTo)?.order('transaction_date', { ascending: false });

      if (error) {
        return { success: false, error: error?.message };
      }

      // Calculate GST - Australian GST is 10% (1/11 of GST-inclusive amount)
      let gstCollected = 0; // GST on sales (revenue)
      let gstPaid = 0; // GST on purchases (expenses)
      let gstFreeIncome = 0;
      let gstFreeExpenses = 0;

      transactions?.forEach(txn => {
        const amount = parseFloat(txn?.amount);
        const isGSTApplicable = this?.isGSTApplicable(txn?.account?.account_name, txn?.description);

        if (txn?.transaction_type === 'income') {
          if (isGSTApplicable) {
            // Income includes GST - calculate GST component
            const gstComponent = Math.abs(amount) * 0.09090909; // 1/11 of amount
            gstCollected += gstComponent;
          } else {
            gstFreeIncome += Math.abs(amount);
          }
        } else if (txn?.transaction_type === 'expense') {
          if (isGSTApplicable) {
            // Expense includes GST - calculate GST component
            const gstComponent = Math.abs(amount) * 0.09090909; // 1/11 of amount
            gstPaid += gstComponent;
          } else {
            gstFreeExpenses += Math.abs(amount);
          }
        }
      });

      const gstOwed = gstCollected - gstPaid; // Net GST liability

      // Get previous GST payments in the period
      const { data: gstPayments, error: paymentError } = await supabase?.from('tax_filings')?.select('amount_paid')?.eq('tax_type', 'GST')?.gte('created_at', dateFrom)?.lte('created_at', dateTo);

      if (paymentError) {
        return { success: false, error: paymentError?.message };
      }

      const gstPaidToDate = gstPayments?.reduce((sum, payment) => sum + parseFloat(payment?.amount_paid || 0), 0);

      return {
        success: true,
        gstData: {
          gstCollected: Math.round(gstCollected * 100) / 100,
          gstPaid: Math.round(gstPaid * 100) / 100,
          gstOwed: Math.round(gstOwed * 100) / 100,
          gstPaidToDate: Math.round(gstPaidToDate * 100) / 100,
          netGstPosition: Math.round((gstOwed - gstPaidToDate) * 100) / 100,
          gstFreeIncome: Math.round(gstFreeIncome * 100) / 100,
          gstFreeExpenses: Math.round(gstFreeExpenses * 100) / 100,
          period: { from: dateFrom, to: dateTo },
          calculatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to calculate GST.' 
        };
      }
      
      console.error('Tax service error:', error);
      return { success: false, error: 'Failed to calculate GST.' };
    }
  },

  // Calculate company income tax
  async calculateCompanyIncomeTax(financialYearStart, financialYearEnd) {
    try {
      // Get profit/loss for the financial year
      const { data: transactions, error } = await supabase?.from('transactions')?.select(`
        amount,
        transaction_type,
        account:accounts(account_name, account_type)
      `)?.eq('status', 'completed')?.gte('transaction_date', financialYearStart)?.lte('transaction_date', financialYearEnd);

      if (error) {
        return { success: false, error: error?.message };
      }

      // Calculate taxable income
      let totalIncome = 0;
      let totalExpenses = 0;
      let nonDeductibleExpenses = 0;

      transactions?.forEach(txn => {
        const amount = Math.abs(parseFloat(txn?.amount));

        if (txn?.transaction_type === 'income') {
          totalIncome += amount;
        } else if (txn?.transaction_type === 'expense') {
          if (this?.isDeductibleExpense(txn?.account?.account_name)) {
            totalExpenses += amount;
          } else {
            nonDeductibleExpenses += amount;
          }
        }
      });

      const taxableIncome = Math.max(0, totalIncome - totalExpenses);
      
      // Australian company tax rates (as of 2024)
      let taxRate = 0.25; // 25% for most companies
      if (totalIncome <= 50000000) { // Small business entity threshold
        taxRate = 0.25; // 25% for small companies
      } else {
        taxRate = 0.30; // 30% for larger companies
      }

      const incomeTaxLiability = taxableIncome * taxRate;

      // Get tax payments made during the year
      const { data: taxPayments, error: paymentError } = await supabase?.from('tax_filings')?.select('amount_paid')?.eq('tax_type', 'Income Tax')?.gte('created_at', financialYearStart)?.lte('created_at', financialYearEnd);

      if (paymentError) {
        return { success: false, error: paymentError?.message };
      }

      const taxPaidToDate = taxPayments?.reduce((sum, payment) => sum + parseFloat(payment?.amount_paid || 0), 0);

      return {
        success: true,
        incomeTaxData: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          nonDeductibleExpenses: Math.round(nonDeductibleExpenses * 100) / 100,
          taxableIncome: Math.round(taxableIncome * 100) / 100,
          taxRate: taxRate * 100,
          incomeTaxLiability: Math.round(incomeTaxLiability * 100) / 100,
          taxPaidToDate: Math.round(taxPaidToDate * 100) / 100,
          netTaxPosition: Math.round((incomeTaxLiability - taxPaidToDate) * 100) / 100,
          financialYear: { start: financialYearStart, end: financialYearEnd }
        }
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to calculate income tax.' 
        };
      }
      
      console.error('Tax service error:', error);
      return { success: false, error: 'Failed to calculate company income tax.' };
    }
  },

  // Calculate superannuation liability
  async calculateSuperannuation(dateFrom, dateTo) {
    try {
      // Get payroll transactions (salary, wages) - 12% super guarantee rate
      const { data: payrollTxns, error } = await supabase?.from('transactions')?.select(`
        amount,
        description,
        transaction_date,
        account:accounts(account_name)
      `)?.eq('transaction_type', 'expense')?.eq('status', 'completed')?.or('description.ilike.%salary%,description.ilike.%wage%,description.ilike.%payroll%')?.gte('transaction_date', dateFrom)?.lte('transaction_date', dateTo);

      if (error) {
        return { success: false, error: error?.message };
      }

      const superGuaranteeRate = 0.12; // 12% as of 2024
      let totalWages = 0;
      let superLiability = 0;

      payrollTxns?.forEach(txn => {
        const amount = Math.abs(parseFloat(txn?.amount));
        if (this?.isWagesForSuper(txn?.description, txn?.account?.account_name)) {
          totalWages += amount;
          superLiability += amount * superGuaranteeRate;
        }
      });

      // Get super contributions paid
      const { data: superPayments, error: superError } = await supabase?.from('transactions')?.select('amount')?.eq('transaction_type', 'expense')?.ilike('description', '%superannuation%')?.gte('transaction_date', dateFrom)?.lte('transaction_date', dateTo)?.eq('status', 'completed');

      if (superError) {
        return { success: false, error: superError?.message };
      }

      const superPaid = superPayments?.reduce((sum, payment) => sum + Math.abs(parseFloat(payment?.amount)), 0);

      return {
        success: true,
        superData: {
          totalWages: Math.round(totalWages * 100) / 100,
          superGuaranteeRate: superGuaranteeRate * 100,
          superLiability: Math.round(superLiability * 100) / 100,
          superPaid: Math.round(superPaid * 100) / 100,
          netSuperPosition: Math.round((superLiability - superPaid) * 100) / 100,
          period: { from: dateFrom, to: dateTo }
        }
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to calculate superannuation.' 
        };
      }
      
      console.error('Tax service error:', error);
      return { success: false, error: 'Failed to calculate superannuation.' };
    }
  },

  // Generate BAS calculation
  async generateBAS(quarter, year) {
    try {
      const quarterDates = this?.getQuarterDates(quarter, year);
      
      // Get GST calculation for the quarter
      const gstResult = await this?.calculateGST(quarterDates?.start, quarterDates?.end);
      if (!gstResult?.success) {
        return gstResult;
      }

      // Get PAYG withholding (if applicable)
      const { data: paygTxns, error: paygError } = await supabase?.from('transactions')?.select('amount')?.eq('transaction_type', 'expense')?.or('description.ilike.%payg%,description.ilike.%withholding%')?.gte('transaction_date', quarterDates?.start)?.lte('transaction_date', quarterDates?.end)?.eq('status', 'completed');

      if (paygError) {
        return { success: false, error: paygError?.message };
      }

      const paygWithholding = paygTxns?.reduce((sum, txn) => sum + Math.abs(parseFloat(txn?.amount)), 0);

      const basData = {
        quarter,
        year,
        period: quarterDates,
        gst: gstResult?.gstData,
        paygWithholding: Math.round(paygWithholding * 100) / 100,
        totalLiability: Math.round((gstResult?.gstData?.netGstPosition + paygWithholding) * 100) / 100,
        dueDate: this?.calculateBASDueDate(quarter, year),
        generatedAt: new Date()?.toISOString()
      };

      return { success: true, basData };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to generate BAS calculation.' 
        };
      }
      
      console.error('Tax service error:', error);
      return { success: false, error: 'Failed to generate BAS calculation.' };
    }
  },

  // Helper functions
  isGSTApplicable(accountName, description) {
    // GST applies to most business transactions except some specific categories
    const gstFreeAccounts = ['bank', 'wages', 'salary', 'dividend', 'interest'];
    const accountLower = (accountName || '')?.toLowerCase();
    const descLower = (description || '')?.toLowerCase();
    
    return !gstFreeAccounts?.some(exempt => 
      accountLower?.includes(exempt) || descLower?.includes(exempt)
    );
  },

  isDeductibleExpense(accountName) {
    // Most business expenses are deductible
    const nonDeductibleAccounts = ['dividend', 'capital', 'personal', 'private'];
    const accountLower = (accountName || '')?.toLowerCase();
    
    return !nonDeductibleAccounts?.some(nonDed => accountLower?.includes(nonDed));
  },

  isWagesForSuper(description, accountName) {
    const wageKeywords = ['salary', 'wage', 'payroll', 'employee'];
    const text = `${description} ${accountName}`?.toLowerCase();
    
    return wageKeywords?.some(keyword => text?.includes(keyword));
  },

  getQuarterDates(quarter, year) {
    const quarters = {
      1: { start: `${year}-07-01`, end: `${year}-09-30` },
      2: { start: `${year}-10-01`, end: `${year}-12-31` },
      3: { start: `${year + 1}-01-01`, end: `${year + 1}-03-31` },
      4: { start: `${year + 1}-04-01`, end: `${year + 1}-06-30` }
    };
    
    return quarters?.[quarter] || quarters?.[1];
  },

  calculateBASDueDate(quarter, year) {
    // BAS due dates in Australia
    const dueDates = {
      1: `${year}-10-28`,
      2: `${year + 1}-01-28`,
      3: `${year + 1}-04-28`,
      4: `${year + 1}-07-28`
    };
    
    return dueDates?.[quarter];
  }
};