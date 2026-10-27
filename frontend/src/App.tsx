import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Toast from './components/Toast';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OwnerBookingPage from './pages/OwnerBookingPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SitterDashboardPage from './pages/SitterDashboardPage';
import SitterBookingsPage from './pages/sitter/SitterBookingsPage';
import './styles/global.css';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.role === 'sitter' ? '/sitter/dashboard' : '/'} replace />;
}

function SitterRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'sitter' ? children : <Navigate to="/" replace />;
}

function HomeRoute() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  return user.role === 'sitter'
    ? <Navigate to="/sitter/dashboard" replace />
    : <HomePage />;
}

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><OwnerBookingPage /></ProtectedRoute>} />
        <Route path="/sitter" element={<Navigate to="/sitter/dashboard" replace />} />
        <Route
          path="/sitter/dashboard"
          element={<SitterRoute><SitterDashboardPage /></SitterRoute>}
        />
        <Route
          path="/sitter/bookings"
          element={<SitterRoute><SitterBookingsPage /></SitterRoute>}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toast />
    </div>
  );
}
