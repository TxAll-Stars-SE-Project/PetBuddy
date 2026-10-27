import React from "react";

/**
 * Available species options
 * (Strict UI Rule: No checkboxes, use clickable Button Chip Tiles)
 */
export const SPECIES_OPTIONS = [
  { id: "dog", label: "สุนัข" },
  { id: "cat", label: "แมว" },
  { id: "bird", label: "นก" },
  { id: "exotic", label: "สัตว์มหัศจรรย์" },
];

/**
 * SpeciesChipSelector Component
 * 
 * Self-contained Multi-Select Button Chip Tiles:
 * - Encapsulates array toggle logic internally.
 * - Parent only supplies `value` and a single `onChange(newSpeciesArray)` callback.
 * 
 * @param {Object} props
 * @param {string[]} [props.value] - Array of currently selected species IDs.
 * @param {string[]} [props.selectedSpecies] - Alias for value.
 * @param {Function} props.onChange - Callback returning the updated array of selected species.
 * @param {string} [props.error] - Validation error message if none selected.
 */
export default function SpeciesChipSelector({
  value,
  selectedSpecies,
  onChange,
  error = "",
}) {
  // Support both `value` and `selectedSpecies` prop names seamlessly
  const currentList = Array.isArray(value)
    ? value
    : Array.isArray(selectedSpecies)
    ? selectedSpecies
    : [];

  // Internal Toggle Handler: calculates new array and informs parent via onChange
  const handleToggle = (speciesId) => {
    const nextList = currentList.includes(speciesId)
      ? currentList.filter((id) => id !== speciesId)
      : [...currentList, speciesId];

    if (onChange) onChange(nextList);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700">
          ชนิดสัตว์เลี้ยงที่รับดูแล <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] text-slate-500">
          (เลือกได้มากกว่า 1 ชนิด)
        </span>
      </div>

      {/* Grid of Clickable Button Chip Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SPECIES_OPTIONS.map((item) => {
          const isSelected = currentList.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item.id)}
              className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs select-none ${
                isSelected
                  ? "border-[#F97316] bg-[#FFF3E8] text-[#EA580C] font-bold shadow-xs scale-[1.01]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium"
              }`}
            >
              <span>{item.label}</span>
              {isSelected && (
                <span className="text-[#EA580C] font-bold text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <span className="text-xs text-red-500 mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
}
