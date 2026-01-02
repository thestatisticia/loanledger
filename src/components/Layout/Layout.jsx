import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart3, Bell, Plus, LogOut, Database, User } from 'lucide-react';
import useLoanStore from '../../store/useLoanStore';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const Layout = () => {
  const location = useLocation();
  const { alerts, generateAlerts } = useLoanStore();
  const { user, logout } = usePrivy();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Generate alerts on mount and when navigating
    generateAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const unreadAlerts = alerts.filter(alert => !alert.read).length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.email?.address) {
      // Use email address as display name, or extract name part
      const email = user.email.address;
      return email.split('@')[0];
    }
    if (user?.google?.name) return user.google.name;
    return 'User';
  };

  const getUserEmail = () => {
    if (user?.email?.address) return user.email.address;
    if (user?.google?.email) return user.google.email;
    return '';
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/loans', label: 'All Loans', icon: FileText },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center">
              <h1 className="text-4xl font-bold text-gray-900">Loan Tracker</h1>
            </div>
            
            <nav className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-6 py-4 rounded-lg transition-colors text-xl ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={24} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <Link
                to="/loans/new"
                className="flex items-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xl font-medium"
              >
                <Plus size={24} />
                <span>New Loan</span>
              </Link>
              
              <Link
                to="/alerts"
                className="relative flex items-center space-x-2 px-6 py-4 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-xl"
              >
                <Bell size={24} />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-medium">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
                <span>Alerts</span>
              </Link>

              <Link
                to="/data"
                className={`flex items-center space-x-2 px-6 py-4 rounded-lg transition-colors text-xl ${
                  location.pathname === '/data'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Database size={24} />
                <span>Data</span>
              </Link>

              {/* User Menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-5 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-semibold hidden md:block text-lg">
                    {getUserDisplayName()}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-5 border-b border-gray-200">
                        <p className="font-semibold text-gray-900 text-lg">{getUserDisplayName()}</p>
                        {getUserEmail() && (
                          <p className="text-base text-gray-500 mt-1">{getUserEmail()}</p>
                        )}
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center space-x-2 px-5 py-4 text-left text-gray-700 hover:bg-gray-50 transition-colors text-base"
                      >
                        <User size={20} />
                        <span>My Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-5 py-4 text-left text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg text-base"
                      >
                        <LogOut size={20} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-10 py-10 text-lg">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

