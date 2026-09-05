// src/components/ui/PasswordInput.jsx
import { useState } from "react";

/* ไอคอน SVG สาย production: stroke ใช้ currentColor → คุมสีผ่าน CSS ได้เลย */
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function PasswordInput({ label, error, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="pw-wrap">
        <input
          type={show ? "text" : "password"}
          className={"input" + (error ? " input--error" : "")}
          {...rest}
        />
        <button
          type="button"
          className={"pw-toggle" + (show ? "" : " pw-toggle--off")}
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          title={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          {show ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}