import React, { useState, useEffect } from 'react';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import ReportCard from './components/ReportCard';
import ReportViewer from './components/ReportViewer';
import ReportFilters from './components/ReportFilters';
import ExportOptions from './components/ExportOptions';
import { useAuth } from '../../contexts/AuthContext';
import { accountService } from '../../services/accountService';
import { transactionService } from '../../services/transactionService';
import { dashboardService } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

const FinancialReports = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Report filters
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1)?.toISOString()?.split('T')?.[0], // Start of year
    dateTo: new Date()?.toISOString()?.split('T')?.[0], // Today
    accountType: 'all',
    includeInactive: false
  });

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

  // Available reports based on user role
  const getAvailableReports = () => {
    const allReports = [
      {
        id: 'profit-loss',
        title: 'Profit & Loss Statement',
        description: 'Revenue, expenses, and net income for selected period',
        icon: 'TrendingUp',
        category: 'performance',
        frequency: 'monthly'
      },
      {
        id: 'balance-sheet',
        title: 'Balance Sheet',
        description: 'Assets, liabilities, and equity at a specific date',
        icon: 'BarChart3',
        category: 'position',
        frequency: 'quarterly'
      },
      {
        id: 'cash-flow',
        title: 'Cash Flow Statement',
        description: 'Cash inflows and outflows from operations, investments, financing',
        icon: 'DollarSign',
        category: 'cash',
        frequency: 'monthly'
      },
      {
        id: 'trial-balance',
        title: 'Trial Balance',
        description: 'All accounts with debits and credits to verify accuracy',
        icon: 'Scale',
        category: 'accounts',
        frequency: 'monthly'
      },
      {
        id: 'general-ledger',
        title: 'General Ledger',
        description: 'Detailed transaction history for all accounts',
        icon: 'FileText',
        category: 'accounts',
        frequency: 'daily'
      },
      {
        id: 'accounts-receivable',
        title: 'Accounts Receivable Aging',
        description: 'Outstanding customer invoices aged by due date',
        icon: 'Clock',
        category: 'receivables',
        frequency: 'weekly'
      }
    ];

    // Filter reports based on user role
    switch (userRole) {
      case 'client':
        return allReports?.slice(0, 3); // Basic reports only
      case 'freelancer':
        return allReports?.slice(0, 4);
      case 'staff':
        return allReports?.slice(0, 5);
      case 'partner':
      default:
        return allReports; // All reports
    }
  };

  const availableReports = getAvailableReports();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const generateReport = async (reportType) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedReport(reportType);

      let result;

      switch (reportType) {
        case 'profit-loss':
          result = await generateProfitLossReport();
          break;
        case 'balance-sheet':
          result = await generateBalanceSheetReport();
          break;
        case 'cash-flow':
          result = await generateCashFlowReport();
          break;
        case 'trial-balance':
          result = await generateTrialBalanceReport();
          break;
        case 'general-ledger':
          result = await generateGeneralLedgerReport();
          break;
        case 'accounts-receivable':
          result = await generateAccountsReceivableReport();
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (result?.success) {
        setReportData(result?.data);
      } else {
        setError(result?.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateProfitLossReport = async () => {
    try {
      // Get revenue transactions
      const revenueResult = await transactionService?.getTransactions({
        type: 'income',
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo
      });

      if (!revenueResult?.success) {
        return { success: false, error: revenueResult?.error };
      }

      // Get expense transactions
      const expenseResult = await transactionService?.getTransactions({
        type: 'expense',
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo
      });

      if (!expenseResult?.success) {
        return { success: false, error: expenseResult?.error };
      }

      // Calculate totals by category
      const revenueByCategory = {};
      const expensesByCategory = {};

      revenueResult?.transactions?.forEach(txn => {
        const category = txn?.category || 'Other Revenue';
        if (!revenueByCategory?.[category]) {
          revenueByCategory[category] = 0;
        }
        revenueByCategory[category] += Math.abs(parseFloat(txn?.amount));
      });

      expenseResult?.transactions?.forEach(txn => {
        const category = txn?.category || 'Other Expenses';
        if (!expensesByCategory?.[category]) {
          expensesByCategory[category] = 0;
        }
        expensesByCategory[category] += Math.abs(parseFloat(txn?.amount));
      });

      const totalRevenue = Object.values(revenueByCategory)?.reduce((sum, amount) => sum + amount, 0);
      const totalExpenses = Object.values(expensesByCategory)?.reduce((sum, amount) => sum + amount, 0);
      const netIncome = totalRevenue - totalExpenses;

      return {
        success: true,
        data: {
          reportType: 'profit-loss',
          period: { from: filters?.dateFrom, to: filters?.dateTo },
          revenue: {
            categories: revenueByCategory,
            total: totalRevenue
          },
          expenses: {
            categories: expensesByCategory,
            total: totalExpenses
          },
          netIncome,
          generatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  };

  const generateBalanceSheetReport = async () => {
    try {
      let result = await accountService?.getTrialBalance(filters?.dateTo);
      
      if (!result?.success) {
        return { success: false, error: result?.error };
      }

      const { trialBalance } = result;

      return {
        success: true,
        data: {
          reportType: 'balance-sheet',
          asOfDate: filters?.dateTo,
          assets: {
            categories: trialBalance?.assets,
            total: trialBalance?.totals?.assets_total
          },
          liabilities: {
            categories: trialBalance?.liabilities,
            total: trialBalance?.totals?.liabilities_total
          },
          equity: {
            categories: trialBalance?.equity,
            total: trialBalance?.totals?.equity_total + trialBalance?.totals?.revenue_total - trialBalance?.totals?.expenses_total
          },
          generatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  };

  const generateCashFlowReport = async () => {
    try {
      let result = await dashboardService?.getCashFlowData(12); // Last 12 weeks
      
      if (!result?.success) {
        return { success: false, error: result?.error };
      }

      // Group cash flow data by month for better reporting
      const monthlyData = {};
      
      result?.cashFlowData?.forEach(week => {
        const month = week?.date?.slice(0, 7); // YYYY-MM
        if (!monthlyData?.[month]) {
          monthlyData[month] = { inflow: 0, outflow: 0, net: 0 };
        }
        monthlyData[month].inflow += week?.inflow;
        monthlyData[month].outflow += week?.outflow;
        monthlyData[month].net += (week?.inflow - week?.outflow);
      });

      return {
        success: true,
        data: {
          reportType: 'cash-flow',
          period: { from: filters?.dateFrom, to: filters?.dateTo },
          monthlyData,
          summary: {
            totalInflow: Object.values(monthlyData)?.reduce((sum, month) => sum + month?.inflow, 0),
            totalOutflow: Object.values(monthlyData)?.reduce((sum, month) => sum + month?.outflow, 0),
            netCashFlow: Object.values(monthlyData)?.reduce((sum, month) => sum + month?.net, 0)
          },
          generatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  };

  const generateTrialBalanceReport = async () => {
    try {
      let result = await accountService?.getTrialBalance(filters?.dateTo);
      
      if (!result?.success) {
        return { success: false, error: result?.error };
      }

      return {
        success: true,
        data: {
          reportType: 'trial-balance',
          ...result?.trialBalance,
          generatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  };

  const generateGeneralLedgerReport = async () => {
    try {
      let result = await transactionService?.getTransactions({
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo
      });

      if (!result?.success) {
        return { success: false, error: result?.error };
      }

      // Group transactions by account
      const ledgerByAccount = {};
      
      result?.transactions?.forEach(txn => {
        const accountKey = txn?.account?.account_code;
        if (!ledgerByAccount?.[accountKey]) {
          ledgerByAccount[accountKey] = {
            accountCode: txn?.account?.account_code,
            accountName: txn?.account?.account_name,
            transactions: [],
            balance: 0
          };
        }
        
        ledgerByAccount?.[accountKey]?.transactions?.push(txn);
        
        // Calculate running balance
        const amount = parseFloat(txn?.amount);
        if (txn?.transaction_type === 'income') {
          ledgerByAccount[accountKey].balance += amount;
        } else {
          ledgerByAccount[accountKey].balance -= amount;
        }
      });

      return {
        success: true,
        data: {
          reportType: 'general-ledger',
          period: { from: filters?.dateFrom, to: filters?.dateTo },
          accounts: ledgerByAccount,
          generatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
  };

  const generateAccountsReceivableReport = async () => {
    try {
      // Get pending income transactions (unpaid invoices)
      let result = await transactionService?.getTransactions({
        type: 'income',
        status: 'pending'
      });

      if (!result?.success) {
        return { success: false, error: result?.error };
      }

      // Age the receivables
      const today = new Date();
      const agedReceivables = {
        current: [], // 0-30 days
        thirty: [],  // 31-60 days
        sixty: [],   // 61-90 days
        ninety: []   // 90+ days
      };

      result?.transactions?.forEach(txn => {
        const invoiceDate = new Date(txn?.transaction_date);
        const daysOld = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
        
        if (daysOld <= 30) {
          agedReceivables?.current?.push(txn);
        } else if (daysOld <= 60) {
          agedReceivables?.thirty?.push(txn);
        } else if (daysOld <= 90) {
          agedReceivables?.sixty?.push(txn);
        } else {
          agedReceivables?.ninety?.push(txn);
        }
      });

      // Calculate totals
      const totals = {
        current: agedReceivables?.current?.reduce((sum, txn) => sum + Math.abs(parseFloat(txn?.amount)), 0),
        thirty: agedReceivables?.thirty?.reduce((sum, txn) => sum + Math.abs(parseFloat(txn?.amount)), 0),
        sixty: agedReceivables?.sixty?.reduce((sum, txn) => sum + Math.abs(parseFloat(txn?.amount)), 0),
        ninety: agedReceivables?.ninety?.reduce((sum, txn) => sum + Math.abs(parseFloat(txn?.amount)), 0)
      };

      totals.total = totals?.current + totals?.thirty + totals?.sixty + totals?.ninety;

      return {
        success: true,
        data: {
          reportType: 'accounts-receivable',
          asOfDate: today?.toISOString()?.split('T')?.[0],
          agedReceivables,
          totals,
          generatedAt: new Date()?.toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error?.message };
    }
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
                  Financial Reports
                </h1>
                <p className="text-text-secondary text-lg">
                  Generate comprehensive financial statements and analysis reports with real transaction data
                </p>
              </div>
              
              <div className="mt-4 lg:mt-0">
                {selectedReport && reportData && (
                  <ExportOptions 
                    reportData={reportData}
                    reportType={selectedReport}
                    onExport={(format) => console.log(`Exporting ${selectedReport} as ${format}`)}
                  />
                )}
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

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Report Selection Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
                <h3 className="text-xl font-heading font-semibold text-text-primary mb-6">
                  Available Reports
                </h3>
                
                {/* Report Filters */}
                <ReportFilters 
                  filters={filters}
                  onFiltersChange={setFilters}
                />

                {/* Report Cards */}
                <div className="space-y-3 mt-6">
                  {availableReports?.map((report) => (
                    <ReportCard
                      key={report?.id}
                      report={report}
                      selected={selectedReport === report?.id}
                      onSelect={() => generateReport(report?.id)}
                      loading={loading && selectedReport === report?.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Report Viewer */}
            <div className="xl:col-span-3">
              {loading ? (
                <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Generating report from actual transaction data...</p>
                  </div>
                </div>
              ) : reportData ? (
                <ReportViewer 
                  reportData={reportData}
                  filters={filters}
                />
              ) : (
                <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
                  <div className="text-center py-12">
                    <Icon name="FileText" size={48} color="#9CA3AF" className="mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Select a Report to Generate
                    </h3>
                    <p className="text-text-secondary max-w-md mx-auto">
                      Choose from the available financial reports in the sidebar to generate detailed analysis based on your actual transaction data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialReports;