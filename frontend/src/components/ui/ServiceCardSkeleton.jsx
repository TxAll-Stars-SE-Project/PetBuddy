import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * ServiceCardSkeleton Component
 * 
 * Reusable shimmer placeholder for an individual Service Card.
 * Maintains locked zone heights to preserve grid symmetry without layout shifts:
 * - Zone 1: Badge & Status
 * - Zone 2: Title & Price (min-h-[70px])
 * - Zone 3: Species Chips (min-h-[32px])
 * - Zone 4: Description (min-h-[44px])
 * - Zone 5: Action buttons (mt-auto)
 */
export default function ServiceCardSkeleton() {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 custom-shadow flex flex-col space-y-3 min-h-[220px] animate-pulse">
      {/* Zone 1: Badge & Status */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* Zone 2: Title & Price (Min-h-[70px]) */}
      <div className="min-h-[70px] space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-7 w-28" />
      </div>

      {/* Zone 3: Species Chips (Min-h-[32px]) */}
      <div className="flex gap-1.5 min-h-[32px]">
        <Skeleton className="h-6 w-14 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>

      {/* Zone 4: Description (Min-h-[44px]) */}
      <div className="min-h-[44px] space-y-1.5">
        <div className="h-3.5 w-full bg-slate-100 rounded" />
        <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
      </div>

      {/* Zone 5: Action buttons */}
      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100">
        <Skeleton className="flex-1 h-8 rounded-xl" />
        <Skeleton className="h-8 w-12 rounded-xl" />
      </div>
    </div>
  );
}
