// Export utilities for various data formats
export const exportUtils = {
  // Export data to CSV format
  exportToCSV: (data, filename = 'export.csv') => {
    if (!data?.length) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data?.[0]);
    const csvContent = [
      headers?.join(','),
      ...data?.map(row => headers?.map(header => {
        const value = row?.[header];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value?.includes(',') || value?.includes('"'))) {
          return `"${value?.replace(/"/g, '""')}"`;
        }
        return value || '';
      })?.join(','))
    ]?.join('\n');

    downloadFile(csvContent, filename, 'text/csv');
  },

  // Export data to Excel format (basic CSV with .xlsx extension)
  exportToExcel: (data, filename = 'export.xlsx') => {
    exportUtils?.exportToCSV(data, filename);
  },

  // Export data to PDF (using browser print functionality)
  exportToPDF: (elementId, filename = 'export.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) {
      alert('Content not found for PDF export');
      return;
    }

    // Create a new window with print-optimized styles
    const newWindow = window.open('', '_blank');
    newWindow?.document?.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename?.replace('.pdf', '')}</h1>
            <p>Generated on ${new Date()?.toLocaleDateString()}</p>
          </div>
          ${element?.innerHTML}
          <button class="no-print" onClick="window.print()" style="margin: 20px 0; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print/Save as PDF</button>
        </body>
      </html>
    `);
    newWindow?.document?.close();
  },

  // Print current page
  printPage: () => {
    window.print();
  },

  // Generate financial report data for export
  generateReportData: (reportType, data, filters) => {
    const timestamp = new Date()?.toISOString()?.split('T')?.[0];
    
    switch (reportType) {
      case 'profit-loss':
        return {
          filename: `profit-loss-statement-${timestamp}.csv`,
          data: data?.sections?.flatMap(section => 
            section?.items?.map(item => ({
              Section: section?.name,
              Account: item?.account,
              Amount: item?.amount,
              Percentage: item?.percentage + '%',
              Period: data?.period
            }))
          ) || []
        };
      
      case 'balance-sheet':
        return {
          filename: `balance-sheet-${timestamp}.csv`,
          data: data?.sections?.flatMap(section =>
            section?.subsections ? 
              section?.subsections?.flatMap(subsection =>
                subsection?.items?.map(item => ({
                  Category: section?.name,
                  Subcategory: subsection?.name,
                  Account: item?.account,
                  Amount: item?.amount,
                  Date: data?.period
                }))
              ) :
              section?.items?.map(item => ({
                Category: section?.name,
                Subcategory: '',
                Account: item?.account,
                Amount: item?.amount,
                Date: data?.period
              }))
          ) || []
        };
      
      case 'transactions':
        return {
          filename: `transactions-${timestamp}.csv`,
          data: data?.map(transaction => ({
            Date: transaction?.date,
            Description: transaction?.description,
            Account: transaction?.account,
            'Account Code': transaction?.accountCode,
            Debit: transaction?.debit || 0,
            Credit: transaction?.credit || 0,
            Type: transaction?.type,
            Status: transaction?.status,
            Reference: transaction?.reference,
            Category: transaction?.category
          })) || []
        };
      
      default:
        return {
          filename: `${reportType}-${timestamp}.csv`,
          data: Array.isArray(data) ? data : []
        };
    }
  }
};

// Helper function to download file
const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL?.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body?.appendChild(link);
  link?.click();
  document.body?.removeChild(link);
  window.URL?.revokeObjectURL(url);
};

export default exportUtils;