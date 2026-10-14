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
import OwnerBookingPage from "./pages/OwnerBookingPage.jsx";
import SitterDashboardPage from "./pages/SitterDashboardPage.jsx";
import SitterBookingsPage from "./pages/sitter/SitterBookingsPage";
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
  if (user) {
    return <Navigate to={user.role === "sitter" ? "/sitter/dashboard" : "/"} replace />;
  }
  return children;
}

/* Sitter Route: เฉพาะพี่เลี้ยงเท่านั้น (ถ้าไม่ใช่ sitter ให้เด้งกลับหน้าแรก /) */
function SitterRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "sitter") return <Navigate to="/" replace />;
  return children;
}

/* Home Route: หน้าแรก '/' สำหรับ Guest แสดง LandingPage, สำหรับ Sitter ดีดไป SitterDashboard, สำหรับ Owner แสดง HomePage */
function HomeRoute() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  if (user.role === "sitter") return <Navigate to="/sitter/dashboard" replace />;
  return <HomePage />;
}

// src/App.jsx
function AppRoutes() {
  return (
    <div className="app-root">
      <Routes>
        {/* owner → หน้าค้นหาพี่เลี้ยง, sitter → dashboard (ตาม user journey) */}
        <Route path="/" element={<HomeRoute />} />
        
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><OwnerBookingPage /></ProtectedRoute>} />
        <Route path="/sitter" element={<Navigate to="/sitter/dashboard" replace />} />
        <Route path="/sitter/dashboard" element={<SitterRoute><SitterDashboardPage /></SitterRoute>} />
        <Route path="/sitter/bookings" element={<SitterRoute><SitterBookingsPage /></SitterRoute>} />
        
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