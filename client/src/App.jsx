import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './services/auth';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import PaymentPage from './pages/PaymentPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<SignupPage mode="login" />} />
        <Route path="/payment" element={
          <PrivateRoute><PaymentPage /></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><SettingsPage /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
