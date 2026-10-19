import React, { useEffect } from "react";

/**
 * ServiceFeedbackModal Component
 * 
 * 🎓 Layer 3: Presentation UI Modal
 * - Displays a cozy, reassuring feedback popup when a service is published or updated.
 * - Complies with Zero Emojis design standard using clean SVGs.
 * - Explicitly communicates historical booking snapshot integrity for edits.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility flag.
 * @param {Function} props.onClose - Modal dismissal callback.
 * @param {'create'|'edit'} props.type - Operation type ('create' for publish, 'edit' for update).
 * @param {Object|null} props.serviceData - Summary of the created/edited service.
 */
export default function ServiceFeedbackModal({
  onClose,
  type = "create",
  serviceData = null,
}) {
  // Accessibility: Close on Escape key press (Active while mounted)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isCreate = type === "create";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center border border-slate-200 shadow-xl space-y-5 animate-scale-up">
        {/* Header Icon Badge */}
        <div className="flex justify-center">
          {isCreate ? (
            <div className="w-16 h-16 rounded-full bg-[#FFF3E8] border border-[#FED7AA] text-[#F97316] flex items-center justify-center shadow-xs">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Title & Headline (Strict BDD text matching) */}
        <div className="space-y-1.5">
          <h3
            id="feedback-title"
            className="text-lg font-bold text-slate-800"
          >
            {isCreate
              ? "Your service has been published successfully"
              : "Service details updated successfully."}
          </h3>
          <p className="text-xs text-slate-500">
            {isCreate
              ? "บริการของคุณเปิดรับจองจากเจ้าของสัตว์เลี้ยงเรียบร้อยแล้ว"
              : "บันทึกการแก้ไขข้อมูลและอัตราค่าบริการเรียบร้อยแล้ว"}
          </p>
        </div>

        {/* Service Summary Card */}
        {serviceData && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                {serviceData.serviceName || serviceData.servicename || "บริการดูแลสัตว์เลี้ยง"}
              </span>
              <span className="font-bold text-[#F97316] text-sm">
                ฿{serviceData.price}{" "}
                <span className="text-[11px] font-normal text-slate-500">
                  {serviceData.priceUnitHint || "/ ครั้ง"}
                </span>
              </span>
            </div>

            {Array.isArray(serviceData.species) && serviceData.species.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {serviceData.species.map((sp) => (
                  <span
                    key={sp}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600"
                  >
                    {sp === "dog"
                      ? "สุนัข"
                      : sp === "cat"
                      ? "แมว"
                      : sp === "bird"
                      ? "นก"
                      : sp === "small_animal"
                      ? "สัตว์ขนาดเล็ก"
                      : sp}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scenario 2 Reassurance Note (For Edit Mode) */}
        {!isCreate && (
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 text-left flex items-start gap-2">
            <svg
              className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>ข้อตกลงประวัติการจองเดิม:</strong> อัตราและเงื่อนไขใหม่นี้จะมีผลกับการจองใหม่หลังจากนี้เป็นต้นไป โดยไม่มีผลกระทบต่อราคาที่ตกลงไว้ในประวัติการจองเดิม
            </span>
          </div>
        )}

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors shadow-xs cursor-pointer"
          >
            {isCreate ? "ดูบริการของฉัน" : "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
