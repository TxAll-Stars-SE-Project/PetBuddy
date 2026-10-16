import React from "react";
import ProfileCardSkeleton from "../../ui/ProfileCardSkeleton.jsx";

/**
 * SitterProfileCard Component
 * 
 * Displays the verified pet sitter's profile card, avatar silhouette,
 * rating, contact details, experience summary, and an Edit Profile action.
 * 
 * @param {Object} props
 * @param {Object} props.profile - Sitter profile data object.
 * @param {boolean} [props.isLoading=false] - Whether the profile is currently loading.
 * @param {Function} props.onEditProfile - Action callback to navigate to profile edit page.
 */
export default function SitterProfileCard({ profile, isLoading = false, onEditProfile }) {
  if (isLoading) {
    return <ProfileCardSkeleton />;
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 custom-shadow relative">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        {/* Sitter Profile Info */}
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center flex-1">
          {/* Orange Silhouette Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#FFF3E8] border-2 border-[#FED7AA] flex items-end justify-center overflow-hidden shadow-xs">
              <svg
                className="w-16 h-16 sm:w-18 sm:h-18 text-[#F97316] translate-y-1"
                width="64"
                height="64"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-label="Sitter Avatar"
              >
                <path d="M12 12c2.7 0 4.8-2.13 4.8-4.8S14.7 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <span
              className="absolute -bottom-1 -right-1 bg-[#16A34A] text-white p-1 rounded-full text-[10px] shadow-xs font-bold leading-none flex items-center justify-center w-5 h-5"
              title="ยืนยันตัวตนแล้ว"
            >
              ✓
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {profile?.name || "พี่เลี้ยงสัตว์เลี้ยง"}
              </h1>
              {profile?.username && (
                <span className="text-xs text-slate-500 font-medium">
                  (@{profile.username})
                </span>
              )}
              <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
                ✓ ยืนยันตัวตนแล้ว
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                ⭐ <strong className="text-slate-900">{profile?.rating || "not found"}</strong> (
                {profile?.reviewCount || 0} รีวิว)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                📞 <span className="font-semibold text-slate-800">{profile?.tel || "ไม่มีข้อมูลติดต่อ"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                📍 <span className="text-slate-700">{profile?.address || "ไม่มีที่อยู่ระบุ"}</span>
              </span>
            </div>

            <div className="bg-[#FFF3E8] border border-[#FED7AA] rounded-xl p-3 mt-1.5 max-w-2xl">
              <div className="text-xs font-bold text-[#EA580C] mb-0.5">
                ประสบการณ์และเกี่ยวกับฉัน:
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {profile?.experience || "ยังไม่มีข้อมูลประสบการณ์ กรุณาเพิ่มข้อมูลในหน้าโปรไฟล์"}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Profile Action Button */}
        <div className="w-full lg:w-auto flex justify-end items-center border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200">
          <button
            type="button"
            onClick={onEditProfile}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-[#FFF3E8] text-[#EA580C] font-bold text-xs sm:text-sm rounded-xl border-2 border-[#FED7AA] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            แก้ไขข้อมูลส่วนตัว
          </button>
        </div>
      </div>
    </section>
  );
}
