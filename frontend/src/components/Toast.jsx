import React, { useEffect, useState } from "react";

/**
 * Toast Component
 * 
 * Modern, floating notification banner styled with Tailwind CSS.
 * Listens to the global `pb:toast` CustomEvent.
 * Supports: 'success' (default), 'error', 'info', 'warning'.
 */
export default function Toast() {
  const [item, setItem] = useState(null);

  useEffect(() => {
    let timer;
    const onToast = (e) => {
      setItem(e.detail);
      clearTimeout(timer);
      timer = setTimeout(() => setItem(null), 3500);
    };

    window.addEventListener("pb:toast", onToast);
    return () => {
      window.removeEventListener("pb:toast", onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!item) return null;

  const isError = item.type === "error";
  const isInfo = item.type === "info";
  const isWarning = item.type === "warning";

  return (
    <aside
      aria-label="Notification"
      className="fixed top-5 right-5 z-50 max-w-sm w-[calc(100vw-40px)] pointer-events-auto"
    >
      <div
        className={`bg-white rounded-2xl p-4 shadow-xl border flex items-start gap-3 transition-all ${
          isError
            ? "border-rose-200 shadow-rose-500/10"
            : isWarning
            ? "border-amber-200 shadow-amber-500/10"
            : isInfo
            ? "border-teal-200 shadow-teal-500/10"
            : "border-emerald-200 shadow-emerald-500/10"
        }`}
        role="status"
        aria-live="polite"
      >
        {/* Status Icon */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
            isError
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : isWarning
              ? "bg-amber-50 text-amber-600 border border-amber-200"
              : isInfo
              ? "bg-teal-50 text-teal-600 border border-teal-200"
              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
          }`}
        >
          {isError ? "✕" : isWarning ? "⚠" : isInfo ? "ℹ" : "✓"}
        </div>

        {/* Message */}
        <div className="flex-1 pt-1">
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
            {item.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setItem(null)}
          className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="ปิดการแจ้งเตือน"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}