import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './services/auth';
import LandingPage from './pages/LandingPage';
import LandingPageV2 from './pages/LandingPageV2';
import SignupPage from './pages/SignupPage';
import PaymentPage from './pages/PaymentPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import AGB from './pages/AGB';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/v2" element={<LandingPageV2 />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<SignupPage mode="login" />} />
        <Route path="/payment" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb" element={<AGB />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
