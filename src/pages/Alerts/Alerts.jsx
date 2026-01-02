import useLoanStore from '../../store/useLoanStore';
import { formatDate } from '../../utils/dateHelpers';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Bell } from 'lucide-react';

const Alerts = () => {
  const { alerts, markAlertRead, markAllAlertsRead } = useLoanStore();
  
  const unreadAlerts = alerts.filter(a => !a.read);
  const readAlerts = alerts.filter(a => a.read);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="text-red-600" size={22} />;
      case 'high':
        return <AlertTriangle className="text-orange-600" size={22} />;
      case 'medium':
        return <AlertTriangle className="text-yellow-600" size={22} />;
      default:
        return <Bell className="text-blue-600" size={22} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-gray-900">Alerts</h2>
        {unreadAlerts.length > 0 && (
          <button
            onClick={markAllAlertsRead}
            className="px-5 py-3 text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Unread Alerts */}
      {unreadAlerts.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Unread ({unreadAlerts.length})
          </h3>
          <div className="space-y-3">
            {unreadAlerts.map((alert) => (
              <Link
                key={alert.id}
                to={alert.actionUrl || '#'}
                onClick={() => markAlertRead(alert.id)}
                className={`block p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-base">{alert.title}</h4>
                      <span className="text-sm font-medium text-gray-500 uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(alert.date, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Read Alerts */}
      {readAlerts.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Read ({readAlerts.length})
          </h3>
          <div className="space-y-3">
            {readAlerts.map((alert) => (
              <Link
                key={alert.id}
                to={alert.actionUrl || '#'}
                className="block p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors opacity-75"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <CheckCircle className="text-gray-400" size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700 text-base">{alert.title}</h4>
                      <span className="text-sm font-medium text-gray-400 uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-base text-gray-500 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {formatDate(alert.date, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
          <p className="text-lg text-gray-500">No alerts at this time</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;

