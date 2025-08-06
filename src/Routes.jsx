import React from 'react';
import { HashRouter as Router, Routes as RouterRoutes, Route } from 'react-router-dom';
import ScrollToTop from 'components/ScrollToTop';
import Dashboard from 'pages/dashboard';
import UserManagement from 'pages/user-management';
import TransactionsManagement from 'pages/transactions-management';
import ClientPortal from 'pages/client-portal';
import FinancialReports from 'pages/financial-reports';
import TaxComplianceCenter from 'pages/tax-compliance-center';
import BankReconciliation from 'pages/bank-reconciliation';
import Login from 'pages/login';
import Signup from 'pages/signup';
import NotFound from 'pages/NotFound';
import ChangeRequestAndActionsLog from 'pages/change-request-and-actions-log';

const Routes = () => {
  return (
    <Router>
      <ScrollToTop />
      <RouterRoutes>
        {/* Authentication Routes - Accessible to all */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Main Application Routes - Preview Mode (Accessible to all) */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/transactions-management" element={<TransactionsManagement />} />
        <Route path="/client-portal" element={<ClientPortal />} />
        <Route path="/financial-reports" element={<FinancialReports />} />
        <Route path="/tax-compliance-center" element={<TaxComplianceCenter />} />
        <Route path="/bank-reconciliation" element={<BankReconciliation />} />
        <Route path="/change-request-and-actions-log" element={<ChangeRequestAndActionsLog />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
    </Router>
  );
};

export default Routes;