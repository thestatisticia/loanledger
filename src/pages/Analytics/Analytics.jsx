import useLoanStore from '../../store/useLoanStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/calculations';

const Analytics = () => {
  const { getLoans, getPortfolioStats } = useLoanStore();
  const loans = getLoans(); // Get user-filtered loans
  const stats = getPortfolioStats();

  // Status distribution data
  const statusData = [
    { name: 'On Track', value: loans.filter(l => l.status === 'on_track').length, color: '#10b981' },
    { name: 'At Risk', value: loans.filter(l => l.status === 'at_risk').length, color: '#f59e0b' },
    { name: 'Overdue', value: loans.filter(l => l.status === 'overdue').length, color: '#f97316' },
    { name: 'Paid Off', value: loans.filter(l => l.status === 'paid_off').length, color: '#3b82f6' },
    { name: 'Defaulted', value: loans.filter(l => l.status === 'defaulted').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Loan amounts by borrower
  const borrowerData = loans
    .slice(0, 10)
    .map(loan => ({
      name: loan.borrower.length > 15 ? loan.borrower.substring(0, 15) + '...' : loan.borrower,
      amount: loan.amount
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold text-gray-900">Analytics</h2>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-500 mb-2">Total Portfolio Value</h3>
          <p className="text-4xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-500 mb-2">Active Loans</h3>
          <p className="text-4xl font-bold text-gray-900">{stats.activeLoans}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-500 mb-2">Weighted Avg Interest</h3>
          <p className="text-4xl font-bold text-gray-900">{stats.weightedAvgInterest}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Loan Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Loan Amounts Bar Chart */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Loans by Amount</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={borrowerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

