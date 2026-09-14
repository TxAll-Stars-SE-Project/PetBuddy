import { useEffect, useState } from "react";

export default function Toast() {
  const [item, setItem] = useState(null);

  useEffect(() => {
    let t;
    const onToast = (e) => {
      setItem(e.detail);
      clearTimeout(t);
      t = setTimeout(() => setItem(null), 3000);
    };
    window.addEventListener("pb:toast", onToast);
    return () => {
      window.removeEventListener("pb:toast", onToast);
      clearTimeout(t);
    };
  }, []);

  if (!item) return null;

  const isError = item.type === "error";
  const isInfo = item.type === "info";
  const typeClass = isError ? " toast--error" : isInfo ? " toast--info" : " toast--success";
  const icon = isError ? "✕" : isInfo ? "ℹ" : "✓";

  return (
    <div className={"toast" + typeClass} role="status" aria-live="polite">
      <span className="toast-icon">{icon}</span>
      <span className="toast-msg">{item.message}</span>
    </div>
  );
}