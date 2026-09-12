import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Toast from "./components/Toast.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import "./styles/global.css";

/* Protected Route: ถ้ายังไม่ล็อกอิน ให้เด้งไป login */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/* Guest Route: ถ้าล็อกอินอยู่แล้ว ห้ามเข้า login/register */
function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
}

// src/App.jsx
function AppRoutes() {
  const { user } = useAuth(); // ดึงสถานะ user มาเช็ก

  return (
    <div className="app-root">
      <Routes>

        <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
        
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}