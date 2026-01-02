import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useLoanStore from '../../store/useLoanStore';
import { formatCurrency, formatPercentage } from '../../utils/calculations';
import { formatDate } from '../../utils/dateHelpers';
import { getStatusColor, getStatusText, getStatusBadgeClasses } from '../../utils/loanHelpers';
import { ArrowLeft, Check, X } from 'lucide-react';
import Communication from '../../components/Communication/Communication';

const LoanDetail = () => {
  const { id } = useParams();
  const { getLoan, updatePaymentStatus, loans } = useLoanStore();
  const [updatingPayment, setUpdatingPayment] = useState(null);
  
  // Get loan from store - will update when store changes
  const loan = getLoan(id);

  const handleMarkPaymentPaid = (paymentId) => {
    if (!window.confirm('Mark this payment as paid?')) return;
    
    setUpdatingPayment(paymentId);
    const paidDate = new Date().toISOString().split('T')[0];
    updatePaymentStatus(id, paymentId, 'paid', paidDate);
    
    // Clear updating state after a short delay
    setTimeout(() => {
      setUpdatingPayment(null);
    }, 500);
  };

  const handleMarkPaymentOverdue = (paymentId) => {
    if (!window.confirm('Mark this payment as overdue?')) return;
    
    setUpdatingPayment(paymentId);
    updatePaymentStatus(id, paymentId, 'overdue', null);
    
    // Clear updating state after a short delay
    setTimeout(() => {
      setUpdatingPayment(null);
    }, 500);
  };

  if (!loan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loan not found</p>
        <Link to="/loans" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Loans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/loans"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{loan.borrower}</h2>
          <p className="text-gray-500 mt-1">Loan ID: {loan.id}</p>
        </div>
        <span
          className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusBadgeClasses(loan.status)}`}
        >
          {getStatusText(loan.status)}
        </span>
      </div>

      {/* Loan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-500 mb-2">Loan Amount</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-500 mb-2">Interest Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{formatPercentage(loan.interestRate)}</p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-500 mb-2">Risk Score</h3>
          <p className="text-3xl font-bold text-gray-900">{loan.riskScore}</p>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Payment Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Principal</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Interest</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loan.paymentSchedule.map((payment) => (
                <tr key={payment.id} className={payment.status === 'paid' ? 'bg-green-50' : payment.status === 'overdue' ? 'bg-red-50' : ''}>
                  <td className="px-6 py-5 whitespace-nowrap text-base text-gray-900">
                    {formatDate(payment.dueDate)}
                    {payment.paidDate && payment.status === 'paid' && (
                      <div className="text-sm text-gray-500 mt-1">
                        Paid: {formatDate(payment.paidDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-base text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                    {formatCurrency(payment.principalAmount)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                    {formatCurrency(payment.interestAmount)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span
                      className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-base">
                    {payment.status === 'pending' && (
                      <button
                        onClick={() => handleMarkPaymentPaid(payment.id)}
                        disabled={updatingPayment === payment.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <Check size={16} />
                        <span>Mark Paid</span>
                      </button>
                    )}
                    {payment.status === 'pending' && new Date(payment.dueDate) < new Date() && (
                      <button
                        onClick={() => handleMarkPaymentOverdue(payment.id)}
                        disabled={updatingPayment === payment.id}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm font-medium"
                      >
                        <X size={16} />
                        <span>Mark Overdue</span>
                      </button>
                    )}
                    {updatingPayment === payment.id && (
                      <span className="text-sm text-gray-500">Updating...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Obligations */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Obligations</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loan.obligations.map((obligation) => (
            <div key={obligation.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{obligation.title}</h4>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {obligation.type}
                    </span>
                  </div>
                  {obligation.description && (
                    <p className="text-sm text-gray-600 mt-1">{obligation.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Due: {formatDate(obligation.dueDate)}
                  </p>
                </div>
                <div>
                  {obligation.completed ? (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Log */}
      <Communication loanId={loan.id} />
    </div>
  );
};

export default LoanDetail;

