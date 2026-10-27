import React from "react";
import ServiceCard from "./ServiceCard.jsx";
import ServiceCardSkeleton from "../../ui/ServiceCardSkeleton.jsx";

/**
 * MyServicesSection Component
 * 
 * Sitter Dashboard section for managing pet care services:
 * - Header with service count badge and "+ เพิ่มบริการใหม่" action button.
 * - Loading spinner state when fetching services.
 * - Clean empty state when no services are registered yet.
 * - Responsive 3-column grid rendering individual ServiceCards.
 * 
 * @param {Object} props
 * @param {Array} props.services - Array of service objects.
 * @param {boolean} props.isLoading - Loading state flag.
 * @param {Function} props.onAddService - Callback to open the add service modal.
 * @param {Function} props.onEditService - Callback to edit a specific service.
 * @param {Function} props.onDeleteService - Callback to delete a specific service by ID.
 */
export default function MyServicesSection({
  services = [],
  isLoading = false,
  onAddService,
  onEditService,
  onDeleteService,
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 custom-shadow p-5 sm:p-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              บริการของฉัน (My Services)
            </h2>
            <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {services.length} บริการ
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            จัดการรายการบริการที่คุณเปิดรับดูแล
          </p>
        </div>

        <button
          type="button"
          onClick={onAddService}
          className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <span className="text-base leading-none font-bold">+</span>
          <span>เพิ่มบริการใหม่</span>
        </button>
      </div>

      {/* Service Cards Grid / Empty / Loading State */}
      {isLoading && services.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <ServiceCardSkeleton key={n} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 px-6 text-center bg-[#FAFBFB] rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">ยังไม่มีบริการที่คุณเปิดรับ</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              คุณยังไม่ได้ลงทะเบียนบริการใดๆ คลิกปุ่มด้านล่างเพื่อเริ่มสร้างบริการแรกของคุณ
            </p>
          </div>
          <button
            type="button"
            onClick={onAddService}
            className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>+ เพิ่มบริการใหม่</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const sId = service.serviceId || service.serviceid || service.id;
            return (
              <ServiceCard
                key={sId}
                service={service}
                onEdit={() => onEditService && onEditService(service)}
                onDelete={() => onDeleteService && onDeleteService(sId)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
