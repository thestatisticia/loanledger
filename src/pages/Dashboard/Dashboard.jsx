import useLoanStore from '../../store/useLoanStore';
import { formatCurrency, formatPercentage } from '../../utils/calculations';
import { formatDate } from '../../utils/dateHelpers';
import { getStatusColor, getStatusText, getStatusBadgeClasses, getColorBgClasses, getColorTextClasses } from '../../utils/loanHelpers';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const { getFilteredLoans, getPortfolioStats, alerts, setFilters } = useLoanStore();
  const navigate = useNavigate();
  
  const loans = getFilteredLoans();
  const stats = getPortfolioStats();
  const recentLoans = loans.slice(0, 5);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 5);

  const handleStatCardClick = (statusFilter) => {
    if (statusFilter) {
      // Set the filter and navigate to loans page
      setFilters({ status: [statusFilter] });
    } else {
      // Clear status filter to show all loans
      setFilters({ status: [] });
    }
    navigate('/loans');
  };

  const statCards = [
    {
      label: 'Total Portfolio',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'blue',
      onClick: () => handleStatCardClick(null), // Show all loans
      clickable: true
    },
    {
      label: 'Active Loans',
      value: stats.activeLoans,
      icon: TrendingUp,
      color: 'green',
      onClick: () => handleStatCardClick('on_track'), // Filter by on_track status
      clickable: true
    },
    {
      label: 'At Risk',
      value: stats.atRiskLoans,
      icon: AlertTriangle,
      color: 'yellow',
      onClick: () => handleStatCardClick('at_risk'), // Filter by at_risk status
      clickable: true
    },
    {
      label: 'Overdue',
      value: stats.overdueLoans,
      icon: AlertTriangle,
      color: 'red',
      onClick: () => handleStatCardClick('overdue'), // Filter by overdue status
      clickable: true
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-900">Dashboard</h2>
        <div className="text-base text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const CardContent = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-full ${getColorBgClasses(stat.color)}`}>
                <Icon className={getColorTextClasses(stat.color)} size={28} />
              </div>
            </div>
          );

          if (stat.clickable) {
            return (
              <button
                key={index}
                onClick={stat.onClick}
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer text-left w-full group relative"
                title={`Click to view ${stat.label.toLowerCase()}`}
              >
                {CardContent}
                <ArrowRight 
                  className="absolute top-4 right-4 text-gray-400 group-hover:text-blue-600 transition-colors" 
                  size={18} 
                />
              </button>
            );
          }

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              {CardContent}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Recent Loans</h3>
              <Link
                to="/loans"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentLoans.length > 0 ? (
              recentLoans.map((loan) => (
                <Link
                  key={loan.id}
                  to={`/loans/${loan.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 text-base">{loan.borrower}</h4>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClasses(loan.status)}`}
                        >
                          {getStatusText(loan.status)}
                        </span>
                      </div>
                      <p className="text-base text-gray-600 mt-1">
                        {formatCurrency(loan.amount)} • {formatPercentage(loan.interestRate)} APR
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base text-gray-500">
                        Due: {formatDate(loan.endDate)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No loans found</div>
            )}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Critical Alerts</h3>
              <Link
                to="/alerts"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {criticalAlerts.length > 0 ? (
              criticalAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to={alert.actionUrl || '#'}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100' :
                      alert.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                    }`}>
                      <AlertTriangle
                        className={`${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                        }`}
                        size={16}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-base">{alert.title}</h4>
                      <p className="text-base text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(alert.date, 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <p>No critical alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

