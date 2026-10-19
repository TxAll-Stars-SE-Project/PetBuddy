import React from "react";

/**
 * ServiceFormFooter Component
 * 
 * Bottom action bar for ServiceFormModal:
 * - Displays incomplete warning message on bottom-left with pulse icon
 * - Cancel button
 * - Submit/Save button ("บันทึกการแก้ไข" / "เผยแพร่บริการ")
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Modal close handler.
 * @param {boolean} props.isEditMode - Whether modal is in edit mode.
 * @param {boolean} props.showIncompleteWarning - Whether to show the incomplete warning.
 */
export default function ServiceFormFooter({
  onClose,
  isEditMode,
  showIncompleteWarning,
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
      {/* Bottom Left Incomplete Notice */}
      <div className="min-h-[1.25rem] flex items-center">
        {showIncompleteWarning && (
          <span className="text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-red-500 inline shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            กรุณาใส่ข้อมูลให้ครบ
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {isEditMode ? "บันทึกการแก้ไข" : "เผยแพร่บริการ"}
        </button>
      </div>
    </div>
  );
}
