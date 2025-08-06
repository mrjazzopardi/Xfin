import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const ComplianceReports = () => {
  const [selectedReport, setSelectedReport] = useState('bas');
  const [reportPeriod, setReportPeriod] = useState('2024-03');

  // Australian compliance reports data
  const reports = [
    {
      id: 'bas',
      name: 'Business Activity Statement (BAS)',
      description: 'Quarterly GST, PAYG, and other tax reporting',
      status: 'ready',
      lastGenerated: '2024-03-15',
      dueDate: '2024-04-28'
    },
    {
      id: 'itr',
      name: 'Income Tax Return',
      description: 'Annual income tax return for individuals or companies',
      status: 'pending',
      lastGenerated: '2024-02-15',
      dueDate: '2024-10-31'
    },
    {
      id: 'payg',
      name: 'PAYG Payment Summary',
      description: 'Employee payment summary statements',
      status: 'ready',
      lastGenerated: '2024-03-20',
      dueDate: '2024-07-14'
    },
    {
      id: 'super',
      name: 'Superannuation Report',
      description: 'Quarterly superannuation guarantee reporting',
      status: 'draft',
      lastGenerated: '2024-01-15',
      dueDate: '2024-04-28'
    },
    {
      id: 'fringe',
      name: 'Fringe Benefits Tax Return',
      description: 'Annual FBT return for benefits provided to employees',
      status: 'pending',
      lastGenerated: '2023-05-15',
      dueDate: '2024-05-21'
    }
  ];

  const reportPeriods = [
    { value: '2024-03', label: 'March 2024 Quarter' },
    { value: '2024-02', label: 'February 2024' },
    { value: '2024-01', label: 'January 2024' },
    { value: '2023-12', label: 'December 2023 Quarter' }
  ];

  // Mock Australian BAS data
  const basData = {
    summary: {
      totalGSTCollected: 145000,
      totalGSTCredits: 89000,
      netGSTPayable: 56000,
      payrollTax: 23400,
      totalPayable: 79400
    },
    gst: [
      { code: 'G1', description: 'Total Sales', amount: 1450000, gst: 145000 },
      { code: 'G11', description: 'Other GST-free sales', amount: 25000, gst: 0 },
      { code: '1A', description: 'GST on purchases', amount: 890000, gst: 89000 },
      { code: '1B', description: 'GST on imports', amount: 15000, gst: 1500 }
    ],
    payg: {
      withheld: 156000,
      installments: 45000,
      total: 201000
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-success bg-success-100';
      case 'pending': return 'text-warning bg-warning-100';
      case 'draft': return 'text-text-secondary bg-primary-100';
      default: return 'text-text-secondary bg-primary-100';
    }
  };

  const handleExportBAS = () => {
    const basExport = {
      abn: "12345678901",
      period: reportPeriod,
      summary: basData?.summary,
      gst_details: basData?.gst,
      payg_details: basData?.payg,
      generated_at: new Date()?.toISOString(),
      report_type: selectedReport
    };
    
    const blob = new Blob([JSON.stringify(basExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `australian-${selectedReport}-${reportPeriod}.json`;
    a?.click();
    URL.revokeObjectURL(url);
  };

  const handleLodgeBAS = () => {
    // Simulate lodging with ATO
    alert('BAS would be lodged electronically with the Australian Taxation Office (ATO)');
  };

  return (
    <div className="space-y-6">
      {/* Australian Tax Office Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-3xl">🏛️</span>
          <div>
            <h2 className="text-xl font-heading font-bold text-text-primary">Australian Taxation Office (ATO)</h2>
            <p className="text-text-secondary">Business Activity Statements, Income Tax Returns, and Compliance Reporting</p>
          </div>
        </div>
      </div>

      {/* Report Selection and Period */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 gap-3">
            {reports?.map((report) => (
              <button
                key={report?.id}
                onClick={() => setSelectedReport(report?.id)}
                className={`
                  p-4 rounded-lg border nav-transition text-left
                  ${selectedReport === report?.id
                    ? 'border-primary bg-primary-50' :'border-border hover:border-primary-200'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-text-primary">{report?.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report?.status)}`}>
                    {report?.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{report?.description}</p>
                <div className="mt-2 text-xs text-text-secondary">
                  Due: {report?.dueDate}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Report Period
          </label>
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e?.target?.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:border-border-focus focus:outline-none nav-transition"
          >
            {reportPeriods?.map((period) => (
              <option key={period?.value} value={period?.value}>
                {period?.label}
              </option>
            ))}
          </select>

          <div className="mt-4 p-4 bg-background rounded-lg">
            <h4 className="font-medium text-text-primary mb-2">Report Actions</h4>
            <div className="space-y-2">
              <button
                onClick={handleExportBAS}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition"
              >
                <Icon name="Download" size={16} color="white" />
                <span>Export Report</span>
              </button>
              <button 
                onClick={handleLodgeBAS}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success-700 nav-transition"
              >
                <Icon name="Send" size={16} color="white" />
                <span>Lodge with ATO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-background rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            {reports?.find(r => r?.id === selectedReport)?.name} Preview
          </h3>
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Icon name="Calendar" size={16} color="var(--color-text-secondary)" />
            <span>Period: {reportPeriods?.find(p => p?.value === reportPeriod)?.label}</span>
          </div>
        </div>

        {selectedReport === 'bas' && (
          <>
            {/* BAS Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">GST Collected</p>
                <p className="text-xl font-bold text-text-primary">${basData?.summary?.totalGSTCollected?.toLocaleString()}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">GST Credits</p>
                <p className="text-xl font-bold text-success">${basData?.summary?.totalGSTCredits?.toLocaleString()}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Net GST Payable</p>
                <p className="text-xl font-bold text-primary">${basData?.summary?.netGSTPayable?.toLocaleString()}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <p className="text-sm text-text-secondary mb-1">Total Payable</p>
                <p className="text-xl font-bold text-warning">${basData?.summary?.totalPayable?.toLocaleString()}</p>
              </div>
            </div>

            {/* GST Details Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border">
                <h4 className="font-medium text-text-primary">GST Summary</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">Label</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">Description</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-text-secondary">Amount</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-text-secondary">GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basData?.gst?.map((item, index) => (
                      <tr key={index} className="border-b border-border hover:bg-background nav-transition">
                        <td className="py-3 px-6 text-sm font-data text-text-primary">{item?.code}</td>
                        <td className="py-3 px-6 text-sm text-text-primary">{item?.description}</td>
                        <td className="py-3 px-6 text-sm text-text-primary text-right">${item?.amount?.toLocaleString()}</td>
                        <td className="py-3 px-6 text-sm text-primary text-right font-medium">${item?.gst?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAYG Summary */}
            <div className="bg-surface rounded-lg p-6 border border-border">
              <h4 className="font-medium text-text-primary mb-4">PAYG Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">PAYG Withheld</p>
                  <p className="text-lg font-bold text-text-primary">${basData?.payg?.withheld?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">PAYG Installments</p>
                  <p className="text-lg font-bold text-text-primary">${basData?.payg?.installments?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total PAYG</p>
                  <p className="text-lg font-bold text-primary">${basData?.payg?.total?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedReport !== 'bas' && (
          <div className="text-center py-12 text-text-secondary">
            <Icon name="FileText" size={48} color="var(--color-text-secondary)" />
            <p className="mt-4 text-lg">
              {reports?.find(r => r?.id === selectedReport)?.name} preview will be available soon
            </p>
            <p className="text-sm mt-2">This report type is currently under development</p>
          </div>
        )}
      </div>

      {/* ATO Validation Status */}
      <div className="bg-success-100 border border-success-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Icon name="CheckCircle" size={20} color="var(--color-success)" />
          <div>
            <p className="text-success font-medium">ATO Validation Passed</p>
            <p className="text-success-700 text-sm">Report meets Australian Taxation Office requirements and is ready for lodgment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReports;