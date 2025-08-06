import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { changeRequestService } from '../../services/changeRequestService';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import { RequestSubmissionForm } from './components/RequestSubmissionForm';
import { RequestFilters } from './components/RequestFilters';
import { RequestList } from './components/RequestList';
import { RequestDetails } from './components/RequestDetails';
import { ActivityTimeline } from './components/ActivityTimeline';
import { ShareableLink } from './components/ShareableLink';
import { ExportPanel } from './components/ExportPanel';

export default function ChangeRequestAndActionsLog() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    dateRange: { from: '', to: '' }
  });
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showShareableLink, setShowShareableLink] = useState(false);
  const [shareableLinkData, setShareableLinkData] = useState(null);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadChangeRequests();
      loadActivityLogs();
    }
  }, [user, filters]);

  const loadChangeRequests = async () => {
    try {
      setLoading(true);
      const result = await changeRequestService?.getChangeRequests(filters);
      
      if (result?.success) {
        setRequests(result?.data || []);
      } else {
        setError(result?.error || 'Failed to load change requests');
      }
    } catch (err) {
      setError('Failed to load change requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const result = await changeRequestService?.getActivityLogs();
      
      if (result?.success) {
        setActivityLogs(result?.data || []);
      }
    } catch (err) {
      console.error('Error loading activity logs:', err);
    }
  };

  const handleCreateRequest = async (requestData) => {
    try {
      const result = await changeRequestService?.createChangeRequest(requestData);
      
      if (result?.success) {
        setShowSubmissionForm(false);
        await loadChangeRequests();
        await loadActivityLogs();
        
        // Show success message (you can replace with toast notification)
        setError(null);
      } else {
        setError(result?.error || 'Failed to create change request');
      }
    } catch (err) {
      setError('Failed to create change request');
      console.error('Error creating request:', err);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, implementationDetails) => {
    try {
      const result = await changeRequestService?.updateStatus(requestId, newStatus, implementationDetails);
      
      if (result?.success) {
        await loadChangeRequests();
        await loadActivityLogs();
        
        // Refresh selected request details if it's the one being updated
        if (selectedRequest?.id === requestId) {
          handleSelectRequest(requestId);
        }
      } else {
        setError(result?.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  const handleAddImplementation = async (requestId, description, details) => {
    try {
      const result = await changeRequestService?.addImplementationAction(requestId, description, details);
      
      if (result?.success) {
        await loadActivityLogs();
        
        // Refresh selected request details
        if (selectedRequest?.id === requestId) {
          handleSelectRequest(requestId);
        }
      } else {
        setError(result?.error || 'Failed to add implementation action');
      }
    } catch (err) {
      setError('Failed to add implementation action');
      console.error('Error adding implementation:', err);
    }
  };

  const handleSelectRequest = async (requestId) => {
    try {
      const result = await changeRequestService?.getChangeRequestDetails(requestId);
      
      if (result?.success) {
        setSelectedRequest(result?.data);
      } else {
        setError(result?.error || 'Failed to load request details');
      }
    } catch (err) {
      setError('Failed to load request details');
      console.error('Error loading request details:', err);
    }
  };

  const handleGenerateShareableLink = async (requestId) => {
    try {
      const result = await changeRequestService?.getShareableLink(requestId);
      
      if (result?.success) {
        setShareableLinkData(result?.data);
        setShowShareableLink(true);
      } else {
        setError(result?.error || 'Failed to generate shareable link');
      }
    } catch (err) {
      setError('Failed to generate shareable link');
      console.error('Error generating link:', err);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format) => {
    try {
      const result = await changeRequestService?.exportChangeRequests(format, filters);
      
      if (result?.success) {
        // Create download
        const blob = new Blob([result?.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result?.filename;
        document.body?.appendChild(a);
        a?.click();
        document.body?.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError(result?.error || 'Failed to export data');
      }
    } catch (err) {
      setError('Failed to export data');
      console.error('Error exporting:', err);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading change requests...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show auth required message for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to access the Change Request and Actions Log system.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => window.location.href = '/signup'}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Change Request and Actions Log - AccountingPro</title>
        <meta name="description" content="Track all user-initiated requests and corresponding system implementations" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Header Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Request and Actions Log</h1>
                    <p className="text-gray-600">Track all user requests and implementation progress</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowSubmissionForm(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>New Request</span>
                    </button>
                    <ExportPanel onExport={handleExport} />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{requests?.length || 0}</div>
                    <div className="text-sm text-blue-700">Total Requests</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {requests?.filter(r => r?.status === 'in_progress')?.length || 0}
                    </div>
                    <div className="text-sm text-yellow-700">In Progress</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {requests?.filter(r => r?.status === 'completed')?.length || 0}
                    </div>
                    <div className="text-sm text-green-700">Completed</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {requests?.filter(r => r?.priority === 'urgent')?.length || 0}
                    </div>
                    <div className="text-sm text-red-700">Urgent</div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700">{error}</span>
                    <button 
                      onClick={() => setError(null)}
                      className="ml-auto text-red-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Filters and Request List */}
                <div className="lg:col-span-2 space-y-6">
                  <RequestFilters 
                    filters={filters} 
                    onFilterChange={handleFilterChange}
                    requests={requests}
                  />
                  
                  <RequestList
                    requests={requests}
                    selectedRequest={selectedRequest}
                    onSelectRequest={handleSelectRequest}
                    onStatusUpdate={handleStatusUpdate}
                    onGenerateLink={handleGenerateShareableLink}
                    userProfile={userProfile}
                  />
                </div>

                {/* Right Column - Details and Timeline */}
                <div className="space-y-6">
                  {selectedRequest ? (
                    <>
                      <RequestDetails
                        request={selectedRequest}
                        onStatusUpdate={handleStatusUpdate}
                        onAddImplementation={handleAddImplementation}
                        onGenerateLink={handleGenerateShareableLink}
                        userProfile={userProfile}
                      />
                    </>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Request</h3>
                      <p className="text-gray-600">Choose a change request from the list to view details and actions</p>
                    </div>
                  )}

                  <ActivityTimeline 
                    activityLogs={activityLogs}
                    selectedRequestId={selectedRequest?.id}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Modals */}
        {showSubmissionForm && (
          <RequestSubmissionForm
            onSubmit={handleCreateRequest}
            onClose={() => setShowSubmissionForm(false)}
          />
        )}

        {showShareableLink && shareableLinkData && (
          <ShareableLink
            linkData={shareableLinkData}
            onClose={() => {
              setShowShareableLink(false);
              setShareableLinkData(null);
            }}
          />
        )}
      </div>
    </>
  );
}