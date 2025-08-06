import React, { useState, useMemo } from 'react';

export function RequestFilters({ filters, onFilterChange, requests }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'bug_fix', label: 'Bug Fix' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'ui_enhancement', label: 'UI Enhancement' },
    { value: 'performance', label: 'Performance' },
    { value: 'security', label: 'Security' },
    { value: 'integration', label: 'Integration' },
    { value: 'documentation', label: 'Documentation' }
  ];

  // Get unique assigned users for filter dropdown
  const assignedUsers = React.useMemo(() => {
    const users = requests?.reduce((acc, request) => {
      if (request?.assigned_user && !acc?.find(u => u?.id === request?.assigned_user?.id)) {
        acc?.push(request?.assigned_user);
      }
      return acc;
    }, []) || [];
    
    return [
      { id: '', full_name: 'All Assignees' },
      ...users
    ];
  }, [requests]);

  const handleFilterChange = (field, value) => {
    onFilterChange?.({
      [field]: value
    });
  };

  const handleDateRangeChange = (field, value) => {
    onFilterChange?.({
      dateRange: {
        ...filters?.dateRange,
        [field]: value
      }
    });
  };

  const clearAllFilters = () => {
    onFilterChange?.({
      status: '',
      priority: '',
      category: '',
      assignedTo: '',
      dateRange: { from: '', to: '' }
    });
  };

  const hasActiveFilters = React.useMemo(() => {
    return !!(
      filters?.status || 
      filters?.priority || 
      filters?.category || 
      filters?.assignedTo || 
      filters?.dateRange?.from || 
      filters?.dateRange?.to
    );
  }, [filters]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Requests</h3>
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>{showAdvanced ? 'Simple' : 'Advanced'}</span>
            <svg 
              className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters?.status || ''}
            onChange={(e) => handleFilterChange('status', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions?.map(option => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={filters?.priority || ''}
            onChange={(e) => handleFilterChange('priority', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {priorityOptions?.map(option => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters?.category || ''}
            onChange={(e) => handleFilterChange('category', e?.target?.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions?.map(option => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assigned To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={filters?.assignedTo || ''}
                onChange={(e) => handleFilterChange('assignedTo', e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {assignedUsers?.map(user => (
                  <option key={user?.id || 'all'} value={user?.id || ''}>
                    {user?.full_name || 'Unknown User'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters?.dateRange?.from || ''}
                onChange={(e) => handleDateRangeChange('from', e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters?.dateRange?.to || ''}
                onChange={(e) => handleDateRangeChange('to', e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters?.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {statusOptions?.find(opt => opt?.value === filters?.status)?.label}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters?.priority && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Priority: {priorityOptions?.find(opt => opt?.value === filters?.priority)?.label}
                <button
                  onClick={() => handleFilterChange('priority', '')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters?.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Category: {categoryOptions?.find(opt => opt?.value === filters?.category)?.label}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters?.assignedTo && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Assigned: {assignedUsers?.find(user => user?.id === filters?.assignedTo)?.full_name}
                <button
                  onClick={() => handleFilterChange('assignedTo', '')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}