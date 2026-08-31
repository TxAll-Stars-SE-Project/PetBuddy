// บนสุด
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";
import { navigate } from "../router.js";
import { toast } from "../utils/toast.js";

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_user")); } catch { return null; }
  });

  /* US1-2 login: เก็บ token + user ลง client-side */
  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("pb_token", res.token);
    localStorage.setItem("pb_user", JSON.stringify(res.user));
    setUser(res.user);
    return res;
  }, []);

  /* US1-3 logout: เรียก API → clear session ฝั่ง client → redirect ไป /login */
  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch (e) { /* แม้ API พังก็ต้องออกได้เสมอ */ }
    localStorage.removeItem("pb_token");
    localStorage.removeItem("pb_user");
    setUser(null);
    navigate("/login");
    toast("ออกจากระบบแล้ว");
  }, []);

  /* Security: ถ้า api wrapper แจ้งว่า session หมดอายุ (401 กลางทาง)
     ให้ clear session + เด้งกลับ login พร้อม banner (ดูที่ LoginPage) */
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem("pb_token");
      localStorage.removeItem("pb_user");
      setUser(null);
      navigate("/login?expired=1");
    };
    window.addEventListener("pb:session-expired", onExpired);
    return () => window.removeEventListener("pb:session-expired", onExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ท้ายไฟล์
export { AuthProvider, useAuth };