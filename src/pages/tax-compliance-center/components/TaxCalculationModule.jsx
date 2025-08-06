import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import { taxService } from '../../../services/taxService';

const TaxCalculationModule = () => {
  const [gstData, setGstData] = useState(null);
  const [incomeTaxData, setIncomeTaxData] = useState(null);
  const [superData, setSuperData] = useState(null);
  const [basData, setBasData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date range states
  const [gstPeriod, setGstPeriod] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)?.toISOString()?.split('T')?.[0],
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 0)?.toISOString()?.split('T')?.[0]
  });

  const [financialYear, setFinancialYear] = useState({
    start: `${new Date()?.getFullYear()}-07-01`,
    end: `${new Date()?.getFullYear() + 1}-06-30`
  });

  const [superPeriod, setSuperPeriod] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)?.toISOString()?.split('T')?.[0],
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 0)?.toISOString()?.split('T')?.[0]
  });

  const [basQuarter, setBasQuarter] = useState({
    quarter: Math.ceil((new Date()?.getMonth() + 1) / 3),
    year: new Date()?.getFullYear()
  });

  useEffect(() => {
    loadAllCalculations();
  }, []);

  const loadAllCalculations = async () => {
    setLoading(true);
    setError(null);

    try {
      const [gstResult, incomeTaxResult, superResult, basResult] = await Promise.all([
        taxService?.calculateGST(gstPeriod?.from, gstPeriod?.to),
        taxService?.calculateCompanyIncomeTax(financialYear?.start, financialYear?.end),
        taxService?.calculateSuperannuation(superPeriod?.from, superPeriod?.to),
        taxService?.generateBAS(basQuarter?.quarter, basQuarter?.year)
      ]);

      if (gstResult?.success) {
        setGstData(gstResult?.gstData);
      } else {
        console.error('GST calculation failed:', gstResult?.error);
      }

      if (incomeTaxResult?.success) {
        setIncomeTaxData(incomeTaxResult?.incomeTaxData);
      } else {
        console.error('Income tax calculation failed:', incomeTaxResult?.error);
      }

      if (superResult?.success) {
        setSuperData(superResult?.superData);
      } else {
        console.error('Super calculation failed:', superResult?.error);
      }

      if (basResult?.success) {
        setBasData(basResult?.basData);
      } else {
        console.error('BAS calculation failed:', basResult?.error);
      }

    } catch (error) {
      console.error('Error loading tax calculations:', error);
      setError('Failed to load tax calculations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateGST = async () => {
    try {
      setLoading(true);
      const result = await taxService?.calculateGST(gstPeriod?.from, gstPeriod?.to);
      
      if (result?.success) {
        setGstData(result?.gstData);
        setError(null);
      } else {
        setError(`Failed to calculate GST: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error recalculating GST:', error);
      setError('Failed to calculate GST. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateIncomeTax = async () => {
    try {
      setLoading(true);
      const result = await taxService?.calculateCompanyIncomeTax(financialYear?.start, financialYear?.end);
      
      if (result?.success) {
        setIncomeTaxData(result?.incomeTaxData);
        setError(null);
      } else {
        setError(`Failed to calculate income tax: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error recalculating income tax:', error);
      setError('Failed to calculate income tax. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateSuper = async () => {
    try {
      setLoading(true);
      const result = await taxService?.calculateSuperannuation(superPeriod?.from, superPeriod?.to);
      
      if (result?.success) {
        setSuperData(result?.superData);
        setError(null);
      } else {
        setError(`Failed to calculate superannuation: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error recalculating superannuation:', error);
      setError('Failed to calculate superannuation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBAS = async () => {
    try {
      setLoading(true);
      const result = await taxService?.generateBAS(basQuarter?.quarter, basQuarter?.year);
      
      if (result?.success) {
        setBasData(result?.basData);
        setError(null);
      } else {
        setError(`Failed to generate BAS: ${result?.error}`);
      }
    } catch (error) {
      console.error('Error generating BAS:', error);
      setError('Failed to generate BAS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !gstData && !incomeTaxData && !superData && !basData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading tax calculations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <Icon name="AlertCircle" size={20} color="#EF4444" />
            <p className="ml-2 text-red-700">{error}</p>
            <button 
              onClick={loadAllCalculations}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {/* GST Calculation */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">GST Calculation</h3>
            <p className="text-sm text-text-secondary">Goods and Services Tax - Paid vs Owed</p>
          </div>
          <button
            onClick={handleRecalculateGST}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition disabled:opacity-50"
          >
            <Icon name="RefreshCw" size={16} color="white" />
            <span>Recalculate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">From Date</label>
            <input
              type="date"
              value={gstPeriod?.from}
              onChange={(e) => setGstPeriod(prev => ({ ...prev, from: e?.target?.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">To Date</label>
            <input
              type="date"
              value={gstPeriod?.to}
              onChange={(e) => setGstPeriod(prev => ({ ...prev, to: e?.target?.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {gstData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-success-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-success-700 mb-1">GST Collected</p>
                  <p className="text-2xl font-bold text-success-800">${gstData?.gstCollected?.toLocaleString()}</p>
                </div>
                <Icon name="TrendingUp" size={24} color="var(--color-success)" />
              </div>
            </div>
            
            <div className="bg-warning-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warning-700 mb-1">GST Paid</p>
                  <p className="text-2xl font-bold text-warning-800">${gstData?.gstPaid?.toLocaleString()}</p>
                </div>
                <Icon name="TrendingDown" size={24} color="var(--color-warning)" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${gstData?.netGstPosition >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${gstData?.netGstPosition >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                    Net GST Position
                  </p>
                  <p className={`text-2xl font-bold ${gstData?.netGstPosition >= 0 ? 'text-red-800' : 'text-green-800'}`}>
                    ${Math.abs(gstData?.netGstPosition)?.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {gstData?.netGstPosition >= 0 ? 'Amount Owed' : 'Refund Due'}
                  </p>
                </div>
                <Icon name="Calculator" size={24} color={gstData?.netGstPosition >= 0 ? "#EF4444" : "#10B981"} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-4">No GST data available. Please recalculate.</p>
        )}
      </div>
      {/* Company Income Tax */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Company Income Tax</h3>
            <p className="text-sm text-text-secondary">Corporate tax liability calculation</p>
          </div>
          <button
            onClick={handleRecalculateIncomeTax}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition disabled:opacity-50"
          >
            <Icon name="RefreshCw" size={16} color="white" />
            <span>Recalculate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Financial Year Start</label>
            <input
              type="date"
              value={financialYear?.start}
              onChange={(e) => setFinancialYear(prev => ({ ...prev, start: e?.target?.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Financial Year End</label>
            <input
              type="date"
              value={financialYear?.end}
              onChange={(e) => setFinancialYear(prev => ({ ...prev, end: e?.target?.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {incomeTaxData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="text-sm text-primary-700 mb-1">Total Income</p>
              <p className="text-xl font-bold text-primary-800">${incomeTaxData?.totalIncome?.toLocaleString()}</p>
            </div>
            
            <div className="bg-secondary-50 p-4 rounded-lg">
              <p className="text-sm text-secondary-700 mb-1">Deductible Expenses</p>
              <p className="text-xl font-bold text-secondary-800">${incomeTaxData?.totalExpenses?.toLocaleString()}</p>
            </div>
            
            <div className="bg-accent-50 p-4 rounded-lg">
              <p className="text-sm text-accent-700 mb-1">Taxable Income</p>
              <p className="text-xl font-bold text-accent-800">${incomeTaxData?.taxableIncome?.toLocaleString()}</p>
            </div>
            
            <div className="bg-warning-50 p-4 rounded-lg">
              <p className="text-sm text-warning-700 mb-1">Tax Liability ({incomeTaxData?.taxRate}%)</p>
              <p className="text-xl font-bold text-warning-800">${incomeTaxData?.incomeTaxLiability?.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-4">No income tax data available. Please recalculate.</p>
        )}
      </div>
      {/* Superannuation */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Superannuation Guarantee</h3>
            <p className="text-sm text-text-secondary">12% Super Guarantee calculation from payroll</p>
          </div>
          <button
            onClick={handleRecalculateSuper}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition disabled:opacity-50"
          >
            <Icon name="RefreshCw" size={16} color="white" />
            <span>Recalculate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">From Date</label>
            <input
              type="date"
              value={superPeriod?.from}
              onChange={(e) => setSuperPeriod(prev => ({ ...prev, from: e?.target?.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">To Date</label>
            <input
              type="date"
              value={superPeriod?.to}
              onChange={(e) => setSuperPeriod(prev => ({ ...prev, to: e?.target?.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {superData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total Wages</p>
                  <p className="text-2xl font-bold text-blue-800">${superData?.totalWages?.toLocaleString()}</p>
                </div>
                <Icon name="Users" size={24} color="#3B82F6" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Super Liability (12%)</p>
                  <p className="text-2xl font-bold text-green-800">${superData?.superLiability?.toLocaleString()}</p>
                </div>
                <Icon name="PiggyBank" size={24} color="var(--color-success)" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${superData?.netSuperPosition >= 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${superData?.netSuperPosition >= 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    Outstanding
                  </p>
                  <p className={`text-2xl font-bold ${superData?.netSuperPosition >= 0 ? 'text-red-800' : 'text-gray-800'}`}>
                    ${Math.abs(superData?.netSuperPosition)?.toLocaleString()}
                  </p>
                </div>
                <Icon name="AlertTriangle" size={24} color={superData?.netSuperPosition >= 0 ? "#EF4444" : "#6B7280"} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-4">No superannuation data available. Please recalculate.</p>
        )}
      </div>
      {/* BAS Calculation */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">BAS Calculation</h3>
            <p className="text-sm text-text-secondary">Business Activity Statement preparation</p>
          </div>
          <button
            onClick={handleGenerateBAS}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 nav-transition disabled:opacity-50"
          >
            <Icon name="FileText" size={16} color="white" />
            <span>Generate BAS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Quarter</label>
            <select
              value={basQuarter?.quarter}
              onChange={(e) => setBasQuarter(prev => ({ ...prev, quarter: parseInt(e?.target?.value) }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={1}>Quarter 1 (Jul-Sep)</option>
              <option value={2}>Quarter 2 (Oct-Dec)</option>
              <option value={3}>Quarter 3 (Jan-Mar)</option>
              <option value={4}>Quarter 4 (Apr-Jun)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Year</label>
            <input
              type="number"
              value={basQuarter?.year}
              onChange={(e) => setBasQuarter(prev => ({ ...prev, year: parseInt(e?.target?.value) }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              min="2020"
              max="2030"
            />
          </div>
        </div>

        {basData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-primary-700 mb-1">GST on Sales</p>
                <p className="text-xl font-bold text-primary-800">${basData?.gst?.gstCollected?.toLocaleString()}</p>
              </div>
              
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-700 mb-1">GST on Purchases</p>
                <p className="text-xl font-bold text-secondary-800">${basData?.gst?.gstPaid?.toLocaleString()}</p>
              </div>
              
              <div className="bg-accent-50 p-4 rounded-lg">
                <p className="text-sm text-accent-700 mb-1">Net GST</p>
                <p className="text-xl font-bold text-accent-800">${basData?.gst?.netGstPosition?.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total BAS Liability</p>
                  <p className="text-2xl font-bold text-green-800">${basData?.totalLiability?.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Due: {new Date(basData?.dueDate)?.toLocaleDateString()}</p>
                </div>
                <Icon name="FileCheck" size={32} color="var(--color-success)" />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-4">No BAS data available. Please generate calculation.</p>
        )}
      </div>
    </div>
  );
};

export default TaxCalculationModule;