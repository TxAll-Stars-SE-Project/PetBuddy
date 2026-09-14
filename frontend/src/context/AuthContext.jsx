import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { toast } from "../utils/toast.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_user")); } catch { return null; }
  });
  const navigate = useNavigate();

  const clearSession = useCallback((destination = "/") => {
    localStorage.removeItem("pb_token");
    localStorage.removeItem("pb_user");
    setUser(null);
    navigate(destination);
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("pb_token", data.token);
      localStorage.setItem("pb_user", JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      throw { status, data: errorData };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch (e) { /* ไม่สน */ }
    clearSession();
    toast("ออกจากระบบแล้ว");
  }, [clearSession]);

  useEffect(() => {
    const onExpired = () => {
      clearSession("/login?expired=1");
    };
    const onDeactivated = () => {
      clearSession("/login");
    };
    window.addEventListener("pb:session-expired", onExpired);
    window.addEventListener("pb:account-deactivated", onDeactivated);
    return () => {
      window.removeEventListener("pb:session-expired", onExpired);
      window.removeEventListener("pb:account-deactivated", onDeactivated);
    };
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}