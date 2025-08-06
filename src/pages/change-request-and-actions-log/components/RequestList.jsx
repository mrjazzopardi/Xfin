import React from 'react';
import { format } from 'date-fns';

export function RequestList({ 
  requests, 
  selectedRequest, 
  onSelectRequest, 
  onStatusUpdate, 
  onGenerateLink,
  userProfile 
}) {
  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-orange-100 text-orange-800'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors?.[priority] || 'text-gray-600';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const canUpdateStatus = (request) => {
    return userProfile?.role === 'partner' || 
           userProfile?.role === 'staff' || 
           request?.assigned_user?.id === userProfile?.id;
  };

  if (!requests?.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Change Requests Found</h3>
        <p className="text-gray-600">No requests match your current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Change Requests ({requests?.length || 0})
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {requests?.map((request) => (
          <div
            key={request?.id}
            className={`p-6 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedRequest?.id === request?.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
            onClick={() => onSelectRequest?.(request?.id)}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getPriorityIcon(request?.priority)}
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {request?.title || 'Untitled Request'}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {request?.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request?.status)}`}>
                  {request?.status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
                </span>
                
                {/* Priority Badge */}
                <span className={`text-xs font-medium ${getPriorityColor(request?.priority)}`}>
                  {request?.priority?.toUpperCase() || 'MEDIUM'}
                </span>
              </div>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                {/* Category */}
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>{request?.category?.replace('_', ' ') || 'general'}</span>
                </span>

                {/* Created By */}
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{request?.user?.full_name || 'Unknown User'}</span>
                </span>

                {/* Assigned To */}
                {request?.assigned_user && (
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Assigned to {request?.assigned_user?.full_name}</span>
                  </span>
                )}
              </div>

              {/* Created Date */}
              <span className="text-xs">
                Created {formatDate(request?.created_at)}
              </span>
            </div>

            {/* Actions Row - Only show for selected request */}
            {selectedRequest?.id === request?.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {/* Quick Status Updates */}
                  {canUpdateStatus(request) && request?.status !== 'completed' && (
                    <>
                      {request?.status === 'submitted' && (
                        <button
                          onClick={(e) => {
                            e?.stopPropagation();
                            onStatusUpdate?.(request?.id, 'in_progress');
                          }}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium hover:bg-yellow-200 transition-colors"
                        >
                          Start Progress
                        </button>
                      )}
                      
                      {request?.status === 'in_progress' && (
                        <button
                          onClick={(e) => {
                            e?.stopPropagation();
                            onStatusUpdate?.(request?.id, 'completed');
                          }}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </>
                  )}

                  {/* Share Link */}
                  <button
                    onClick={(e) => {
                      e?.stopPropagation();
                      onGenerateLink?.(request?.id);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>

                  {/* Last Updated */}
                  <span className="text-xs text-gray-400 ml-auto">
                    Updated {formatDateTime(request?.updated_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}