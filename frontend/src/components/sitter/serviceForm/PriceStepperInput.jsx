import React from "react";

/**
 * PriceStepperInput Component
 * 
 * Self-contained Controlled Stepper Input:
 * - Encapsulates stepping calculations (+10 / -10) internally.
 * - Parent only supplies `value` and a single `onChange(newValue)` callback.
 * - Suppresses native browser spinners for clean cross-browser design.
 * 
 * @param {Object} props
 * @param {number|string} props.value - Current price value.
 * @param {Function} props.onChange - Unified callback returning the updated price value.
 * @param {string} [props.unitHint] - Display unit hint (e.g., "฿ / ชม.", "฿ / วัน").
 * @param {string} [props.error] - Validation error message if any.
 * @param {string} [props.id] - Input id for label accessibility.
 * @param {number} [props.step] - Step delta value (default: 10).
 */
export default function PriceStepperInput({
  value,
  onChange,
  unitHint = "฿ / ชม.",
  error = "",
  id = "price-stepper-input",
  step = 10,
}) {
  // Internal Step Handler (Calculates new price and informs parent via onChange)
  const handleStep = (delta) => {
    const current = Number(value) || 0;
    const nextVal = Math.max(0, current + delta);
    if (onChange) onChange(nextVal);
  };

  const handleInputChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700">
          อัตราค่าบริการ <span className="text-red-500">*</span>
        </label>
        <span className="text-xs font-bold text-[#0F766E]">{unitHint}</span>
      </div>

      <div className="relative flex items-center">
        {/* Currency Prefix */}
        <span className="absolute left-3 text-slate-400 font-bold text-sm pointer-events-none select-none">
          ฿
        </span>

        {/* Numeric Input with suppressed default browser spinner */}
        <input
          id={id}
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={handleInputChange}
          placeholder="0"
          className={`w-full pl-8 pr-12 py-2 text-sm border-2 rounded-xl focus:outline-none bg-white text-slate-800 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-200 focus:border-[#F97316]"
          }`}
        />

        {/* Custom Plain Stepper Buttons (▲ / ▼) */}
        <div className="absolute right-1 top-1 bottom-1 flex flex-col w-7 border-l border-slate-200">
          <button
            type="button"
            onClick={() => handleStep(step)}
            className="flex-1 flex items-center justify-center text-slate-500 hover:text-[#EA580C] hover:bg-[#FFF3E8] rounded-tr-lg transition-colors text-[9px] cursor-pointer select-none leading-none"
            title={`เพิ่ม ${step} บาท`}
            aria-label={`เพิ่ม ${step} บาท`}
          >
            ▲
          </button>
          <div className="h-[1px] bg-slate-200 w-full" />
          <button
            type="button"
            onClick={() => handleStep(-step)}
            className="flex-1 flex items-center justify-center text-slate-500 hover:text-[#EA580C] hover:bg-[#FFF3E8] rounded-br-lg transition-colors text-[9px] cursor-pointer select-none leading-none"
            title={`ลด ${step} บาท`}
            aria-label={`ลด ${step} บาท`}
          >
            ▼
          </button>
        </div>
      </div>

      {error && (
        <span className="text-xs text-red-500 mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
}
