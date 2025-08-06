import { supabase } from '../lib/supabase';

export const dashboardService = {
  // Get KPI data for dashboard
  async getKPIData() {
    try {
      // Get current month date range
      const now = new Date()
      const currentMonth = now?.toISOString()?.slice(0, 7) // YYYY-MM format
      const startOfMonth = `${currentMonth}-01`
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)?.toISOString()?.slice(0, 10)

      // Get previous month for comparison
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthStart = prevMonth?.toISOString()?.slice(0, 10)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)?.toISOString()?.slice(0, 10)

      // Fetch current month transactions
      const { data: currentTransactions, error: currentError } = await supabase?.from('transactions')?.select('amount, transaction_type, status')?.gte('transaction_date', startOfMonth)?.lte('transaction_date', endOfMonth)?.eq('status', 'completed')

      if (currentError) {
        return { success: false, error: currentError?.message };
      }

      // Fetch previous month transactions for comparison
      const { data: prevTransactions, error: prevError } = await supabase?.from('transactions')?.select('amount, transaction_type, status')?.gte('transaction_date', prevMonthStart)?.lte('transaction_date', prevMonthEnd)?.eq('status', 'completed')

      if (prevError) {
        return { success: false, error: prevError?.message };
      }

      // Calculate current month metrics
      let currentIncome = 0
      let currentExpenses = 0
      
      currentTransactions?.forEach(t => {
        if (t?.transaction_type === 'income') {
          currentIncome += parseFloat(t?.amount)
        } else if (t?.transaction_type === 'expense') {
          currentExpenses += Math.abs(parseFloat(t?.amount))
        }
      })

      // Calculate previous month metrics
      let prevIncome = 0
      let prevExpenses = 0
      
      prevTransactions?.forEach(t => {
        if (t?.transaction_type === 'income') {
          prevIncome += parseFloat(t?.amount)
        } else if (t?.transaction_type === 'expense') {
          prevExpenses += Math.abs(parseFloat(t?.amount))
        }
      })

      // Get outstanding invoices (income transactions that are pending)
      const { data: outstandingInvoices, error: invoiceError } = await supabase?.from('transactions')?.select('amount')?.eq('transaction_type', 'income')?.eq('status', 'pending')

      if (invoiceError) {
        return { success: false, error: invoiceError?.message };
      }

      const outstandingAmount = outstandingInvoices?.reduce((sum, t) => sum + parseFloat(t?.amount), 0) || 0

      // Calculate percentage changes
      const cashFlowChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome * 100) : 0
      const outstandingChange = prevIncome > 0 ? ((outstandingAmount - prevIncome) / prevIncome * 100) : 0
      const revenueChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome * 100) : 0

      // Calculate cash flow (net income)
      const cashFlow = currentIncome - currentExpenses

      const kpiData = [
        {
          id: 1,
          title: "Cash Flow",
          value: `$${cashFlow?.toLocaleString()}`,
          change: `${cashFlowChange >= 0 ? '+' : ''}${cashFlowChange?.toFixed(1)}%`,
          trend: cashFlowChange >= 0 ? "up" : "down",
          icon: "TrendingUp",
          color: cashFlowChange >= 0 ? "success" : "warning",
          description: "Current month vs previous"
        },
        {
          id: 2,
          title: "Outstanding Invoices",
          value: `$${outstandingAmount?.toLocaleString()}`,
          change: `${outstandingChange >= 0 ? '+' : ''}${outstandingChange?.toFixed(1)}%`,
          trend: outstandingChange <= 0 ? "down" : "up",
          icon: "FileText",
          color: "warning",
          description: "Pending client payments"
        },
        {
          id: 3,
          title: "Monthly Revenue",
          value: `$${currentIncome?.toLocaleString()}`,
          change: `${revenueChange >= 0 ? '+' : ''}${revenueChange?.toFixed(1)}%`,
          trend: revenueChange >= 0 ? "up" : "down",
          icon: "DollarSign",
          color: "secondary",
          description: "Total revenue this month"
        },
        {
          id: 4,
          title: "Compliance Status",
          value: "98.5%",
          change: "+2.1%",
          trend: "up",
          icon: "Shield",
          color: "primary",
          description: "Tax compliance score"
        }
      ]

      return { success: true, kpiData }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        }
      }
      
      console.error('Dashboard service error:', error)
      return { success: false, error: 'Failed to load KPI data.' }
    }
  },

  // Get revenue trends data for charts
  async getRevenueTrends(months = 6) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate?.setMonth(endDate?.getMonth() - months)

      const { data, error } = await supabase?.from('transactions')?.select('amount, transaction_type, transaction_date')?.gte('transaction_date', startDate?.toISOString()?.slice(0, 10))?.lte('transaction_date', endDate?.toISOString()?.slice(0, 10))?.eq('status', 'completed')?.order('transaction_date', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      // Group by month
      const monthlyData = {}
      
      data?.forEach(transaction => {
        const month = transaction?.transaction_date?.slice(0, 7) // YYYY-MM
        const monthName = new Date(month + '-01')?.toLocaleDateString('en-US', { month: 'short' })
        
        if (!monthlyData?.[monthName]) {
          monthlyData[monthName] = { month: monthName, revenue: 0, expenses: 0, profit: 0 }
        }

        if (transaction?.transaction_type === 'income') {
          monthlyData[monthName].revenue += parseFloat(transaction?.amount)
        } else if (transaction?.transaction_type === 'expense') {
          monthlyData[monthName].expenses += Math.abs(parseFloat(transaction?.amount))
        }
      })

      // Calculate profit and convert to array
      const revenueData = Object.values(monthlyData)?.map(month => ({
        ...month,
        profit: month?.revenue - month?.expenses
      }))

      return { success: true, revenueData }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch revenue trends.' 
        }
      }
      
      console.error('Dashboard service error:', error)
      return { success: false, error: 'Failed to load revenue trends.' }
    }
  },

  // Get expense breakdown data
  async getExpenseBreakdown() {
    try {
      const now = new Date()
      const startOfMonth = `${now?.toISOString()?.slice(0, 7)}-01`
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)?.toISOString()?.slice(0, 10)

      const { data, error } = await supabase?.from('transactions')?.select('amount, category')?.eq('transaction_type', 'expense')?.eq('status', 'completed')?.gte('transaction_date', startOfMonth)?.lte('transaction_date', endOfMonth)

      if (error) {
        return { success: false, error: error?.message };
      }

      // Group by category
      const categoryData = {}
      const colors = ['#283593', '#2196F3', '#FF9800', '#4CAF50', '#FFC107', '#E91E63']
      let colorIndex = 0

      data?.forEach(transaction => {
        const category = transaction?.category || 'Other'
        if (!categoryData?.[category]) {
          categoryData[category] = {
            category,
            amount: 0,
            color: colors?.[colorIndex % colors?.length]
          }
          colorIndex++
        }
        categoryData[category].amount += Math.abs(parseFloat(transaction?.amount))
      })

      const expenseData = Object.values(categoryData)

      return { success: true, expenseData }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch expense breakdown.' 
        }
      }
      
      console.error('Dashboard service error:', error)
      return { success: false, error: 'Failed to load expense breakdown.' }
    }
  },

  // Get cash flow data
  async getCashFlowData(weeks = 5) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate?.setDate(endDate?.getDate() - (weeks * 7))

      const { data, error } = await supabase?.from('transactions')?.select('amount, transaction_type, transaction_date')?.gte('transaction_date', startDate?.toISOString()?.slice(0, 10))?.lte('transaction_date', endDate?.toISOString()?.slice(0, 10))?.eq('status', 'completed')?.order('transaction_date', { ascending: true })

      if (error) {
        return { success: false, error: error?.message };
      }

      // Group by week
      const weeklyData = {}
      
      data?.forEach(transaction => {
        const date = new Date(transaction.transaction_date)
        const weekStart = new Date(date)
        weekStart?.setDate(date?.getDate() - date?.getDay()) // Start of week (Sunday)
        const weekKey = weekStart?.toISOString()?.slice(0, 10)
        
        if (!weeklyData?.[weekKey]) {
          weeklyData[weekKey] = { date: weekKey, inflow: 0, outflow: 0 }
        }

        if (transaction?.transaction_type === 'income') {
          weeklyData[weekKey].inflow += parseFloat(transaction?.amount)
        } else if (transaction?.transaction_type === 'expense') {
          weeklyData[weekKey].outflow += Math.abs(parseFloat(transaction?.amount))
        }
      })

      const cashFlowData = Object.values(weeklyData)

      return { success: true, cashFlowData }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch cash flow data.' 
        }
      }
      
      console.error('Dashboard service error:', error)
      return { success: false, error: 'Failed to load cash flow data.' }
    }
  },

  // Get recent activity
  async getRecentActivity(limit = 10) {
    try {
      const { data, error } = await supabase?.from('activity_logs')?.select(`
          id,
          action,
          entity_type,
          entity_id,
          details,
          created_at,
          user:user_profiles(full_name, email, avatar_url)
        `)?.order('created_at', { ascending: false })?.limit(limit)

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, activities: data || [] }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch recent activity.' 
        }
      }
      
      console.error('Dashboard service error:', error)
      return { success: false, error: 'Failed to load recent activity.' }
    }
  },

  // Get pending tasks (simplified version)
  async getPendingTasks() {
    try {
      // Get pending transactions
      const { data: pendingTransactions, error: transError } = await supabase?.from('transactions')?.select('id, description, amount, transaction_date')?.eq('status', 'pending')?.order('transaction_date', { ascending: true })?.limit(5)

      if (transError) {
        return { success: false, error: transError?.message };
      }

      // Get pending tax filings
      const { data: pendingTaxFilings, error: taxError } = await supabase?.from('tax_filings')?.select('id, filing_period, tax_type, due_date')?.eq('status', 'pending_review')?.order('due_date', { ascending: true })?.limit(3)

      if (taxError) {
        return { success: false, error: taxError?.message };
      }

      const tasks = [
        ...(pendingTransactions?.map(t => ({
          id: `transaction-${t?.id}`,
          title: `Review: ${t?.description}`,
          type: 'transaction',
          priority: 'medium',
          dueDate: t?.transaction_date,
          amount: t?.amount
        })) || []),
        ...(pendingTaxFilings?.map(f => ({
          id: `tax-${f?.id}`,
          title: `${f?.tax_type} - ${f?.filing_period}`,
          type: 'tax_filing',
          priority: 'high',
          dueDate: f?.due_date
        })) || [])
      ]

      return { success: true, tasks }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch pending tasks.' 
        }
      }
      
      console.error('Dashboard service error:', error)
      return { success: false, error: 'Failed to load pending tasks.' }
    }
  }
}