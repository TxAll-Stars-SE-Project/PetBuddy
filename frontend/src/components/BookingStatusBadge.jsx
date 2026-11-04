
import React from "react";
import { getBookingStatusInfo } from "../utils/bookingStatusConfig";

export default function BookingStatusBadge({ status, showDot = true, size = "md" }) {
  const info = getBookingStatusInfo(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-medium",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${info.badgeClass} ${sizeClasses[size]}`}
      title={info.description}
    >
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${info.dotClass}`} />
      )}
      {info.label}
    </span>
  );
}