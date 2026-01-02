import { useState } from 'react';
import { Mail, MessageSquare, Phone, Video, FileText, Send, Clock } from 'lucide-react';
import { formatDate } from '../../utils/dateHelpers';
import useLoanStore from '../../store/useLoanStore';

const Communication = ({ loanId }) => {
  const { getLoanCommunications, addCommunication, sendEmailNotification, getLoans } = useLoanStore();
  const loans = getLoans(); // Get user-filtered loans
  const communications = getLoanCommunications(loanId);
  const loan = loans.find(l => l.id === loanId);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'email',
    direction: 'outbound',
    subject: '',
    content: '',
    recipient: loan?.borrowerEmail || ''
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail size={18} className="text-blue-600" />;
      case 'sms':
        return <MessageSquare size={18} className="text-green-600" />;
      case 'call':
        return <Phone size={18} className="text-purple-600" />;
      case 'meeting':
        return <Video size={18} className="text-orange-600" />;
      case 'note':
        return <FileText size={18} className="text-gray-600" />;
      default:
        return <FileText size={18} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'email':
        return 'bg-blue-50 border-blue-200';
      case 'sms':
        return 'bg-green-50 border-green-200';
      case 'call':
        return 'bg-purple-50 border-purple-200';
      case 'meeting':
        return 'bg-orange-50 border-orange-200';
      case 'note':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newCommunication = {
      ...formData,
      author: 'Current User', // In real app, get from auth context
      status: formData.type === 'email' || formData.type === 'sms' ? 'sent' : 'completed',
      date: new Date().toISOString()
    };

    addCommunication(loanId, newCommunication);

    // If it's an email, also trigger email notification
    if (formData.type === 'email' && formData.direction === 'outbound') {
      sendEmailNotification(loanId, 'custom', {
        subject: formData.subject,
        content: formData.content
      });
    }

    // Reset form
    setFormData({
      type: 'email',
      direction: 'outbound',
      subject: '',
      content: '',
      recipient: loan?.borrowerEmail || ''
    });
    setShowForm(false);
  };

  const sendQuickReminder = (type) => {
    const nextPayment = loan?.paymentSchedule?.find(p => p.status === 'pending');
    if (!nextPayment) return;

    if (type === 'email') {
      sendEmailNotification(loanId, 'payment_reminder', {
        amount: nextPayment.amount,
        dueDate: formatDate(nextPayment.dueDate, 'MMM dd, yyyy'),
        paymentId: nextPayment.id
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Communication Log</h3>
          <div className="flex items-center space-x-2">
            {loan?.borrowerEmail && (
              <button
                onClick={() => sendQuickReminder('email')}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail size={16} />
                <span>Send Payment Reminder</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Send size={16} />
              <span>New Communication</span>
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direction
                </label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>
            </div>
            {(formData.type === 'email' || formData.type === 'sms') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'email' ? 'Recipient Email' : 'Recipient Phone'}
                </label>
                <input
                  type={formData.type === 'email' ? 'email' : 'tel'}
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>
            )}
            {formData.type !== 'note' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'note' ? 'Note Content' : 'Message Content'}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    type: 'email',
                    direction: 'outbound',
                    subject: '',
                    content: '',
                    recipient: loan?.borrowerEmail || ''
                  });
                }}
                className="px-4 py-2 text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {communications.length > 0 ? (
          communications
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((comm) => (
              <div
                key={comm.id}
                className={`p-6 ${getTypeColor(comm.type)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    {getTypeIcon(comm.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-base">
                            {comm.subject || `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} Communication`}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            comm.direction === 'outbound' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {comm.direction}
                          </span>
                          {comm.automated && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Automated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{formatDate(comm.date, 'MMM dd, yyyy HH:mm')}</span>
                          </span>
                          <span>By: {comm.author}</span>
                          {comm.recipient && (
                            <span>To: {comm.recipient}</span>
                          )}
                          {comm.status && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              comm.status === 'sent' || comm.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : comm.status === 'read'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {comm.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-base text-gray-700 whitespace-pre-wrap">{comm.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            <FileText className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-base">No communications yet</p>
            <p className="text-sm mt-1">Add a communication to start the log</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;

