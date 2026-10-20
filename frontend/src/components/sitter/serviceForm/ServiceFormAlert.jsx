import React from "react";

/**
 * ServiceFormAlert Component
 * 
 * Validation error banner displayed at the top of the form when submission fails.
 * Complies with Zero Emojis rule using an alert triangle SVG icon.
 */
export default function ServiceFormAlert() {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in">
      <svg
        className="w-4 h-4 text-red-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>
        ข้อมูลยังไม่ครบถ้วน กรุณากรอกช่องที่มีเครื่องหมายดอกจัน (*) และเลือกสัตว์เลี้ยงอย่างน้อย 1 ชนิด
      </span>
    </div>
  );
}
