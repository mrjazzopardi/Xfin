import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import TransactionTable from './components/TransactionTable';
import TransactionDetails from './components/TransactionDetails';
import TransactionFilters from './components/TransactionFilters';
import BulkActions from './components/BulkActions';
import AddTransactionModal from './components/AddTransactionModal';
import { useAuth } from '../../contexts/AuthContext';
import { importUtils } from '../../utils/importUtils';

const TransactionsManagement = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    accountId: 'all',
    clientId: 'all'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

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
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters, currentPage]);

  const loadInitialData = async () => {
    try {
      const { accountService } = await import('../../services/accountService');
      const [accountResult] = await Promise.all([
        accountService?.getAccounts({ active: true })
      ]);

      if (accountResult?.success) {
        setAccounts(accountResult?.accounts);
      } else {
        console.error('Failed to load accounts:', accountResult?.error);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { transactionService } = await import('../../services/transactionService');

      const cleanedFilters = { ...filters };
      if (cleanedFilters.accountId === 'all') {
        delete cleanedFilters.accountId;
      }
      if (cleanedFilters.clientId === 'all') {
        delete cleanedFilters.clientId;
      }

      let result = await transactionService?.getTransactions(cleanedFilters);

      if (result?.success) {
        setTransactions(result?.transactions);
        setTotalCount(result?.transactions?.length); // For simplicity, using array length
      } else {
        setError(result?.error || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleTransactionSelect = (transactionId) => {
    setSelectedTransactions(prev => 
      prev?.includes(transactionId)
        ? prev?.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      setLoading(true);
      
      const { transactionService } = await import('../../services/transactionService');
      let result = await transactionService?.createTransaction(transactionData);
      
      if (result?.success) {
        setShowAddModal(false);
        await loadTransactions(); // Refresh the list
      } else {
        setError(`Failed to create transaction: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('Failed to create transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    try {
      setLoading(true);
      
      const { transactionService } = await import('../../services/transactionService');
      let result;
      
      switch (action) {
        case 'approve':
          result = await transactionService?.bulkUpdateTransactions(selectedTransactions, { status: 'completed' });
          break;
        case 'reject':
          result = await transactionService?.bulkUpdateTransactions(selectedTransactions, { status: 'cancelled' });
          break;
        case 'delete':
          // For simplicity, we'll update status to cancelled instead of actual delete
          result = await transactionService?.bulkUpdateTransactions(selectedTransactions, { status: 'cancelled' });
          break;
        default:
          throw new Error('Unknown bulk action');
      }

      if (result?.success) {
        setSelectedTransactions([]);
        await loadTransactions(); // Refresh the list
      } else {
        setError(`Failed to ${action} transactions: ${result?.error}`);
      }
    } catch (error) {
      console.error(`Error ${action} transactions:`, error);
      setError(`Failed to ${action} transactions. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportTransactions = () => {
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
        const validation = importUtils?.validateTransactionImport(data);
        
        if (validation?.validRows > 0) {
          importUtils?.showImportPreview(
            validation,
            async (validTransactions) => {
              // Import transactions to database
              let successCount = 0;
              const errors = [];

              const { transactionService } = await import('../../services/transactionService');
              for (const txn of validTransactions) {
                // Find matching account for the transaction
                const account = accounts?.find(acc => 
                  acc?.account_name?.toLowerCase()?.includes(txn?.categories?.toLowerCase()) ||
                  acc?.account_type === (txn?.transaction_type === 'income' ? 'revenue' : 'expense')
                );

                const transactionData = {
                  transaction_date: txn?.date,
                  description: txn?.narrative || txn?.description || 'Imported transaction',
                  amount: txn?.transaction_type === 'income' ? txn?.credit_amount : -Math.abs(txn?.debit_amount),
                  transaction_type: txn?.transaction_type,
                  status: txn?.status || 'pending',
                  account_id: account?.id || accounts?.[0]?.id, // Default to first account if no match
                  category: txn?.categories,
                  reference_number: txn?.reference || null
                };

                try {
                  let result = await transactionService?.createTransaction(transactionData);
                  if (result?.success) {
                    successCount++;
                  } else {
                    errors?.push(`Row ${validTransactions?.indexOf(txn) + 1}: ${result?.error}`);
                  }
                } catch (error) {
                  errors?.push(`Row ${validTransactions?.indexOf(txn) + 1}: ${error?.message}`);
                }
              }

              if (successCount > 0) {
                await loadTransactions(); // Refresh the list
                const message = errors?.length > 0 
                  ? `Imported ${successCount} transactions successfully. ${errors?.length} failed.\n\nErrors:\n${errors?.slice(0, 5)?.join('\n')}`
                  : `Successfully imported ${successCount} transactions!`;
                alert(message);
              } else {
                setError(`Import failed. No transactions were imported.\n\nErrors:\n${errors?.slice(0, 5)?.join('\n')}`);
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
      <main className={`
        pt-header-height nav-transition
        ${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}
      `}>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
                  Transaction Management
                </h1>
                <p className="text-text-secondary text-lg">
                  View, manage, and analyze all financial transactions with real-time data
                </p>
              </div>
              
              <div className="mt-4 lg:mt-0 flex items-center space-x-3">
                <button 
                  onClick={handleImportTransactions}
                  className="flex items-center space-x-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-700 nav-transition"
                >
                  <Icon name="Upload" size={16} color="white" />
                  <span className="hidden sm:inline">Import</span>
                </button>
                
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="gradient-primary text-white px-6 py-2.5 rounded-xl hover:shadow-card-hover nav-transition flex items-center space-x-2 font-medium"
                >
                  <Icon name="Plus" size={16} color="white" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <Icon name="AlertCircle" size={20} color="#EF4444" />
                <p className="ml-2 text-red-700">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <Icon name="X" size={16} color="#DC2626" />
                </button>
              </div>
            </div>
          )}

          {/* Filters and Bulk Actions */}
          <div className="bg-surface rounded-xl border border-border p-6 mb-6 shadow-card">
            <TransactionFilters 
              filters={filters}
              onFiltersChange={setFilters}
              accounts={accounts}
            />
            
            {selectedTransactions?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <BulkActions 
                  selectedCount={selectedTransactions?.length}
                  onBulkAction={handleBulkAction}
                />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Transactions Table */}
            <div className={`${selectedTransaction ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <TransactionTable 
                transactions={transactions}
                selectedTransactions={selectedTransactions}
                onTransactionSelect={handleTransactionSelect}
                onTransactionClick={handleTransactionClick}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Transaction Details Panel */}
            {selectedTransaction && (
              <div className="xl:col-span-1">
                <TransactionDetails 
                  transaction={selectedTransaction}
                  onClose={() => setSelectedTransaction(null)}
                  onUpdate={(updatedTransaction) => {
                    setTransactions(prev => 
                      prev?.map(t => t?.id === updatedTransaction?.id ? updatedTransaction : t)
                    );
                    setSelectedTransaction(updatedTransaction);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTransaction}
          accounts={accounts}
        />
      )}
    </div>
  );
};

export default TransactionsManagement;