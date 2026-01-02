import { usePrivy } from '@privy-io/react-auth';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { ready, authenticated } = usePrivy();

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;


