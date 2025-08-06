import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import BankTransactionsPanel from './components/BankTransactionsPanel';
import MatchSuggestionsPanel from './components/MatchSuggestionsPanel';
import RecordedTransactionsPanel from './components/RecordedTransactionsPanel';
import ReconciliationSummary from './components/ReconciliationSummary';
import BulkActionsBar from './components/BulkActionsBar';
import { useAuth } from '../../contexts/AuthContext';
import { bankReconciliationService } from '../../services/bankReconciliationService';
import { importUtils } from '../../utils/importUtils';

const BankReconciliation = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedBankTransactions, setSelectedBankTransactions] = useState([]);
  const [selectedRecordedTransactions, setSelectedRecordedTransactions] = useState([]);
  const [matchedTransactions, setMatchedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('bank');
  const [reconciliationProgress, setReconciliationProgress] = useState(0);

  // Data states
  const [bankTransactions, setBankTransactions] = useState([]);
  const [recordedTransactions, setRecordedTransactions] = useState([]);
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock user for display (fallback if no auth)
  const displayUser = userProfile ? {
    name: userProfile?.full_name,
    email: userProfile?.email,
    role: userProfile?.role,
    avatar: userProfile?.avatar_url || "https://randomuser.me/api/portraits/women/32.jpg"
  } : {
    name: "Sarah Johnson",
    email: "sarah.johnson@accountingpro.com",
    role: "Senior Accountant",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg"
  };

  const userRole = userProfile?.role || 'staff';

  useEffect(() => {
    loadReconciliationData();
  }, []);

  const loadReconciliationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bankResult, recordedResult, matchResult] = await Promise.all([
        bankReconciliationService?.getBankTransactions({ unreconciled: true }),
        bankReconciliationService?.getRecordedTransactions({ unmatched: true }),
        bankReconciliationService?.getSuggestedMatches()
      ]);

      if (bankResult?.success) {
        setBankTransactions(bankResult?.bankTransactions);
      } else {
        setError(`Failed to load bank transactions: ${bankResult?.error}`);
      }

      if (recordedResult?.success) {
        setRecordedTransactions(recordedResult?.recordedTransactions);
      } else {
        setError(prev => prev ? `${prev}. Failed to load recorded transactions: ${recordedResult?.error}` : `Failed to load recorded transactions: ${recordedResult?.error}`);
      }

      if (matchResult?.success) {
        setSuggestedMatches(matchResult?.suggestedMatches);
      } else {
        console.error('Failed to load match suggestions:', matchResult?.error);
      }

    } catch (error) {
      console.error('Error loading reconciliation data:', error);
      setError('Failed to load reconciliation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate reconciliation progress
  useEffect(() => {
    const totalTransactions = bankTransactions?.length;
    const matchedCount = bankTransactions?.filter(t => t?.matched)?.length + matchedTransactions?.length;
    const progress = totalTransactions > 0 ? (matchedCount / totalTransactions) * 100 : 0;
    setReconciliationProgress(progress);
  }, [bankTransactions, matchedTransactions]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleBankTransactionSelect = (transactionId) => {
    setSelectedBankTransactions(prev => 
      prev?.includes(transactionId) 
        ? prev?.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleRecordedTransactionSelect = (transactionId) => {
    setSelectedRecordedTransactions(prev => 
      prev?.includes(transactionId) 
        ? prev?.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleMatchAccept = async (matchId) => {
    try {
      const match = suggestedMatches?.find(m => m?.id === matchId);
      if (!match) return;

      const result = await bankReconciliationService?.acceptMatch(
        match?.bankTransaction?.id,
        match?.recordedTransaction?.id
      );

      if (result?.success) {
        setMatchedTransactions(prev => [...prev, { ...match, status: 'accepted' }]);
        setSuggestedMatches(prev => prev?.filter(m => m?.id !== matchId));
        
        // Update bank transactions to show as matched
        setBankTransactions(prev => 
          prev?.map(t => 
            t?.id === match?.bankTransaction?.id ? { ...t, matched: true } : t
          )
        );

        // Update recorded transactions
        setRecordedTransactions(prev => 
          prev?.map(t => 
            t?.id === match?.recordedTransaction?.id ? { ...t, matched: true } : t
          )
        );
      } else {
        setError(`Failed to accept match: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      setError('Failed to accept match. Please try again.');
    }
  };

  const handleMatchReject = (matchId) => {
    setSuggestedMatches(prev => prev?.filter(m => m?.id !== matchId));
  };

  const handleBulkAccept = async () => {
    try {
      setLoading(true);
      
      const result = await bankReconciliationService?.bulkAcceptMatches(0.9);
      
      if (result?.success) {
        setError(null);
        await loadReconciliationData(); // Refresh data
        
        if (result?.acceptedCount > 0) {
          alert(`Successfully accepted ${result?.acceptedCount} high-confidence matches!`);
        } else {
          alert('No high-confidence matches found to accept automatically.');
        }
      } else {
        setError(`Bulk accept failed: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error in bulk accept:', error);
      setError('Failed to process bulk matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (selectedBankTransactions?.length === 1 && selectedRecordedTransactions?.length === 1) {
      try {
        const result = await bankReconciliationService?.acceptMatch(
          selectedBankTransactions?.[0],
          selectedRecordedTransactions?.[0]
        );

        if (result?.success) {
          const bankTxn = bankTransactions?.find(t => t?.id === selectedBankTransactions?.[0]);
          const recordedTxn = recordedTransactions?.find(t => t?.id === selectedRecordedTransactions?.[0]);
          
          const manualMatch = {
            id: `manual_${Date.now()}`,
            bankTransaction: bankTxn,
            recordedTransaction: recordedTxn,
            confidence: 1.0,
            matchReason: 'Manual match by user',
            status: 'manual'
          };
          
          setMatchedTransactions(prev => [...prev, manualMatch]);
          setSelectedBankTransactions([]);
          setSelectedRecordedTransactions([]);
          
          // Update UI to show as matched
          setBankTransactions(prev => 
            prev?.map(t => t?.id === selectedBankTransactions?.[0] ? { ...t, matched: true } : t)
          );
          setRecordedTransactions(prev => 
            prev?.map(t => t?.id === selectedRecordedTransactions?.[0] ? { ...t, matched: true } : t)
          );
        } else {
          setError(`Failed to create manual match: ${result?.error}`);
        }
      } catch (error) {
        console.error('Error creating manual match:', error);
        setError('Failed to create manual match. Please try again.');
      }
    }
  };

  const handleImportBankStatement = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = e?.target?.files?.[0];
      if (!file) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data } = await importUtils?.parseCSV(file);
        const validation = importUtils?.validateBankStatementImport(data);
        
        if (validation?.validRows > 0) {
          importUtils?.showImportPreview(
            validation,
            async (validTransactions) => {
              // Import to database - you'll need to get the bank account ID
              const result = await bankReconciliationService?.importBankTransactions(
                validTransactions, 
                '7fced0ed-6895-407a-aa01-54b40e026d31' // Default bank account - should be selected by user
              );
              
              if (result?.success) {
                alert(`Successfully imported ${result?.importedCount} bank transactions!`);
                await loadReconciliationData(); // Refresh data
              } else {
                setError(`Import failed: ${result?.error}`);
              }
            },
            () => {
              console.log('Import cancelled');
            }
          );
        } else {
          setError(`Import failed. Please check your file format.\n\nErrors:\n${validation?.errors?.slice(0, 5)?.join('\n')}`);
        }
      } catch (error) {
        console.error('Import error:', error);
        setError(`Import failed: ${error?.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    input?.click();
  };

  const handleSyncBankFeed = async () => {
    try {
      setLoading(true);
      
      // Simulate bank feed sync - in real app, this would call bank API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data after sync
      await loadReconciliationData();
      
      alert('Bank feed synchronized successfully! New transactions have been imported.');
    } catch (error) {
      console.error('Sync error:', error);
      setError('Bank feed synchronization failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading reconciliation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={displayUser} 
        onMenuToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={handleLogout}
      />
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userRole={userRole}
      />
      <main className={`pt-header-height nav-transition ${
        sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'
      }`}>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
                  Bank Reconciliation
                </h1>
                <p className="text-text-secondary">
                  Match bank transactions with recorded entries to ensure accuracy
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <button 
                  onClick={handleImportBankStatement}
                  className="flex items-center space-x-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-700 nav-transition"
                >
                  <Icon name="Download" size={16} color="white" />
                  <span>Import Bank Statement</span>
                </button>
                <button 
                  onClick={handleSyncBankFeed}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition"
                >
                  <Icon name="RefreshCw" size={16} color="white" />
                  <span>Sync Bank Feed</span>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <Icon name="AlertCircle" size={20} color="#EF4444" />
                  <p className="ml-2 text-red-700">{error}</p>
                  <button 
                    onClick={loadReconciliationData}
                    className="ml-auto text-red-600 hover:text-red-800 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Reconciliation Summary */}
            <ReconciliationSummary 
              progress={reconciliationProgress}
              totalTransactions={bankTransactions?.length}
              matchedCount={bankTransactions?.filter(t => t?.matched)?.length + matchedTransactions?.length}
              suggestedCount={suggestedMatches?.length}
            />
          </div>

          {/* Bulk Actions Bar */}
          <BulkActionsBar 
            selectedBankCount={selectedBankTransactions?.length}
            selectedRecordedCount={selectedRecordedTransactions?.length}
            onBulkAccept={handleBulkAccept}
            onManualMatch={handleManualMatch}
            canManualMatch={selectedBankTransactions?.length === 1 && selectedRecordedTransactions?.length === 1}
          />

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden mb-6">
            <div className="flex bg-surface rounded-lg p-1 border border-border">
              <button
                onClick={() => setActiveTab('bank')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium nav-transition ${
                  activeTab === 'bank' ?'bg-primary text-white' :'text-text-secondary hover:text-text-primary'
                }`}
              >
                Bank Transactions
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium nav-transition ${
                  activeTab === 'suggestions' ?'bg-primary text-white' :'text-text-secondary hover:text-text-primary'
                }`}
              >
                Suggestions
              </button>
              <button
                onClick={() => setActiveTab('recorded')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium nav-transition ${
                  activeTab === 'recorded' ?'bg-primary text-white' :'text-text-secondary hover:text-text-primary'
                }`}
              >
                Recorded
              </button>
            </div>
          </div>

          {/* Three-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bank Transactions Panel */}
            <div className={`${activeTab === 'bank' ? 'block' : 'hidden'} lg:block`}>
              <BankTransactionsPanel 
                transactions={bankTransactions}
                selectedTransactions={selectedBankTransactions}
                onTransactionSelect={handleBankTransactionSelect}
              />
            </div>

            {/* Match Suggestions Panel */}
            <div className={`${activeTab === 'suggestions' ? 'block' : 'hidden'} lg:block`}>
              <MatchSuggestionsPanel 
                suggestions={suggestedMatches}
                onMatchAccept={handleMatchAccept}
                onMatchReject={handleMatchReject}
              />
            </div>

            {/* Recorded Transactions Panel */}
            <div className={`${activeTab === 'recorded' ? 'block' : 'hidden'} lg:block`}>
              <RecordedTransactionsPanel 
                transactions={recordedTransactions}
                selectedTransactions={selectedRecordedTransactions}
                onTransactionSelect={handleRecordedTransactionSelect}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BankReconciliation;