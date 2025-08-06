import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

const AddTransactionModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date()?.toISOString()?.split('T')?.[0],
    description: '',
    account: '', // Primary account - simplified from debit/credit
    amount: '',
    reference: '',
    category: '',
    type: 'expense',
    attachments: []
  });

  const [errors, setErrors] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load accounts from database
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        const { accountService } = await import('../../../services/accountService');
        const result = await accountService?.getAccountsForDropdown();
        
        if (result?.success) {
          setAccounts(result?.accounts || []);
        } else {
          console.error('Failed to load accounts:', result?.error);
          // Fallback to previous hardcoded accounts if service fails
          setAccounts([
            { code: '1', name: 'FFLDS', type: 'asset', label: '1 - FFLDS' },
            { code: '200', name: 'Sales', type: 'revenue', label: '200 - Sales' },
            { code: '400', name: 'Advertising', type: 'expense', label: '400 - Advertising' },
            { code: '404', name: 'Bank Fees', type: 'expense', label: '404 - Bank Fees' },
            { code: '610', name: 'Accounts Receivable', type: 'current_asset', label: '610 - Accounts Receivable' },
            { code: '800', name: 'Accounts Payable', type: 'current_liability', label: '800 - Accounts Payable' }
          ]);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const categories = [
    'Operating Expenses',
    'Financial Expenses', 
    'Capital Expenditure',
    'Revenue',
    'Cost of Goods Sold',
    'Administrative Expenses',
    'Direct Costs',
    'GST Related',
    'Payroll Related',
    'Asset Related'
  ];

  // Auto-determine double-entry accounts based on transaction type and selected account
  const getDoubleEntryAccounts = (transactionType, selectedAccount) => {
    const account = accounts?.find(acc => acc?.value === selectedAccount || acc?.name === selectedAccount);
    
    // Default cash/bank account for double-entry completion
    const defaultCashAccount = accounts?.find(acc => 
      acc?.type === 'asset' || acc?.name?.toLowerCase()?.includes('cash') || acc?.name?.toLowerCase()?.includes('bank')
    ) || accounts?.[0];

    switch (transactionType) {
      case 'expense':
        // Debit expense account, Credit cash/bank account
        return {
          debitAccount: selectedAccount,
          creditAccount: defaultCashAccount?.value || defaultCashAccount?.name
        };
      case 'income':
        // Debit cash/bank account, Credit revenue account
        return {
          debitAccount: defaultCashAccount?.value || defaultCashAccount?.name,
          creditAccount: selectedAccount
        };
      case 'transfer': // For transfers, we'll handle this differently - user selects "from" account
        return {
          debitAccount: selectedAccount, // "To" account creditAccount: defaultCashAccount?.value || defaultCashAccount?.name //"From" account
        };
      default:
        return {
          debitAccount: selectedAccount,
          creditAccount: defaultCashAccount?.value || defaultCashAccount?.name
        };
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors?.[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData?.account) {
      newErrors.account = 'Account is required';
    }
    if (!formData?.amount || parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      // Auto-generate double-entry accounts
      const doubleEntryAccounts = getDoubleEntryAccounts(formData?.type, formData?.account);
      
      const transactionData = {
        ...formData,
        ...doubleEntryAccounts, // Include auto-generated debit/credit accounts
        amount: parseFloat(formData?.amount),
        id: `TXN-${Date.now()}`,
        status: 'pending'
      };
      onSubmit(transactionData);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e?.target?.files);
    setFormData({ ...formData, attachments: [...formData?.attachments, ...files] });
  };

  const removeAttachment = (index) => {
    const newAttachments = formData?.attachments?.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments });
  };

  // Get account label based on transaction type
  const getAccountLabel = () => {
    switch (formData?.type) {
      case 'expense':
        return 'Expense Account *';
      case 'income':
        return 'Revenue Account *';
      case 'transfer':
        return 'Transfer To Account *';
      default:
        return 'Account *';
    }
  };

  // Get account placeholder based on transaction type
  const getAccountPlaceholder = () => {
    switch (formData?.type) {
      case 'expense':
        return 'Select expense account';
      case 'income':
        return 'Select revenue account';
      case 'transfer':
        return 'Select destination account';
      default:
        return 'Select account';
    }
  };

  // Filter accounts based on transaction type for better UX
  const getFilteredAccounts = () => {
    if (formData?.type === 'expense') {
      return accounts?.filter(acc => acc?.type === 'expense' || acc?.name?.toLowerCase()?.includes('expense'));
    }
    if (formData?.type === 'income') {
      return accounts?.filter(acc => acc?.type === 'revenue' || acc?.name?.toLowerCase()?.includes('sales') || acc?.name?.toLowerCase()?.includes('revenue'));
    }
    return accounts; // For transfers and other types, show all accounts
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
        <div className="bg-surface rounded-lg shadow-floating p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-text-primary">Loading chart of accounts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-surface rounded-lg shadow-floating w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Add New Transaction
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-primary-100 nav-transition"
            >
              <Icon name="X" size={20} color="#7f8c8d" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData?.date}
                onChange={(e) => handleInputChange('date', e?.target?.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Transaction Type
              </label>
              <select
                value={formData?.type}
                onChange={(e) => handleInputChange('type', e?.target?.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
              <p className="mt-1 text-xs text-text-secondary">
                {formData?.type === 'expense' && 'Money going out of your business'}
                {formData?.type === 'income' && 'Money coming into your business'}
                {formData?.type === 'transfer' && 'Moving money between accounts'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData?.description}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
              placeholder="Enter transaction description"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent ${
                errors?.description ? 'border-error' : 'border-border'
              }`}
            />
            {errors?.description && (
              <p className="mt-1 text-sm text-error">{errors?.description}</p>
            )}
          </div>

          {/* Simplified Account Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {getAccountLabel()}
            </label>
            <select
              value={formData?.account}
              onChange={(e) => handleInputChange('account', e?.target?.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent ${
                errors?.account ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">{getAccountPlaceholder()}</option>
              {getFilteredAccounts()?.map((account, index) => (
                <option key={account?.code || index} value={account?.value || account?.name}>
                  {account?.label || `${account?.code} - ${account?.name}`}
                </option>
              ))}
            </select>
            {errors?.account && (
              <p className="mt-1 text-sm text-error">{errors?.account}</p>
            )}
            <p className="mt-1 text-xs text-text-secondary">
              Double-entry bookkeeping will be handled automatically based on your transaction type
            </p>
          </div>

          {/* Amount and Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData?.amount}
                  onChange={(e) => handleInputChange('amount', e?.target?.value)}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent ${
                    errors?.amount ? 'border-error' : 'border-border'
                  }`}
                />
              </div>
              {errors?.amount && (
                <p className="mt-1 text-sm text-error">{errors?.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reference
              </label>
              <input
                type="text"
                value={formData?.reference}
                onChange={(e) => handleInputChange('reference', e?.target?.value)}
                placeholder="Invoice number, receipt number, etc."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Category
            </label>
            <select
              value={formData?.category}
              onChange={(e) => handleInputChange('category', e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Icon name="Upload" size={24} color="#7f8c8d" />
                <span className="text-sm text-text-secondary">
                  Click to upload files or drag and drop
                </span>
                <span className="text-xs text-text-secondary">
                  PDF, JPG, PNG, DOC up to 10MB each
                </span>
              </label>
            </div>

            {/* Attachment List */}
            {formData?.attachments?.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData?.attachments?.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                    <div className="flex items-center space-x-2">
                      <Icon name="FileText" size={16} color="#7f8c8d" />
                      <span className="text-sm text-text-primary">{file?.name}</span>
                      <span className="text-xs text-text-secondary">
                        ({(file?.size / 1024 / 1024)?.toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 rounded hover:bg-error-100 nav-transition"
                    >
                      <Icon name="X" size={14} color="#e74c3c" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background nav-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition flex items-center justify-center space-x-2"
            >
              <Icon name="Plus" size={16} color="white" />
              <span>Add Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;