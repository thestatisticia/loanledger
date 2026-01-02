import { usePrivy } from '@privy-io/react-auth';
import useLoanStore from '../../store/useLoanStore';
import { formatCurrency, formatPercentage } from '../../utils/calculations';
import { formatDate } from '../../utils/dateHelpers';
import { getStatusText, getStatusBadgeClasses } from '../../utils/loanHelpers';
import { Link } from 'react-router-dom';
import { User, Mail, Calendar, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Profile = () => {
  const { user, ready } = usePrivy();
  const { getLoans, getLoansByBorrower, getPortfolioStats } = useLoanStore();
  
  // Get user's email and name for borrower matching
  const userEmail = user?.email?.address || user?.google?.email || '';
  const userName = user?.google?.name || userEmail.split('@')[0] || '';
  
  // Get loans where this user is the borrower (by email/name match)
  const borrowerLoans = getLoansByBorrower(userEmail, userName);
  
  // Also get all loans managed by this company/user
  const managedLoans = getLoans();
  
  // For profile, show borrower loans if available, otherwise show managed loans
  const loans = borrowerLoans.length > 0 ? borrowerLoans : managedLoans;
  const stats = getPortfolioStats();

  const getUserDisplayName = () => {
    if (user?.email?.address) {
      return user.email.address;
    }
    if (user?.google?.name) return user.google.name;
    return 'User';
  };

  const getUserEmail = () => {
    if (user?.email?.address) return user.email.address;
    if (user?.google?.email) return user.google.email;
    return 'Not provided';
  };

  const getAccountCreatedDate = () => {
    // Privy doesn't expose creation date directly, so we'll use a placeholder
    // In a real app, you'd store this when the user first logs in
    return 'Account active';
  };

  // Calculate loan statistics
  const loanStats = {
    total: loans.length,
    onTrack: loans.filter(l => l.status === 'on_track').length,
    atRisk: loans.filter(l => l.status === 'at_risk').length,
    overdue: loans.filter(l => l.status === 'overdue').length,
    paidOff: loans.filter(l => l.status === 'paid_off').length,
    defaulted: loans.filter(l => l.status === 'defaulted').length,
  };

  // Get upcoming payments (next 30 days)
  const upcomingPayments = loans.flatMap(loan => 
    loan.paymentSchedule
      .filter(payment => {
        if (payment.status !== 'pending') return false;
        const dueDate = new Date(payment.dueDate);
        const today = new Date();
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 30;
      })
      .map(payment => ({
        ...payment,
        loanId: loan.id,
        borrower: loan.borrower,
        daysUntil: Math.ceil((new Date(payment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
  ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Get overdue payments
  const overduePayments = loans.flatMap(loan => 
    loan.paymentSchedule
      .filter(payment => payment.status === 'overdue')
      .map(payment => ({
        ...payment,
        loanId: loan.id,
        borrower: loan.borrower
      }))
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
            {getUserDisplayName().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{getUserDisplayName()}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail size={16} />
                <span>{getUserEmail()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>{getAccountCreatedDate()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Loans</p>
            <p className="text-2xl font-bold text-gray-900">{loanStats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">On Track</p>
            <p className="text-2xl font-bold text-green-700">{loanStats.onTrack}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">At Risk</p>
            <p className="text-2xl font-bold text-yellow-700">{loanStats.atRisk}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-700">{loanStats.overdue}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Portfolio Value</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Active Loans</p>
            <p className="text-xl font-bold text-gray-900">{stats.activeLoans}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Paid Off</p>
            <p className="text-xl font-bold text-green-700">{loanStats.paidOff}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Clock className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Payments (Next 30 Days)</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingPayments.slice(0, 10).map((payment) => (
              <Link
                key={payment.id}
                to={`/loans/${payment.loanId}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{payment.borrower}</h4>
                      <span className="text-sm text-gray-500">
                        {payment.daysUntil === 0 ? 'Due today' : `${payment.daysUntil} day${payment.daysUntil !== 1 ? 's' : ''} away`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Due: {formatDate(payment.dueDate)} • Amount: {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Due Soon
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {upcomingPayments.length > 10 && (
            <div className="p-4 text-center border-t border-gray-200">
              <Link
                to="/loans"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all {upcomingPayments.length} upcoming payments
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Overdue Payments */}
      {overduePayments.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="text-red-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Overdue Payments</h2>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                {overduePayments.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {overduePayments.map((payment) => (
              <Link
                key={payment.id}
                to={`/loans/${payment.loanId}`}
                className="block p-4 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{payment.borrower}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Due: {formatDate(payment.dueDate)} • Amount: {formatCurrency(payment.amount)}
                    </p>
                    {payment.paidDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Was due on {formatDate(payment.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                      Overdue
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Loans */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">All Your Loans</h2>
            </div>
            <Link
              to="/loans"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {loans.length > 0 ? (
            loans.slice(0, 10).map((loan) => (
              <Link
                key={loan.id}
                to={`/loans/${loan.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{loan.borrower}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClasses(loan.status)}`}>
                        {getStatusText(loan.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-500">Amount:</span> {formatCurrency(loan.amount)}
                      </div>
                      <div>
                        <span className="text-gray-500">Rate:</span> {formatPercentage(loan.interestRate)}
                      </div>
                      <div>
                        <span className="text-gray-500">Term:</span> {loan.term} months
                      </div>
                      <div>
                        <span className="text-gray-500">Risk Score:</span> {loan.riskScore}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Start: {formatDate(loan.startDate)}</span>
                      <span className="ml-4">End: {formatDate(loan.endDate)}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Progress</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(loan.paymentSchedule.filter(p => p.status === 'paid').length / loan.paymentSchedule.length) * 100}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {loan.paymentSchedule.filter(p => p.status === 'paid').length} / {loan.paymentSchedule.length} payments
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <FileText className="mx-auto mb-2 text-gray-400" size={48} />
              <p>No loans yet. Create your first loan to get started!</p>
              <Link
                to="/loans/new"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Loan
              </Link>
            </div>
          )}
        </div>
        {loans.length > 10 && (
          <div className="p-4 text-center border-t border-gray-200">
            <Link
              to="/loans"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all {loans.length} loans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

