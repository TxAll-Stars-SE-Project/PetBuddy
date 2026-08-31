// บนสุด
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./ui/Logo.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        <input className="input navbar-search" placeholder="ค้นหาพี่เลี้ยง… (Sprint 2)" disabled />
        <div className="navbar-user">
          <button className="avatar-btn" onClick={() => setOpen((o) => !o)}>
            <span className="avatar">{(user?.username || "U").charAt(0).toUpperCase()}</span>
            {user?.username} <span className="caret">▾</span>
          </button>
          {open && (
            <>
              <div className="overlay" onClick={() => setOpen(false)} />
              <div className="dropdown">
                <button className="dropdown-item" disabled>โปรไฟล์ของฉัน</button>
                <button className="dropdown-item" disabled>การจองของฉัน</button>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger"
                  onClick={() => { setOpen(false); logout(); }}>
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
// ท้ายไฟล์
export default Navbar;