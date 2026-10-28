import { useEffect } from "react";
import CareReportTimeline from "./CareReportTimeline.jsx";
import "./careReport.css";

// CareReportsModal — หน้าต่างดูรายงานการดูแลทั้งหมดของการจอง (US7-3, UI only)
// status: "loading" | "error" | "success" — parent เป็นคนโหลดข้อมูลแล้วส่งเข้ามา
// canSubmit: true เฉพาะพี่เลี้ยงตอนงานเป็น in_progress → แสดงปุ่ม "ส่งรายงานใหม่"
export default function CareReportsModal({
  subtitle,
  status,
  reports = [],
  errorMessage = "โหลดรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  viewer = "owner",
  canSubmit = false,
  onRetry,
  onAddReport,
  onClose,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const emptyText =
    viewer === "sitter"
      ? "ยังไม่มีรายงาน ส่งรายงานแรกเพื่อให้เจ้าของอุ่นใจ"
      : "พี่เลี้ยงยังไม่ได้ส่งรายงาน รายงานจะแสดงที่นี่เมื่อเริ่มดูแลน้อง";

  let body;
  if (status === "loading" && reports.length === 0) {
    body = (
      <div className="care-report-skeleton" aria-busy="true" aria-label="กำลังโหลดรายงาน">
        {[0, 1].map((i) => (
          <div key={i} className="care-report-skeleton-row">
            <span className="care-report-skeleton-dot" />
            <div>
              <span className="care-report-skeleton-line care-report-skeleton-line--short" />
              <span className="care-report-skeleton-line" />
              <span className="care-report-skeleton-photo" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (status === "error") {
    body = (
      <div className="payment-modal-state payment-modal-state--error">
        <p>{errorMessage}</p>
        <button type="button" className="btn btn--small" onClick={onRetry}>
          ลองใหม่
        </button>
      </div>
    );
  } else if (reports.length === 0) {
    body = (
      <div className="care-report-empty">
        <div className="care-report-empty-emoji" aria-hidden="true">📝</div>
        <p>{emptyText}</p>
      </div>
    );
  } else {
    body = (
      <div className={status === "loading" ? "is-loading" : ""}>
        <CareReportTimeline reports={reports} />
      </div>
    );
  }

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal care-report-modal care-reports-modal" onClick={(e) => e.stopPropagation()}>
        <div className="care-reports-head">
          <div>
            <h2>รายงานการดูแล</h2>
            {subtitle && <p className="care-report-sub">{subtitle}</p>}
          </div>
          {status === "success" && reports.length > 0 && (
            <span className="care-report-count">{reports.length} รายงาน</span>
          )}
        </div>

        <div className="care-reports-body">{body}</div>

        <div className="delete-modal-actions">
          <button type="button" className="delete-cancel-button" onClick={onClose}>
            ปิด
          </button>
          {onRetry && status !== "error" && (
            <button type="button" className="delete-cancel-button" onClick={onRetry} disabled={status === "loading"}>
              รีเฟรช
            </button>
          )}
          {canSubmit && (
            <button type="button" className="profile-save-button" onClick={onAddReport}>
              + ส่งรายงานใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
