import { useState } from "react";

function PasswordInput({ label, error, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="pw-wrap">
        <input type={show ? "text" : "password"} className={"input" + (error ? " input--error" : "")} {...rest} />
        <button type="button" className="pw-toggle" tabIndex={-1} onClick={() => setShow((s) => !s)}>
          {show ? "" : ""}
        </button>
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default PasswordInput;