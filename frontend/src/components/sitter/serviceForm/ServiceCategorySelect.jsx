import React from "react";
import { SERVICE_TYPE_OPTIONS } from "../../../utils/serviceLogic.js";

/**
 * ServiceCategorySelect Component
 * 
 * Dropdown selector for service category (walking, daycare, boarding, grooming, sitting).
 * 
 * @param {Object} props
 * @param {string} props.value - Selected service category.
 * @param {Function} props.onChange - Handler called with selected category value.
 * @param {string} [props.id] - Element id for accessibility.
 */
export default function ServiceCategorySelect({
  value,
  onChange,
  id = "service-type-select",
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        หมวดหมู่บริการ <span className="text-red-500">*</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#F97316] bg-white text-slate-800 cursor-pointer"
      >
        {SERVICE_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
