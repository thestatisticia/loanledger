import { useState, useEffect } from 'react';
import useLoanStore from '../../store/useLoanStore';
import { formatCurrency, formatPercentage } from '../../utils/calculations';
import { formatDate } from '../../utils/dateHelpers';
import { getStatusColor, getStatusText, getStatusBadgeClasses } from '../../utils/loanHelpers';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';

const LoansList = () => {
  const { getLoans, filters, setFilters, resetFilters } = useLoanStore();
  const loans = getLoans(); // Get user-filtered loans
  // Auto-show filters if any status filters are active
  const [showFilters, setShowFilters] = useState(filters.status.length > 0);

  const statusOptions = ['on_track', 'at_risk', 'overdue', 'paid_off', 'defaulted'];
  const uniqueBorrowers = [...new Set(loans.map(loan => loan.borrower))];

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const filteredLoans = loans.filter(loan => {
    if (filters.status.length > 0 && !filters.status.includes(loan.status)) return false;
    if (filters.borrowers.length > 0 && !filters.borrowers.includes(loan.borrower)) return false;
    if (filters.searchQuery && !loan.borrower.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-900">All Loans</h2>
        <Link
          to="/loans/new"
          className="flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
        >
          <Plus size={20} />
          <span>Add New Loan</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search loans by borrower name..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-base"
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {statusOptions.map(status => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter(s => s !== status);
                        handleFilterChange('status', newStatus);
                      }}
                      className="rounded border-gray-300 w-4 h-4"
                    />
                    <span className="text-base text-gray-700">{getStatusText(status)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Borrower</label>
              <select
                value={filters.borrowers[0] || ''}
                onChange={(e) => handleFilterChange('borrowers', e.target.value ? [e.target.value] : [])}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">All Borrowers</option>
                {uniqueBorrowers.map(borrower => (
                  <option key={borrower} value={borrower}>{borrower}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-5 py-3 text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Interest Rate
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base font-medium text-gray-900">{loan.borrower}</div>
                      <div className="text-sm text-gray-500">{loan.id}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-900">{formatCurrency(loan.amount)}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-900">{formatPercentage(loan.interestRate)}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClasses(loan.status)}`}
                      >
                        {getStatusText(loan.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-900">{formatDate(loan.endDate)}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base text-gray-900">{loan.riskScore}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-base font-medium">
                      <Link
                        to={`/loans/${loan.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-5 text-center text-base text-gray-500">
                    No loans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoansList;

