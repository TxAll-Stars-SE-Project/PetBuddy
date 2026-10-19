import React from "react";

/**
 * ServiceNameInput Component
 * 
 * Specialized input field for service name with required indicator and error message.
 * 
 * @param {Object} props
 * @param {string} props.value - Current service name text.
 * @param {Function} props.onChange - Handler called with updated text.
 * @param {string} [props.error] - Validation error message if any.
 * @param {string} [props.id] - Element id for accessibility.
 */
export default function ServiceNameInput({
  value,
  onChange,
  error = "",
  id = "service-name-input",
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        ชื่อบริการ <span className="text-red-500">*</span>
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="เช่น รับฝากดูแลรายวัน มีสนามหญ้าวิ่งเล่น"
        className={`w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none bg-white text-slate-800 transition-colors ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-slate-200 focus:border-[#F97316]"
        }`}
      />
      {error && (
        <span className="text-xs text-red-500 mt-1 block">{error}</span>
      )}
    </div>
  );
}
