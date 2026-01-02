import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLoanStore from '../../store/useLoanStore';
import { generatePaymentSchedule } from '../../utils/loanHelpers';

const NewLoan = () => {
  const navigate = useNavigate();
  const { addLoan } = useLoanStore();
  
  const [formData, setFormData] = useState({
    borrower: '',
    amount: '',
    interestRate: '',
    term: '',
    startDate: new Date().toISOString().split('T')[0],
    borrowerContact: '',
    borrowerEmail: '',
    borrowerPhone: '',
    loanOfficer: '',
    tags: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const loan = {
      id: `loan-${Date.now()}`,
      borrower: formData.borrower,
      amount: parseFloat(formData.amount),
      interestRate: parseFloat(formData.interestRate),
      term: parseInt(formData.term),
      startDate: formData.startDate,
      endDate: new Date(new Date(formData.startDate).setMonth(new Date(formData.startDate).getMonth() + parseInt(formData.term))).toISOString().split('T')[0],
      status: 'on_track',
      paymentSchedule: generatePaymentSchedule({
        id: `loan-${Date.now()}`,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        term: parseInt(formData.term),
        startDate: formData.startDate
      }),
      obligations: [],
      notes: [],
      riskScore: 50,
      tags: formData.tags,
      borrowerContact: formData.borrowerContact,
      borrowerEmail: formData.borrowerEmail,
      borrowerPhone: formData.borrowerPhone,
      loanOfficer: formData.loanOfficer
    };

    const newLoan = addLoan(loan);
    navigate(`/loans/${newLoan.id}`);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Add New Loan</h2>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Borrower Name *
          </label>
          <input
            type="text"
            name="borrower"
            value={formData.borrower}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount ($) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interest Rate (%) *
            </label>
            <input
              type="number"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term (months) *
            </label>
            <input
              type="number"
              name="term"
              value={formData.term}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Borrower Contact
          </label>
          <input
            type="text"
            name="borrowerContact"
            value={formData.borrowerContact}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="borrowerEmail"
              value={formData.borrowerEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="borrowerPhone"
              value={formData.borrowerPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Officer
          </label>
          <input
            type="text"
            name="loanOfficer"
            value={formData.loanOfficer}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/loans')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Loan
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewLoan;

