import { useCallback, useEffect, useState } from "react";
import CareReportsModal from "./CareReportsModal.jsx";
import CareReportFormModal from "./CareReportFormModal.jsx";
import { createCareReport, getCareReports, getCareReportErrorMessage } from "../../services/careReports.js";
import { toast } from "../../utils/toast.js";

// CareReportsDialog — ต่อ CareReportsModal / CareReportFormModal เข้ากับ API จริง (US7-3)
// โหลดรายงานจาก GET /api/bookings/{bookingID}/reports และส่งรายงานใหม่ผ่าน POST
// canSubmit: true เฉพาะพี่เลี้ยงตอนงานเป็น in_progress
export default function CareReportsDialog({ bookingId, subtitle, viewer = "owner", canSubmit = false, onClose }) {
  const [view, setView] = useState("list"); // "list" | "form"
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ status: "loading", reports: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setResult((r) => ({ ...r, status: "loading" }));
    getCareReports(bookingId, { signal: controller.signal })
      .then((reports) => setResult({ status: "success", reports }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult((r) => ({ ...r, status: "error" }));
      });
    return () => controller.abort();
  }, [bookingId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const closeForm = useCallback(() => {
    setSubmitError("");
    setView("list");
  }, []);

  async function handleSubmit(payload) {
    if (isSubmitting) return; // กันกดส่งซ้ำ
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await createCareReport(bookingId, payload);
      toast("ส่งรายงานเรียบร้อยแล้ว", "success");
      setView("list");
      reload();
    } catch (err) {
      setSubmitError(getCareReportErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (view === "form") {
    return (
      <CareReportFormModal
        subtitle={subtitle}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />
    );
  }

  return (
    <CareReportsModal
      subtitle={subtitle}
      status={result.status}
      reports={result.reports}
      viewer={viewer}
      canSubmit={canSubmit}
      onRetry={reload}
      onAddReport={() => setView("form")}
      onClose={onClose}
    />
  );
}
