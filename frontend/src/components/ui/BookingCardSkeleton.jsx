import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * BookingCardSkeleton Component
 *
 * Reusable shimmer placeholder for an individual read-only SitterBookingCard on the dashboard.
 * Prevents layout shift while initial booking data is fetched.
 */
export default function BookingCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 custom-shadow space-y-4 animate-pulse">
      {/* Header: Service Title, Type & Status Pill */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}
