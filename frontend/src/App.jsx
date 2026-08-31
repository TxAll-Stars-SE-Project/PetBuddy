/* src/App.jsx */
import React, { useEffect } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { navigate, useHashRoute } from "./router.js";
import Toast from "./components/Toast.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import "./styles/global.css";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <NotFoundPage />;
    return this.props.children;
  }
}

const KNOWN_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

function Router() {
  const { path, params } = useHashRoute();
  const { user } = useAuth();

  useEffect(() => {
    if (!KNOWN_PATHS.includes(path)) navigate(user ? "/" : "/login");
    else if (path === "/" && !user) navigate("/login");
    else if ((path === "/login" || path === "/register") && user) navigate("/");
  }, [path, user]);

  let page = null;
  switch (path) {
    case "/login":           page = user ? null : <LoginPage params={params} />; break;
    case "/register":        page = user ? null : <RegisterPage />; break;
    case "/forgot-password": page = <ForgotPasswordPage />; break;
    case "/reset-password":  page = <ResetPasswordPage token={params.get("token")} />; break;
    case "/":                page = user ? <HomePage /> : null; break;
    default:                 page = user ? <NotFoundPage /> : null;
  }
  return <ErrorBoundary>{page}</ErrorBoundary>;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <Router />
        <Toast />
      </div>
    </AuthProvider>
  );
}