import React from "react";

/**
 * DashboardHeader Component
 * 
 * Minimal page heading for Sitter Dashboard:
 * - No card/border (Navbar already carries the PetBuddy branding).
 * - Personal greeting with the sitter's username + muted subtitle.
 * 
 * @param {Object} props
 * @param {string} [props.username] - Display name of the logged-in sitter.
 */
export default function DashboardHeader({ username }) {
  return (
    <header className="pt-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        สวัสดี, {username || "พี่เลี้ยง"}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        จัดการบริการและคำขอจองของคุณ
      </p>
    </header>
  );
}
