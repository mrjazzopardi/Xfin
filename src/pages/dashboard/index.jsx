import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';

// Components
import KPICard from './components/KPICard';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import PendingTasks from './components/PendingTasks';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const dashboardRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Data states
  const [kpiData, setKpiData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
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
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { dashboardService } = await import('../../services/dashboardService');

      // Load all dashboard data
      const [kpiResult, revenueResult, expenseResult, cashFlowResult] = await Promise.all([
        dashboardService?.getKPIData(),
        dashboardService?.getRevenueTrends(6),
        dashboardService?.getExpenseBreakdown(),
        dashboardService?.getCashFlowData(5)
      ]);

      if (kpiResult?.success) {
        setKpiData(kpiResult?.kpiData);
      } else {
        console.error('Failed to load KPI data:', kpiResult?.error);
      }

      if (revenueResult?.success) {
        setRevenueData(revenueResult?.revenueData);
      } else {
        console.error('Failed to load revenue data:', revenueResult?.error);
      }

      if (expenseResult?.success) {
        setExpenseData(expenseResult?.expenseData);
      } else {
        console.error('Failed to load expense data:', expenseResult?.error);
      }

      if (cashFlowResult?.success) {
        setCashFlowData(cashFlowResult?.cashFlowData);
      } else {
        console.error('Failed to load cash flow data:', cashFlowResult?.error);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
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

  // Role-based content filtering
  const getRoleBasedKPIs = () => {
    switch (userRole) {
      case 'partner':
        return kpiData;
      case 'staff':
        return kpiData?.slice(0, 3);
      case 'freelancer':
        return kpiData?.filter(kpi => kpi?.id !== 4);
      case 'client':
        return kpiData?.slice(0, 2);
      default:
        return kpiData;
    }
  };

  const handleDashboardExport = () => {
    if (dashboardRef.current) {
      html2canvas(dashboardRef.current, {
        useCORS: true,
        scale: 2,
      }).then((canvas) => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading dashboard...</p>
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
      <main ref={dashboardRef} className={`
        pt-header-height nav-transition
        ${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}
      `}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
                  Dashboard
                </h1>
                <p className="text-text-secondary text-lg">
                  Welcome back, {displayUser?.name}. Here's your financial overview for today.
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-text-secondary bg-surface px-4 py-2 rounded-xl border border-border">
                  <Icon name="Calendar" size={16} color="#757575" />
                  <span>Last updated: {new Date()?.toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={handleDashboardExport}
                  disabled={loading}
                  className="gradient-primary text-white px-6 py-2.5 rounded-xl hover:shadow-card-hover nav-transition flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="Download" size={16} color="white" />
                  <span>Export Report</span>
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
                  onClick={loadDashboardData}
                  className="ml-auto text-red-600 hover:text-red-800 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {getRoleBasedKPIs()?.map((kpi) => (
              <KPICard key={kpi?.id} data={kpi} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trends */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-heading font-semibold text-text-primary">Revenue Trends</h3>
                  <p className="text-sm text-text-secondary">Monthly revenue, expenses, and profit overview</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg hover:bg-background nav-transition">
                    <Icon name="MoreHorizontal" size={16} color="#757575" />
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="month" stroke="#757575" fontSize={12} />
                    <YAxis stroke="#757575" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #E0E0E0',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#283593" 
                      strokeWidth={3}
                      name="Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#FF9800" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#4CAF50" 
                      strokeWidth={2}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-heading font-semibold text-text-primary">Expense Breakdown</h3>
                  <p className="text-sm text-text-secondary">Current month expense categories</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg hover:bg-background nav-transition">
                    <Icon name="MoreHorizontal" size={16} color="#757575" />
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {expenseData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry?.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value?.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #E0E0E0',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cash Flow Chart */}
          <div className="bg-surface rounded-xl border border-border p-6 mb-8 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-heading font-semibold text-text-primary">Cash Flow Analysis</h3>
                <p className="text-sm text-text-secondary">Weekly cash inflow vs outflow trends</p>
              </div>
              <div className="flex items-center space-x-2">
                <select className="text-sm border border-border rounded-xl px-4 py-2 bg-surface text-text-primary font-medium">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last 6 months</option>
                </select>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="date" stroke="#757575" fontSize={12} />
                  <YAxis stroke="#757575" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E0E0E0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="inflow" 
                    stackId="1"
                    stroke="#4CAF50" 
                    fill="#4CAF50"
                    fillOpacity={0.6}
                    name="Cash Inflow"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="outflow" 
                    stackId="2"
                    stroke="#F44336" 
                    fill="#F44336"
                    fillOpacity={0.6}
                    name="Cash Outflow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="xl:col-span-2">
              <RecentActivity userRole={userRole} />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <QuickActions userRole={userRole} />
              <PendingTasks userRole={userRole} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;