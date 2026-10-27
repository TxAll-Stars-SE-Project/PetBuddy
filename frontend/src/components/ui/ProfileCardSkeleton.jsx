import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * ProfileCardSkeleton Component
 * 
 * Reusable shimmer placeholder for the Sitter Profile Card.
 * Mirrors exact layout and dimensions of SitterProfileCard to prevent layout shifts.
 */
export default function ProfileCardSkeleton() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 custom-shadow relative animate-pulse">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center flex-1 w-full">
          {/* Avatar Skeleton */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-slate-200 flex-shrink-0" />

          <div className="space-y-2.5 flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div className="bg-[#FFF3E8]/60 border border-[#FED7AA]/50 rounded-xl p-3 mt-1.5 max-w-2xl space-y-2">
              <div className="h-3.5 w-36 bg-amber-200/60 rounded" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-auto flex justify-end items-center border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
          <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
        </div>
      </div>
    </section>
  );
}
