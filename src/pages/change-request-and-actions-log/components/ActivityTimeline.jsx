import React, { useMemo } from 'react';
import { format } from 'date-fns';

export function ActivityTimeline({ activityLogs, selectedRequestId }) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'change_request_created':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'change_request_status_updated':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'change_request_implementation':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'change_request_created':
        return 'text-blue-600';
      case 'change_request_status_updated':
        return 'text-yellow-600';
      case 'change_request_implementation':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionTitle = (action) => {
    switch (action) {
      case 'change_request_created':
        return 'Request Created';
      case 'change_request_status_updated':
        return 'Status Updated';
      case 'change_request_implementation':
        return 'Implementation Added';
      default:
        return 'Activity';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateString);
    } catch {
      return 'Invalid date';
    }
  };

  // Filter logs for selected request if specified
  const filteredLogs = selectedRequestId 
    ? activityLogs?.filter(log => log?.entity_id === selectedRequestId) || []
    : activityLogs || [];

  // Group logs by date for better organization
  const groupedLogs = React.useMemo(() => {
    const groups = {};
    filteredLogs?.forEach(log => {
      try {
        const date = format(new Date(log?.created_at), 'yyyy-MM-dd');
        if (!groups?.[date]) {
          groups[date] = [];
        }
        groups?.[date]?.push(log);
      } catch {
        // Skip invalid dates
      }
    });
    
    // Sort groups by date (newest first)
    return Object.keys(groups)?.sort((a, b) => new Date(b) - new Date(a))?.reduce((acc, date) => {
        acc[date] = groups?.[date]?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return acc;
      }, {});
  }, [filteredLogs]);

  if (!filteredLogs?.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">No Activity Yet</h4>
          <p className="text-sm text-gray-600">
            {selectedRequestId ? 'No activity found for this request' : 'No recent change request activity'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedRequestId ? 'Request Activity' : 'Recent Activity'}
        </h3>
        <span className="text-sm text-gray-500">
          {filteredLogs?.length} {filteredLogs?.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>
      <div className="space-y-6">
        {Object.entries(groupedLogs)?.map(([date, logs]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">
                  {format(new Date(date), 'MMMM dd, yyyy')}
                </span>
              </div>
            </div>

            {/* Activities for this date */}
            <div className="mt-4 space-y-4">
              {logs?.map((log, index) => (
                <div key={log?.id} className="relative flex items-start space-x-3">
                  {/* Timeline line */}
                  {index < logs?.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  {/* Icon */}
                  <div className="relative">
                    {getActionIcon(log?.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          <span className={getActionColor(log?.action)}>
                            {getActionTitle(log?.action)}
                          </span>
                          {log?.details?.title && (
                            <span className="text-gray-600"> - {log?.details?.title}</span>
                          )}
                        </p>
                        
                        {/* Additional details based on action type */}
                        {log?.action === 'change_request_status_updated' && (
                          <p className="text-sm text-gray-600 mt-1">
                            Status changed from{' '}
                            <span className="font-medium">
                              {log?.details?.old_status?.replace('_', ' ')}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                              {log?.details?.new_status?.replace('_', ' ')}
                            </span>
                          </p>
                        )}

                        {log?.action === 'change_request_implementation' && log?.details?.implementation_description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {log?.details?.implementation_description}
                          </p>
                        )}

                        {log?.details?.files_affected?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Files affected:</p>
                            <div className="flex flex-wrap gap-1">
                              {log?.details?.files_affected?.slice(0, 3)?.map((file, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-block px-2 py-1 bg-gray-100 text-xs rounded"
                                >
                                  {file}
                                </span>
                              ))}
                              {log?.details?.files_affected?.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{log?.details?.files_affected?.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">
                            by {log?.user?.full_name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(log?.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}