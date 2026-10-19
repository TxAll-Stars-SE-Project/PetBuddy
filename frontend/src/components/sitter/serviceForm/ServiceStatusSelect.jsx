import React from "react";

/**
 * ServiceStatusSelect Component
 * 
 * Dropdown selector for service status (published vs draft/paused).
 * 
 * @param {Object} props
 * @param {string} props.value - Current status value ('published' | 'draft').
 * @param {Function} props.onChange - Handler called with updated status.
 * @param {string} [props.id] - Element id for accessibility.
 */
export default function ServiceStatusSelect({
  value,
  onChange,
  id = "service-status-select",
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        สถานะการให้บริการ
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#F97316] bg-white text-slate-800 cursor-pointer"
      >
        <option value="published">เปิดรับบริการ (Published)</option>
        <option value="draft">ปิดรับชั่วคราว (Draft / Paused)</option>
      </select>
    </div>
  );
}
