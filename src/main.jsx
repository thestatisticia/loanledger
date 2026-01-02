import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.jsx'

// Try to get from env, fallback to hardcoded value for now
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || 'cmjs8eug801s9ju0db1fv7bqy';

// Suppress harmless hydration warnings from Privy's embedded components
// These are known issues in Privy's UI library and don't affect functionality
if (import.meta.env.DEV) {
  const filterPrivyWarnings = (args) => {
    const message = args[0]?.toString() || '';
    return (
      message.includes('cannot be a descendant of') ||
      message.includes('cannot contain a nested') ||
      message.includes('hydration error') ||
      message.includes('In HTML, <div> cannot be a descendant of <p>')
    );
  };

  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (!filterPrivyWarnings(args)) {
      originalWarn.apply(console, args);
    }
  };

  console.error = (...args) => {
    if (!filterPrivyWarnings(args)) {
      originalError.apply(console, args);
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {privyAppId ? (
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ['email'],
          appearance: {
            theme: 'light',
            accentColor: '#2563eb',
          },
        }}
      >
        <App />
      </PrivyProvider>
    ) : (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-2">Privy App ID is not configured.</p>
          <p className="text-sm text-gray-500">
            Please create a <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file with:
          </p>
          <p className="text-sm text-gray-700 mt-2 font-mono bg-gray-100 p-2 rounded">
            VITE_PRIVY_APP_ID=your_app_id_here
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Then restart your development server.
          </p>
        </div>
      </div>
    )}
  </StrictMode>,
)
