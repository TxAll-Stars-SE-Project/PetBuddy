import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./ui/Logo.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isSitter = user?.role === "sitter";
  // ค่าในช่องค้นหาตามพารามิเตอร์ ?q= ปัจจุบัน (key ด้านล่างทำให้ช่องรีเซ็ตเมื่อ q ถูกล้างจากหน้าอื่น)
  const [searchParams] = useSearchParams();
  const currentQ = searchParams.get("q") ?? "";

  const handleSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q").trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        {/* หน้าค้นหาเป็นของเจ้าของสัตว์เลี้ยง — พี่เลี้ยงไม่เห็นช่องนี้ (ถูกส่งไป dashboard) */}
        {user?.role !== "sitter" && (
          <form className="navbar-search-form" role="search" onSubmit={handleSearch}>
            <input
              key={currentQ} name="q" type="search" className="input navbar-search"
              placeholder="ค้นหาพี่เลี้ยงด้วยชื่อ…" aria-label="ค้นหาพี่เลี้ยงด้วยชื่อ"
              maxLength={100} defaultValue={currentQ}
            />
          </form>
        )}
        <div className="navbar-user">
          <button className="avatar-btn" onClick={() => setOpen((o) => !o)}>
            <span className="avatar">{(user?.username || "U").charAt(0).toUpperCase()}</span>
            {user?.username} <span className="caret">▾</span>
          </button>
          {open && (
            <>
              <div className="overlay" onClick={() => setOpen(false)} />
              <div className="dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                >
                  โปรไฟล์ของฉัน
                </button>

                {isSitter ? (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setOpen(false);
                        navigate("/sitter/dashboard");
                      }}
                    >
                      แดชบอร์ดพี่เลี้ยง
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setOpen(false);
                        navigate("/sitter/dashboard");
                      }}
                    >
                      คำขอจองบริการ (Booking Requests)
                    </button>
                  </>
                ) : (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setOpen(false);
                      navigate("/bookings");
                    }}
                  >
                    การจองของฉัน
                  </button>
                )}
                {user?.role === "sitter" && (
                  <button
                    className="dropdown-item"
                    onClick={() => { setOpen(false); navigate("/sitter/bookings"); }}
                  >
                    รายการคำขอจอง
                  </button>
                )}
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-item--danger"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
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