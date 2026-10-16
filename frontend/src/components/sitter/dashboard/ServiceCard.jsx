import React from "react";

// Category metadata mapping
const SERVICE_TYPE_MAP = {
  walking: { label: "พาเดินเล่น", unit: "฿ / ชม." },
  daycare: { label: "ฝากเลี้ยงรายวัน", unit: "฿ / วัน" },
  boarding: { label: "ฝากเลี้ยงค้างคืน", unit: "฿ / คืน" },
  grooming: { label: "อาบน้ำตัดขน", unit: "฿ / ครั้ง" },
  sitting: { label: "ดูแลถึงที่พัก", unit: "฿ / ครั้ง" },
};

// Species mapping
const SPECIES_MAP = {
  dog: "สุนัข",
  cat: "แมว",
  bird: "นก",
  small_animal: "สัตว์ขนาดเล็ก",
  exotic: "สัตว์แปลก",
};

/**
 * ServiceCard Component
 * 
 * 🎓 React Pattern: Symmetric Grid Card with Locked Zone Heights
 * - Enforces minimum heights per zone (`min-h-[...]`) to align dividers and cards.
 * - Uses `mt-auto` on the action button bar to ensure it sticks to the bottom.
 * 
 * @param {Object} props
 * @param {Object} props.service - Service data object.
 * @param {Function} props.onEdit - Callback when Edit button is clicked.
 * @param {Function} props.onDelete - Callback when Delete button is clicked.
 */
export default function ServiceCard({ service, onEdit, onDelete }) {
  const isPublished = service.status === "published";
  const typeInfo = SERVICE_TYPE_MAP[service.servicetype || service.serviceType] || {
    label: service.servicetype || service.serviceType || "บริการ",
    unit: "฿",
  };

  return (
    <div
      className={`bg-white border-2 ${
        isPublished
          ? "border-slate-200 hover:border-[#0F766E]"
          : "border-dashed border-slate-300 bg-[#F8FAFC]"
      } rounded-2xl p-5 custom-shadow transition-all duration-200 flex flex-col`}
    >
      {/* Zone 1: Category Badge & Status Indicator */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2.5 py-1 rounded-lg font-bold">
          {typeInfo.label}
        </span>
        <span
          className={`text-xs font-bold flex items-center gap-1.5 ${
            isPublished ? "text-[#16A34A]" : "text-slate-500"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPublished ? "bg-[#16A34A]" : "bg-slate-400"
            }`}
          />
          {isPublished ? "เปิดรับบริการ" : "ปิดรับชั่วคราว"}
        </span>
      </div>

      {/* Zone 2: Title & Price (Min-h-[70px] for Grid alignment) */}
      <div className="min-h-[70px] mb-2">
        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
          {service.servicename || service.serviceName}
        </h3>
        <div className="flex items-baseline gap-1 mt-1.5">
          <span className="text-2xl font-extrabold text-[#0F766E]">
            ฿{Number(service.price).toLocaleString()}
          </span>
          <span className="text-xs text-slate-600 font-bold">{typeInfo.unit}</span>
        </div>
      </div>

      {/* Zone 3: Species Chips (Min-h-[32px] for Grid alignment) */}
      <div className="flex flex-wrap gap-1.5 pt-1 mb-3 min-h-[32px]">
        {(service.species || []).map((sp) => (
          <span
            key={sp}
            className="bg-[#F1F5F9] text-slate-800 text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-300"
          >
            {SPECIES_MAP[sp] || sp}
          </span>
        ))}
      </div>

      {/* Zone 4: Description (Min-h-[44px] for Grid alignment) */}
      <div className="min-h-[44px] mb-4">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {service.description || "ไม่มีคำอธิบายเพิ่มเติม"}
        </p>
      </div>

      {/* Zone 5: Action Buttons (mt-auto to pin to bottom) */}
      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onEdit(service)}
          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
        >
          แก้ไข
        </button>
        <button
          type="button"
          onClick={() => onDelete(service.serviceid || service.serviceId)}
          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
        >
          ลบ
        </button>
      </div>
    </div>
  );
}
