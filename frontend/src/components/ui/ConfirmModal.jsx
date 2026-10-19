import React from "react";

/**
 * ConfirmModal Component
 * 
 * Reusable modal dialog for confirming critical actions (e.g. Delete).
 * Replaces native browser window.confirm with a modern, PetBuddy-styled dialog.
 * 
 * @param {Object} props
 * @param {string} [props.title="ยืนยันการลบ"] - Modal title.
 * @param {string} [props.message="คุณต้องการดำเนินการนี้ใช่หรือไม่?"] - Confirmation message.
 * @param {string} [props.confirmText="ยืนยัน"] - Confirm button label.
 * @param {string} [props.cancelText="ยกเลิก"] - Cancel button label.
 * @param {boolean} [props.isDanger=true] - Whether this is a destructive action (renders red confirm button).
 * @param {boolean} [props.isLoading=false] - Whether confirmation is currently processing.
 * @param {Function} props.onConfirm - Callback when user confirms.
 * @param {Function} props.onCancel - Callback when user cancels or closes.
 */
export default function ConfirmModal({
  title = "ยืนยันการลบ",
  message = "คุณต้องการดำเนินการนี้ใช่หรือไม่?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${
              isDanger
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-amber-50 text-amber-600 border border-amber-200"
            }`}
          >
            {isDanger ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>

          <div className="space-y-1 flex-1">
            <h3 id="confirm-modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#0F766E] hover:bg-[#115E59]"
            }`}
          >
            {isLoading ? "กำลังดำเนินการ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
