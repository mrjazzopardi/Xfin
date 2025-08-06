import React, { useState } from 'react';

export function ExportPanel({ onExport }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const exportFormats = [
    {
      value: 'csv',
      label: 'CSV',
      description: 'Comma-separated values file compatible with Excel',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'JavaScript Object Notation for data processing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      await onExport?.(exportFormat);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowExportModal(true)}
        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export</span>
      </button>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Export Change Requests</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={exporting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Export Format Selection */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900">Select Export Format</h4>
                
                <div className="space-y-3">
                  {exportFormats?.map((format) => (
                    <label key={format?.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format?.value}
                        checked={exportFormat === format?.value}
                        onChange={(e) => setExportFormat(e?.target?.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                        disabled={exporting}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {format?.icon}
                          <span className="font-medium text-gray-900">{format?.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{format?.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Export Information</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Export includes all filtered change requests</li>
                      <li>• Data includes request details, status, and metadata</li>
                      <li>• Files will be downloaded automatically</li>
                      <li>• Export respects current filter settings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Preview */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Data Included:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• Request ID</div>
                  <div>• Title & Description</div>
                  <div>• Category & Priority</div>
                  <div>• Status & Progress</div>
                  <div>• Created By</div>
                  <div>• Assigned To</div>
                  <div>• Created Date</div>
                  <div>• Updated Date</div>
                  <div>• Completed Date</div>
                  <div>• Tags</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={exporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {exporting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{exporting ? 'Exporting...' : `Export ${exportFormat?.toUpperCase()}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}