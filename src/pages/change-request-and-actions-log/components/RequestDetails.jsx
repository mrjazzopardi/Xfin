import React, { useState } from 'react';
import { format } from 'date-fns';

export function RequestDetails({ 
  request, 
  onStatusUpdate, 
  onAddImplementation, 
  onGenerateLink, 
  userProfile 
}) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showImplementationModal, setShowImplementationModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: request?.status || 'submitted',
    details: ''
  });
  const [implementationData, setImplementationData] = useState({
    description: '',
    implementationDetails: '',
    filesAffected: '',
    codeSummary: ''
  });

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      on_hold: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const canUpdateStatus = () => {
    return userProfile?.role === 'partner' || 
           userProfile?.role === 'staff' || 
           request?.assigned_user?.id === userProfile?.id;
  };

  const handleStatusSubmit = async () => {
    if (!statusUpdate?.status) return;
    
    await onStatusUpdate?.(request?.id, statusUpdate?.status, statusUpdate?.details);
    setShowStatusModal(false);
    setStatusUpdate({ status: request?.status || 'submitted', details: '' });
  };

  const handleImplementationSubmit = async () => {
    if (!implementationData?.description?.trim()) return;

    const filesArray = implementationData?.filesAffected
      ?.split('\n')
      ?.map(file => file?.trim())
      ?.filter(file => file?.length > 0) || [];

    await onAddImplementation?.(request?.id, implementationData?.description, {
      implementationDetails: implementationData?.implementationDetails,
      filesAffected: filesArray,
      codeSummary: implementationData?.codeSummary
    });

    setShowImplementationModal(false);
    setImplementationData({
      description: '',
      implementationDetails: '',
      filesAffected: '',
      codeSummary: ''
    });
  };

  if (!request) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-500">Select a request to view details</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {request?.title || 'Untitled Request'}
              </h2>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request?.status)}`}>
                  {request?.status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
                </span>
                <span className={`text-sm font-medium ${getPriorityColor(request?.priority)}`}>
                  {request?.priority?.toUpperCase() || 'MEDIUM'} Priority
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onGenerateLink?.(request?.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Generate shareable link"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {canUpdateStatus() && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Update Status
              </button>
              <button
                onClick={() => setShowImplementationModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Add Implementation
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {request?.description || 'No description provided'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Request Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">
                    {request?.category?.replace('_', ' ')?.toUpperCase() || 'GENERAL'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Created By</dt>
                  <dd className="text-sm text-gray-900">
                    {request?.user?.full_name || 'Unknown User'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Created At</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(request?.created_at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Assignment & Progress</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Assigned To</dt>
                  <dd className="text-sm text-gray-900">
                    {request?.assigned_user?.full_name || 'Unassigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(request?.updated_at)}
                  </dd>
                </div>
                {request?.completed_at && (
                  <div>
                    <dt className="text-xs text-gray-500">Completed At</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(request?.completed_at)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Tags */}
          {request?.tags?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {request?.tags?.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions Timeline */}
          {request?.actions?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Actions</h3>
              <div className="space-y-3">
                {request?.actions?.slice(-3)?.map((action) => (
                  <div key={action?.id} className="border-l-2 border-blue-200 pl-4 pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {action?.action_description}
                        </p>
                        {action?.implementation_details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {action?.implementation_details}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          by {action?.user?.full_name} • {formatDate(action?.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {request?.actions?.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {request?.actions?.length - 3} more actions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Status
                  </label>
                  <select
                    value={statusUpdate?.status}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e?.target?.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Details (Optional)
                  </label>
                  <textarea
                    value={statusUpdate?.details}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, details: e?.target?.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what was implemented or the reason for status change..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Modal */}
      {showImplementationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Implementation Action</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Description *
                  </label>
                  <input
                    type="text"
                    value={implementationData?.description}
                    onChange={(e) => setImplementationData(prev => ({ ...prev, description: e?.target?.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of what was implemented..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Details
                  </label>
                  <textarea
                    value={implementationData?.implementationDetails}
                    onChange={(e) => setImplementationData(prev => ({ ...prev, implementationDetails: e?.target?.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detailed explanation of the implementation..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Files Affected (one per line)
                  </label>
                  <textarea
                    value={implementationData?.filesAffected}
                    onChange={(e) => setImplementationData(prev => ({ ...prev, filesAffected: e?.target?.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="src/components/Header.jsx&#10;src/styles/main.css&#10;src/utils/helpers.js"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code Changes Summary
                  </label>
                  <textarea
                    value={implementationData?.codeSummary}
                    onChange={(e) => setImplementationData(prev => ({ ...prev, codeSummary: e?.target?.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief summary of code changes made..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImplementationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImplementationSubmit}
                  disabled={!implementationData?.description?.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}