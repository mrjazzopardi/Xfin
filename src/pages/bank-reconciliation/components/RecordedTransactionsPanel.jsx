import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

const RecordedTransactionsPanel = ({ 
  transactions, 
  selectedTransactions, 
  onTransactionSelect 
}) => {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterAccount, setFilterAccount] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accountsMap, setAccountsMap] = useState({});

  // Load accounts for better display
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { accountService } = await import('../../../services/accountService');
        const result = await accountService?.getAccounts();
        if (result?.success) {
          const accountMap = {};
          result?.accounts?.forEach(account => {
            accountMap[account?.account_code] = {
              name: account?.account_name,
              type: account?.account_type,
              description: account?.description,
              taxTreatment: account?.tax_treatment
            };
          });
          setAccountsMap(accountMap);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };

    loadAccounts();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get unique accounts for filter
  const accounts = [...new Set(transactions.map(t => t.account))];

  const filteredAndSortedTransactions = transactions?.filter(transaction => {
      const matchesSearch = transaction?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                           transaction?.reference?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                           transaction?.account?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesAccount = filterAccount === 'all' || transaction?.account === filterAccount;
      return matchesSearch && matchesAccount && !transaction?.matched;
    })?.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];
      
      if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    return amount >= 0 ? `+$${absAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                       : `-$${absAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getAccountColor = (account) => {
    // Enhanced account colors based on Australian chart of accounts
    const accountInfo = accountsMap?.[account] || {};
    const accountType = accountInfo?.type || '';
    
    const typeColors = {
      'revenue': 'bg-green-100 text-green-700',
      'expense': 'bg-red-100 text-red-700',
      'current_asset': 'bg-blue-100 text-blue-700',
      'fixed_asset': 'bg-indigo-100 text-indigo-700',
      'asset': 'bg-blue-100 text-blue-700',
      'current_liability': 'bg-orange-100 text-orange-700',
      'non_current_liability': 'bg-orange-200 text-orange-800',
      'liability': 'bg-orange-100 text-orange-700',
      'equity': 'bg-purple-100 text-purple-700',
      'direct_costs': 'bg-amber-100 text-amber-700',
      'inventory': 'bg-teal-100 text-teal-700'
    };
    
    return typeColors?.[accountType] || 'bg-gray-100 text-gray-700';
  };

  const getAccountDisplayName = (accountCode) => {
    const accountInfo = accountsMap?.[accountCode];
    if (accountInfo) {
      return `${accountCode} - ${accountInfo?.name}`;
    }
    return accountCode;
  };

  return (
    <div className="bg-surface rounded-lg border border-border h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="FileText" size={20} color="var(--color-accent)" />
            <span>Recorded Transactions</span>
          </h3>
          <span className="text-sm text-text-secondary bg-accent-100 px-2 py-1 rounded-full">
            {filteredAndSortedTransactions?.length} unmatched
          </span>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Icon name="Search" size={16} color="#7f8c8d" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e?.target?.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="all">All Accounts</option>
              {accounts?.map(account => (
                <option key={account} value={account}>
                  {getAccountDisplayName(account)}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleSort('date')}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-background nav-transition flex items-center space-x-1"
            >
              <span>Date</span>
              <Icon 
                name={sortBy === 'date' && sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                size={14} 
                color="#7f8c8d" 
              />
            </button>
          </div>
        </div>
      </div>
      {/* Transactions List */}
      <div className="overflow-y-auto max-h-96">
        {filteredAndSortedTransactions?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="CheckCircle" size={48} color="#27ae60" className="mx-auto mb-4" />
            <p className="text-text-secondary">All transactions have been reconciled</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredAndSortedTransactions?.map((transaction) => (
              <div
                key={transaction?.id}
                className={`p-3 rounded-lg border cursor-pointer nav-transition ${
                  selectedTransactions?.includes(transaction?.id)
                    ? 'border-accent bg-accent-100' :'border-border hover:border-accent-200 hover:bg-background'
                }`}
                onClick={() => onTransactionSelect(transaction?.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedTransactions?.includes(transaction?.id)}
                        onChange={() => onTransactionSelect(transaction?.id)}
                        className="rounded border-border focus:ring-border-focus"
                        onClick={(e) => e?.stopPropagation()}
                      />
                      <span className="text-xs text-text-secondary">
                        {new Date(transaction.date)?.toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getAccountColor(transaction?.account)}`}>
                        {getAccountDisplayName(transaction?.account)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-text-primary truncate mb-1">
                      {transaction?.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">
                        Ref: {transaction?.reference}
                      </span>
                      <span className={`text-sm font-medium ${
                        transaction?.amount >= 0 ? 'text-success' : 'text-error'
                      }`}>
                        {formatAmount(transaction?.amount)}
                      </span>
                    </div>

                    {/* Tax Treatment Badge */}
                    {accountsMap?.[transaction?.account]?.taxTreatment && (
                      <div className="mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {accountsMap?.[transaction?.account]?.taxTreatment}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordedTransactionsPanel;