import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Login = () => {
  const { ready, authenticated, login } = usePrivy();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (ready && authenticated) {
      navigate('/', { replace: true });
    }
  }, [ready, authenticated, navigate]);

  const handleLogin = async () => {
    try {
      // Privy's login() opens an embedded modal that handles:
      // 1. Email input
      // 2. Sending verification code
      // 3. Code verification
      // All in one flow through their UI
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Tracker</h1>
          <p className="text-gray-600">Sign in to access your loan dashboard</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Mail size={20} />
          <span>Continue with Email</span>
        </button>
        
        <div className="mt-4 text-sm text-gray-600 text-center">
          <p>Click the button above to sign in with your email address.</p>
          <p className="mt-2 text-xs text-gray-500">Privy will handle the verification flow.</p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;

