import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Dashboard from './pages/Dashboard/Dashboard';
import LoansList from './pages/Loans/LoansList';
import LoanDetail from './pages/LoanDetail/LoanDetail';
import Analytics from './pages/Analytics/Analytics';
import Alerts from './pages/Alerts/Alerts';
import NewLoan from './pages/NewLoan/NewLoan';
import Login from './pages/Login/Login';
import DataManagement from './pages/DataManagement/DataManagement';
import Profile from './pages/Profile/Profile';
import UserStoreInitializer from './components/UserStoreInitializer/UserStoreInitializer';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserStoreInitializer>
                <Layout />
              </UserStoreInitializer>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="loans" element={<LoansList />} />
          <Route path="loans/:id" element={<LoanDetail />} />
          <Route path="loans/new" element={<NewLoan />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
