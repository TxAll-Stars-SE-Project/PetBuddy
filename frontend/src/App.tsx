import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Toast from './components/Toast';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SitterBookingsPage from './pages/sitter/SitterBookingsPage';
import './styles/global.css';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route
          path="/forgot-password"
          element={<GuestRoute><ForgotPasswordPage /></GuestRoute>}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route path="/sitter" element={<Navigate to="/sitter/bookings" replace />} />
        <Route path="/sitter/bookings" element={<SitterBookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toast />
    </div>
  );
}
