import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

const ReportFilters = ({ filters, onChange }) => {
  const [accountOptions, setAccountOptions] = useState([]);

  // Load accounts for filtering
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { accountService } = await import('../../../services/accountService');
        const result = await accountService?.getAccounts();
        if (result?.success) {
          // Group accounts by type for better organization
          const groupedAccounts = result?.accounts?.reduce((groups, account) => {
            const type = account?.account_type;
            if (!groups?.[type]) {
              groups[type] = [];
            }
            groups?.[type]?.push(account);
            return groups;
          }, {});
          
          setAccountOptions(groupedAccounts);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };

    loadAccounts();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Auto-adjust dates based on date range selection
    if (key === 'dateRange') {
      const today = new Date();
      let startDate, endDate;
      
      switch (value) {
        case 'current-month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'last-month':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case 'current-quarter':
          const quarterStart = Math.floor(today?.getMonth() / 3) * 3;
          startDate = new Date(today.getFullYear(), quarterStart, 1);
          endDate = new Date(today.getFullYear(), quarterStart + 3, 0);
          break;
        case 'current-year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
          break;
        case 'last-year':
          startDate = new Date(today.getFullYear() - 1, 0, 1);
          endDate = new Date(today.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = new Date(filters.startDate);
          endDate = new Date(filters.endDate);
      }
      
      newFilters.startDate = startDate?.toISOString()?.split('T')?.[0];
      newFilters.endDate = endDate?.toISOString()?.split('T')?.[0];
    }
    
    onChange(newFilters);
  };

  const dateRangeOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'current-quarter', label: 'Current Quarter' },
    { value: 'current-year', label: 'Current Year' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const comparisonOptions = [
    { value: 'none', label: 'No Comparison' },
    { value: 'previous-period', label: 'Previous Period' },
    { value: 'previous-year', label: 'Previous Year' },
    { value: 'budget', label: 'Budget' }
  ];

  const accountFilterOptions = [
    { value: 'all', label: 'All Accounts' },
    { value: 'revenue', label: 'Revenue Accounts' },
    { value: 'expense', label: 'Expense Accounts' },
    { value: 'asset', label: 'Asset Accounts (All)' },
    { value: 'current_asset', label: 'Current Assets' },
    { value: 'fixed_asset', label: 'Fixed Assets' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'liability', label: 'Liability Accounts (All)' },
    { value: 'current_liability', label: 'Current Liabilities' },
    { value: 'non_current_liability', label: 'Non-Current Liabilities' },
    { value: 'equity', label: 'Equity Accounts' },
    { value: 'direct_costs', label: 'Direct Costs' }
  ];

  const formatOptions = [
    { value: 'summary', label: 'Summary' },
    { value: 'detailed', label: 'Detailed' }
  ];

  const taxFilterOptions = [
    { value: 'all', label: 'All Tax Treatments' },
    { value: 'GST on Income', label: 'GST on Income' },
    { value: 'GST on Expenses', label: 'GST on Expenses' },
    { value: 'GST Free Income', label: 'GST Free Income' },
    { value: 'GST Free Expenses', label: 'GST Free Expenses' },
    { value: 'BAS Excluded', label: 'BAS Excluded' }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Filter" size={18} color="var(--color-primary)" />
        <h3 className="font-heading font-semibold text-text-primary">Report Parameters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Date Range */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-1">
            Date Range
          </label>
          <select
            value={filters?.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e?.target?.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {dateRangeOptions?.map((option) => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Inputs */}
        {filters?.dateRange === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters?.startDate}
                onChange={(e) => handleFilterChange('startDate', e?.target?.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters?.endDate}
                onChange={(e) => handleFilterChange('endDate', e?.target?.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
              />
            </div>
          </>
        )}

        {/* Comparison Period */}
        <div className={filters?.dateRange === 'custom' ? 'lg:col-span-2' : ''}>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Comparison
          </label>
          <select
            value={filters?.comparisonPeriod}
            onChange={(e) => handleFilterChange('comparisonPeriod', e?.target?.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {comparisonOptions?.map((option) => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Accounts
          </label>
          <select
            value={filters?.accountFilter}
            onChange={(e) => handleFilterChange('accountFilter', e?.target?.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {accountFilterOptions?.map((option) => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tax Treatment Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Tax Treatment
          </label>
          <select
            value={filters?.taxFilter || 'all'}
            onChange={(e) => handleFilterChange('taxFilter', e?.target?.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {taxFilterOptions?.map((option) => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Format
          </label>
          <select
            value={filters?.format}
            onChange={(e) => handleFilterChange('format', e?.target?.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            {formatOptions?.map((option) => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onChange({
              dateRange: 'current-month',
              startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)?.toISOString()?.split('T')?.[0],
              endDate: new Date()?.toISOString()?.split('T')?.[0],
              comparisonPeriod: 'previous-period',
              accountFilter: 'all',
              taxFilter: 'all',
              format: 'summary'
            })}
            className="text-sm text-secondary hover:text-secondary-700 nav-transition font-medium"
          >
            Reset to Defaults
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-text-secondary">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={14} color="var(--color-text-secondary)" />
            <span>
              {new Date(filters.startDate)?.toLocaleDateString()} - {new Date(filters.endDate)?.toLocaleDateString()}
            </span>
          </div>
          {Object?.keys(accountOptions)?.length > 0 && (
            <div className="flex items-center space-x-1">
              <Icon name="FileText" size={14} color="var(--color-text-secondary)" />
              <span>{Object?.values(accountOptions)?.flat()?.length} accounts loaded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;