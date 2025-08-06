import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const FilingStatus = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q1');

  // Australian filing status data
  const filingStatus = [
    {
      id: 1,
      returnType: 'Business Activity Statement',
      period: 'March 2024 Quarter',
      dueDate: '2024-04-28',
      status: 'filed',
      filedDate: '2024-04-25',
      acknowledgmentNumber: 'ATO123456789',
      amount: 79400
    },
    {
      id: 2,
      returnType: 'PAYG Payment Summary',
      period: 'March 2024',
      dueDate: '2024-07-14',
      status: 'pending',
      filedDate: null,
      acknowledgmentNumber: null,
      amount: 156000
    },
    {
      id: 3,
      returnType: 'Superannuation Report',
      period: 'Q1 2024',
      dueDate: '2024-04-28',
      status: 'overdue',
      filedDate: null,
      acknowledgmentNumber: null,
      amount: 89500
    },
    {
      id: 4,
      returnType: 'Income Tax Return',
      period: 'FY 2023-24',
      dueDate: '2024-10-31',
      status: 'draft',
      filedDate: null,
      acknowledgmentNumber: null,
      amount: 298750
    }
  ];

  const upcomingDeadlines = [
    {
      returnType: 'Business Activity Statement',
      period: 'June 2024 Quarter',
      dueDate: '2024-07-28',
      daysLeft: 25,
      priority: 'high'
    },
    {
      returnType: 'PAYG Payment Summary',
      period: 'Annual 2024',
      dueDate: '2024-07-14',
      daysLeft: 11,
      priority: 'high'
    },
    {
      returnType: 'Income Tax Return',
      period: 'FY 2023-24',
      dueDate: '2024-10-31',
      daysLeft: 127,
      priority: 'medium'
    },
    {
      returnType: 'Fringe Benefits Tax',
      period: 'FY 2023-24',
      dueDate: '2024-05-21',
      daysLeft: -12,
      priority: 'overdue'
    }
  ];

  const auditTrail = [
    {
      id: 1,
      action: 'BAS Lodged with ATO',
      user: 'Sarah Johnson',
      timestamp: '2024-04-25 14:30:00',
      details: 'Successfully lodged March 2024 BAS with ATO',
      type: 'filing'
    },
    {
      id: 2,
      action: 'GST Calculation Updated',
      user: 'Michael Chen',
      timestamp: '2024-04-24 11:15:00',
      details: 'Updated GST rate for professional services',
      type: 'calculation'
    },
    {
      id: 3,
      action: 'Superannuation Payment',
      user: 'Sarah Johnson',
      timestamp: '2024-04-23 16:45:00',
      details: 'Processed quarterly super guarantee payments',
      type: 'super'
    },
    {
      id: 4,
      action: 'PAYG Summary Generated',
      user: 'David Wilson',
      timestamp: '2024-04-22 09:20:00',
      details: 'Generated annual PAYG payment summaries',
      type: 'payg'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'filed': return 'text-success bg-success-100 border-success-200';
      case 'pending': return 'text-warning bg-warning-100 border-warning-200';
      case 'overdue': return 'text-error bg-error-100 border-error-200';
      case 'draft': return 'text-text-secondary bg-primary-100 border-border';
      default: return 'text-text-secondary bg-primary-100 border-border';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error bg-error-100';
      case 'medium': return 'text-warning bg-warning-100';
      case 'low': return 'text-success bg-success-100';
      case 'overdue': return 'text-error bg-error-100';
      default: return 'text-text-secondary bg-primary-100';
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'filing': return 'FileCheck';
      case 'calculation': return 'Calculator';
      case 'super': return 'PiggyBank';
      case 'payg': return 'DollarSign';
      default: return 'Activity';
    }
  };

  return (
    <div className="space-y-6">
      {/* Australian Tax Filing Overview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200 mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-3xl">🇦🇺</span>
          <div>
            <h2 className="text-xl font-heading font-bold text-text-primary">Australian Tax Filing Status</h2>
            <p className="text-text-secondary">Track your BAS, Income Tax, Superannuation and other ATO obligations</p>
          </div>
        </div>
      </div>

      {/* Filing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">Filed Returns</h3>
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <Icon name="CheckCircle" size={20} color="var(--color-success)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success mb-2">12</p>
          <p className="text-sm text-text-secondary">This financial year</p>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">Pending Returns</h3>
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <Icon name="Clock" size={20} color="var(--color-warning)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-warning mb-2">4</p>
          <p className="text-sm text-text-secondary">Due this quarter</p>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">ATO Compliance</h3>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={20} color="var(--color-primary)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-primary mb-2">96%</p>
          <p className="text-sm text-text-secondary">Excellent rating</p>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">Total Tax Paid</h3>
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Icon name="DollarSign" size={20} color="var(--color-secondary)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary mb-2">$523K</p>
          <p className="text-sm text-text-secondary">FY 2023-24</p>
        </div>
      </div>

      {/* Upcoming ATO Deadlines */}
      <div className="bg-background rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
          Upcoming ATO Deadlines
        </h3>
        
        <div className="space-y-3">
          {upcomingDeadlines?.map((deadline, index) => (
            <div key={index} className="bg-surface rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    deadline?.priority === 'overdue' ? 'bg-error' :
                    deadline?.priority === 'high' ? 'bg-error' :
                    deadline?.priority === 'medium' ? 'bg-warning' : 'bg-success'
                  }`}></div>
                  <div>
                    <h4 className="font-medium text-text-primary">{deadline?.returnType}</h4>
                    <p className="text-sm text-text-secondary">{deadline?.period}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-text-primary font-medium">Due: {deadline?.dueDate}</p>
                  <p className={`text-sm font-medium ${
                    deadline?.daysLeft < 0 ? 'text-error' :
                    deadline?.daysLeft <= 7 ? 'text-error' : 
                    deadline?.daysLeft <= 15 ? 'text-warning' : 'text-success'
                  }`}>
                    {deadline?.daysLeft < 0 ? `${Math.abs(deadline?.daysLeft)} days overdue` : `${deadline?.daysLeft} days left`}
                  </p>
                </div>
                
                <button className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition text-sm">
                  Lodge Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filing Status Table */}
      <div className="bg-background rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Australian Tax Filing History
          </h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e?.target?.value)}
            className="px-4 py-2 border border-border rounded-lg focus:border-border-focus focus:outline-none nav-transition"
          >
            <option value="2024-Q1">FY 2023-24</option>
            <option value="2023-Q4">FY 2022-23</option>
            <option value="2023-Q3">FY 2021-22</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Return Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Period</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Lodged Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Amount (AUD)</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filingStatus?.map((filing) => (
                <tr key={filing?.id} className="border-b border-border hover:bg-primary-50 nav-transition">
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">{filing?.returnType}</td>
                  <td className="py-3 px-4 text-sm text-text-primary">{filing?.period}</td>
                  <td className="py-3 px-4 text-sm text-text-primary">{filing?.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(filing?.status)}`}>
                      {filing?.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-primary">
                    {filing?.filedDate || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-text-primary text-right">
                    ${filing?.amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {filing?.status === 'filed' && (
                        <button className="text-primary hover:text-primary-700 nav-transition">
                          <Icon name="Download" size={16} color="var(--color-primary)" />
                        </button>
                      )}
                      <button className="text-text-secondary hover:text-text-primary nav-transition">
                        <Icon name="Eye" size={16} color="var(--color-text-secondary)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Australian Tax Compliance Audit Trail */}
      <div className="bg-background rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
          ATO Compliance Audit Trail
        </h3>
        
        <div className="space-y-4">
          {auditTrail?.map((entry) => (
            <div key={entry?.id} className="bg-surface rounded-lg p-4 border border-border">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={getActionIcon(entry?.type)} size={16} color="var(--color-primary)" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-text-primary">{entry?.action}</h4>
                    <span className="text-sm text-text-secondary">{entry?.timestamp}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{entry?.details}</p>
                  <div className="flex items-center space-x-2">
                    <Icon name="User" size={14} color="var(--color-text-secondary)" />
                    <span className="text-xs text-text-secondary">by {entry?.user}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-sm text-primary hover:text-primary-700 nav-transition font-medium">
            View Complete ATO Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilingStatus;