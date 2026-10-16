import React from "react";
import SitterBookingCard from "../SitterBookingCard";
import BookingCardSkeleton from "../../ui/BookingCardSkeleton.jsx";
import {
  countPendingBookings,
  getRecentPendingBookings,
} from "../../../utils/sitterDashboardLogic.js";

/**
 * RecentBookingsSection Component
 *
 * Sitter Dashboard section displaying a read-only preview of recent 'pending' booking requests (up to 3).
 * Clicking a card or the top-right link navigates to /sitter/bookings for full booking management (Accept/Reject/Complete).
 * Explicitly protects and displays historical agreed rates (booking.totalprice snapshot).
 *
 * @param {Object} props
 * @param {Array} props.bookings - Array of sitter booking objects.
 * @param {boolean} props.isLoading - Loading state flag.
 * @param {Function} props.onViewAll - Callback to navigate to /sitter/bookings.
 */
export default function RecentBookingsSection({
  bookings = [],
  isLoading = false,
  onViewAll,
}) {
  const pendingCount = countPendingBookings(bookings);
  const recentPendingBookings = getRecentPendingBookings(bookings, 3);

  const handleCardKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && onViewAll) {
      event.preventDefault();
      onViewAll();
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 custom-shadow p-5 sm:p-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              คำขอจองล่าสุด (Recent Bookings)
            </h2>
            {pendingCount > 0 ? (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {pendingCount} รอดำเนินการ
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                0 รอดำเนินการ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            แสดงเฉพาะคำขอจองใหม่ที่เพิ่งเข้ามา (คลิกที่การ์ดหรือลิงก์ด้านขวาเพื่อไปหน้าจัดการคำขอจอง)
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs sm:text-sm font-bold text-[#D97706] hover:text-[#B45309] underline underline-offset-4 decoration-2 flex items-center gap-1 transition-colors py-1 cursor-pointer"
        >
          จัดการคำขอจองทั้งหมด →
        </button>
      </div>

      {/* Pending Bookings Preview / Loading Skeleton / Clean Empty State */}
      {isLoading && bookings.length === 0 ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <BookingCardSkeleton key={n} />
          ))}
        </div>
      ) : recentPendingBookings.length === 0 ? (
        <div className="py-10 px-6 text-center bg-[#FAFBFB] rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
            <svg
              className="w-6 h-6"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">
              ยังไม่มีคำขอจองใหม่ที่รอดำเนินการ
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              เมื่อเจ้าของสัตว์เลี้ยงส่งคำขอจองเข้ามาใหม่ รายการที่รอดำเนินการจะปรากฏที่นี่ หรือคลิก &ldquo;จัดการคำขอจองทั้งหมด&rdquo; เพื่อดูประวัติการจองทุกสถานะ
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recentPendingBookings.map((booking) => (
            <div
              key={booking.bookingId}
              role="button"
              tabIndex={0}
              onClick={onViewAll}
              onKeyDown={handleCardKeyDown}
              title="คลิกเพื่อไปหน้าจัดการคำขอจอง"
              className="cursor-pointer rounded-2xl transition-all hover:ring-2 hover:ring-[#F97316]/40 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <SitterBookingCard booking={booking} />
            </div>
          ))}

          {pendingCount > recentPendingBookings.length && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs sm:text-sm font-bold text-[#0F766E] hover:text-[#115E59] underline underline-offset-4 decoration-2 cursor-pointer"
              >
                ดูคำขอที่รอดำเนินการทั้งหมด ({pendingCount} รายการ) →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Historical Price Guarantee Callout */}
      <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-600 bg-[#FFF7EF]/60 p-3 rounded-xl border border-amber-100">
        <svg
          className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span>
          <strong>Price Snapshot Guarantee:</strong> ยอดค่าบริการในการจอง (totalprice) ถูกบันทึกแบบ Snapshot เมื่อสร้างคำขอ การปรับปรุงราคาบริการหลังจากนั้นจะไม่มีผลย้อนหลังต่อการจองที่เกิดขึ้นแล้ว
        </span>
      </div>
    </section>
  );
}
