import { useState, useRef, useEffect } from 'react';
import { Download, Upload, RotateCcw, Trash2, Database, CheckCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { resetToMockData, exportLoanData, importLoanData, clearAllData, getDataStats } from '../../utils/dataManagement';
import { importLoansFromFile } from '../../utils/fileImport';
import { importAndUpdateLoansFromFile } from '../../utils/bulkUpdate';
import useLoanStore from '../../store/useLoanStore';
import { usePrivy } from '@privy-io/react-auth';
import { getUserIdentifier } from '../../utils/userData';

const DataManagement = () => {
  const { user, ready } = usePrivy();
  const { currentUserId } = useLoanStore();
  const userIdentifier = ready && user ? getUserIdentifier(user) : currentUserId;
  
  const [stats, setStats] = useState(() => getDataStats(userIdentifier));
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);
  const csvExcelInputRef = useRef(null);
  const bulkUpdateInputRef = useRef(null);

  useEffect(() => {
    if (userIdentifier) {
      setStats(getDataStats(userIdentifier));
    }
  }, [userIdentifier]);

  const refreshStats = () => {
    if (userIdentifier) {
      setStats(getDataStats(userIdentifier));
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleResetToMock = () => {
    if (!userIdentifier) {
      showMessage('error', 'Please log in to manage data');
      return;
    }
    
    if (window.confirm('This will replace all existing loans with fresh mock data. Continue?')) {
      setIsLoading(true);
      try {
        resetToMockData(userIdentifier);
        refreshStats();
        showMessage('success', 'Successfully reset to mock data!');
        // Reload page to refresh all components
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        showMessage('error', `Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExport = () => {
    if (!userIdentifier) {
      showMessage('error', 'Please log in to export data');
      return;
    }
    
    setIsLoading(true);
    try {
      const exported = exportLoanData(userIdentifier);
      if (exported) {
        showMessage('success', `Exported ${exported.loanCount} loans successfully!`);
      } else {
        showMessage('error', 'No data to export');
      }
    } catch (error) {
      showMessage('error', `Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event) => {
    if (!userIdentifier) {
      showMessage('error', 'Please log in to import data');
      return;
    }
    
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await importLoanData(file, userIdentifier);
      refreshStats();
      showMessage('success', `Successfully imported ${result.imported} loans!`);
      // Reload page to refresh all components
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showMessage('error', `Import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCSVExcelImport = async (event) => {
    if (!userIdentifier) {
      showMessage('error', 'Please log in to import data');
      return;
    }
    
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setImportResults(null);
    try {
      const result = await importLoansFromFile(file, userIdentifier);
      refreshStats();
      const message = result.skipped > 0
        ? `Successfully imported ${result.imported} new loans! ${result.skipped} duplicate(s) skipped.`
        : `Successfully imported ${result.imported} loans!`;
      showMessage('success', message);
      // Reload page to refresh all components
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showMessage('error', `Import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (csvExcelInputRef.current) {
        csvExcelInputRef.current.value = '';
      }
    }
  };

  const handleBulkUpdate = async (event) => {
    if (!userIdentifier) {
      showMessage('error', 'Please log in to update data');
      return;
    }
    
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setImportResults(null);
    try {
      const result = await importAndUpdateLoansFromFile(file, userIdentifier);
      refreshStats();
      
      // Show detailed results
      setImportResults(result);
      
      const message = `Updated ${result.updated} existing loans and created ${result.created} new loans! Total: ${result.total} loans.`;
      showMessage('success', message);
      
      // Reload page to refresh all components
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      // Show detailed error message
      const errorMsg = error.message || 'Unknown error occurred';
      showMessage('error', `Bulk update failed: ${errorMsg}`);
      console.error('Bulk update error:', error);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (bulkUpdateInputRef.current) {
        bulkUpdateInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    if (!userIdentifier) {
      showMessage('error', 'Please log in to clear data');
      return;
    }
    
    if (window.confirm('This will DELETE ALL loan data permanently. This cannot be undone. Continue?')) {
      if (window.confirm('Are you absolutely sure? All loans will be lost.')) {
        setIsLoading(true);
        try {
          clearAllData(userIdentifier);
          refreshStats();
          showMessage('success', 'All data cleared. Reloading...');
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          showMessage('error', `Error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
        <p className="text-gray-600">Manage your loan data for testing and development</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Statistics Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Current Data</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Loan Count</p>
            <p className="text-2xl font-bold text-gray-900">{stats.loanCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.hasData ? 'Active' : 'Empty'}
            </p>
          </div>
        </div>
        <button
          onClick={refreshStats}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh Stats
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reset to Mock Data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <RotateCcw className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Reset to Mock Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Replace all existing loans with fresh sample data (12 loans with realistic payment schedules and obligations).
          </p>
          <button
            onClick={handleResetToMock}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Reset to Mock Data'}
          </button>
        </div>

        {/* Export Data */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download all loan data as a JSON file for backup or migration.
          </p>
          <button
            onClick={handleExport}
            disabled={isLoading || !stats.hasData}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Exporting...' : 'Export to JSON'}
          </button>
        </div>

        {/* Import Data (JSON) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Import JSON</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Import loan data from a previously exported JSON file.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
            disabled={isLoading}
          />
          <label
            htmlFor="import-file"
            className={`w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer inline-block text-center ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Importing...' : 'Choose JSON File'}
          </label>
        </div>

        {/* Import CSV/Excel (Add New Only) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="text-orange-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Import CSV/Excel (New Loans)</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Import new loans from CSV or Excel files. Skips duplicates. Required columns: borrower, amount, interestRate, term, startDate.
          </p>
          <input
            ref={csvExcelInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleCSVExcelImport}
            className="hidden"
            id="import-csv-excel"
            disabled={isLoading}
          />
          <label
            htmlFor="import-csv-excel"
            className={`w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer inline-block text-center ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Importing...' : 'Choose CSV/Excel File'}
          </label>
          <p className="text-xs text-gray-500 mt-2">
            CSV format: borrower,amount,interestRate,term,startDate,endDate,borrowerEmail,borrowerPhone,loanOfficer
          </p>
        </div>

        {/* Bulk Update (Update Existing + Add New) */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <RefreshCw className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Bulk Update & Import</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Smart Update:</strong> Matches existing loans by borrower email/name and updates them. Creates new loans for new borrowers. Automatically recalculates loan statuses.
          </p>
          <input
            ref={bulkUpdateInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleBulkUpdate}
            className="hidden"
            id="bulk-update-file"
            disabled={isLoading}
          />
          <label
            htmlFor="bulk-update-file"
            className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block text-center font-medium ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Updating...' : 'Choose File to Update & Import'}
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Matches by: borrowerEmail (preferred) or borrower name. Updates existing loans or creates new ones.
          </p>
          
          {/* Show import results */}
          {importResults && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Update Results:</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>✓ Updated: {importResults.updated} existing loans</p>
                <p>✓ Created: {importResults.created} new loans</p>
                {importResults.errors > 0 && (
                  <p className="text-red-600">⚠ Errors: {importResults.errors} loans</p>
                )}
                <p className="font-medium mt-2">Total loans: {importResults.total}</p>
              </div>
            </div>
          )}
        </div>

        {/* Clear All Data */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trash2 className="text-red-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Clear All Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-semibold text-red-600">Warning:</span> This will permanently delete all loan data. Make sure to export first if you want to keep a backup.
          </p>
          <button
            onClick={handleClear}
            disabled={isLoading || !stats.hasData}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Clearing...' : 'Clear All Data'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">About Data Storage</h4>
        <p className="text-sm text-blue-800">
          All loan data is stored in your browser's localStorage. This means:
        </p>
        <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
          <li>Data persists between browser sessions</li>
          <li>Data is specific to this browser/device</li>
          <li>Clearing browser data will remove all loans</li>
          <li>Export your data regularly for backups</li>
        </ul>
      </div>
    </div>
  );
};

export default DataManagement;

