import React from "react";

/**
 * ServiceFormHeader Component
 * 
 * Header section for ServiceFormModal:
 * - Displays dynamic title ("เพิ่มบริการใหม่" / "แก้ไขบริการ")
 * - Subtitle description
 * - Modal close button ✕
 * 
 * @param {Object} props
 * @param {boolean} props.isEditMode - Whether modal is in edit mode.
 * @param {Function} props.onClose - Modal close handler.
 */
export default function ServiceFormHeader({ isEditMode, onClose }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
      <div>
        <h3 id="service-modal-title" className="text-lg font-bold text-slate-800">
          {isEditMode ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {isEditMode
            ? "ปรับปรุงรายละเอียดและอัตราค่าบริการของคุณ"
            : "กรอกรายละเอียดบริการที่คุณต้องการเปิดรับดูแล"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg transition-colors cursor-pointer"
        aria-label="ปิดหน้าต่าง"
      >
        ✕
      </button>
    </div>
  );
}
