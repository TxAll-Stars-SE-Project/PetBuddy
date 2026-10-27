import React from "react";

/**
 * ServiceDescriptionInput Component
 * 
 * Specialized textarea for service description with required indicator and error message.
 * 
 * @param {Object} props
 * @param {string} props.value - Current description text.
 * @param {Function} props.onChange - Handler called with updated description.
 * @param {string} [props.error] - Validation error message if any.
 * @param {string} [props.id] - Element id for accessibility.
 */
export default function ServiceDescriptionInput({
  value,
  onChange,
  error = "",
  id = "service-description-input",
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        คำอธิบายบริการ <span className="text-red-500">*</span>
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="อธิบายจุดเด่น สถานที่ กิจกรรม หรือข้อกำหนดในการดูแลสัตว์เลี้ยง..."
        className={`w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none bg-white text-slate-800 transition-colors resize-none ${
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
