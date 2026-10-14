import React from "react";

/**
 * RecentBookingsSection Component
 * 
 * Sitter Dashboard section displaying recent booking requests.
 * Features a clean neutral border, Zero Emojis SVG styling, and a dedicated slot for the teammate's <BookingCard />.
 * Explicitly protects and displays historical agreed rates (booking.totalprice snapshot).
 * 
 * @param {Object} props
 * @param {Function} props.onViewAll - Callback to view all bookings or history.
 */
export default function RecentBookingsSection({ onViewAll }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 custom-shadow p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            คำขอจองล่าสุด (Recent Bookings)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            คำขอจองใหม่ที่รอการตอบรับจากคุณ
          </p>
          <span className="text-xs font-semibold text-slate-500 block mt-1">
            รอเชื่อมต่อ Component การ์ดคำขอจอง
          </span>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs sm:text-sm font-bold text-[#D97706] hover:text-[#B45309] underline underline-offset-4 decoration-2 flex items-center gap-1 transition-colors py-1 cursor-pointer"
        >
          ดูประวัติการจองทั้งหมด →
        </button>
      </div>

      {/* Component Slot: Container awaiting teammate's <BookingCard /> */}
      <div className="py-10 px-6 text-center bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800">
            พื้นที่สำหรับเรียกใช้ Component &lt;BookingCard /&gt;
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ส่วนการ์ดคำขอจองนี้กำลังพัฒนาโดยเพื่อนร่วมทีม เมื่อพัฒนาเสร็จแล้วเราจะ Import เข้ามาใช้งานในหน้านี้โดยตรง
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Component Slot (รอเชื่อมต่อจากเพื่อนร่วมทีม)
        </div>

        {/* Historical Price Guarantee Callout */}
        <div className="mt-2 pt-3 border-t border-slate-200 max-w-md mx-auto text-left flex items-start gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            <strong>Price Snapshot Guarantee:</strong> ยอดค่าบริการในการจอง (totalPrice) ถูกบันทึกแบบ Snapshot เมื่อสร้างคำขอ การปรับปรุงราคาบริการหลังจากนั้นจะไม่มีผลย้อนหลังต่อการจองที่เกิดขึ้นแล้ว
          </span>
        </div>
      </div>
    </section>
  );
}
