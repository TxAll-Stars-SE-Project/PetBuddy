import React from "react";

/**
 * Base Skeleton Component
 * 
 * Reusable animated placeholder box with a shimmer pulse effect.
 * 
 * @param {Object} props
 * @param {string} [props.className=""] - Additional Tailwind classes for width, height, border radius, etc.
 */
export default function Skeleton({ className = "" }) {
  return <div className={`bg-slate-200 animate-pulse rounded ${className}`} />;
}
