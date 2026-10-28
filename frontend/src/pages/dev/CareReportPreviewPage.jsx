import { useState } from "react";
import CareReportsModal from "../../components/careReport/CareReportsModal.jsx";
import CareReportFormModal from "../../components/careReport/CareReportFormModal.jsx";
import { MOCK_BOOKING_SUBTITLE, MOCK_REPORTS, buildMockReport } from "../../components/careReport/careReport.mock.js";
import { toast } from "../../utils/toast.js";

const VIEWERS = [
  { key: "owner", label: "เจ้าของ (Owner)" },
  { key: "sitter", label: "พี่เลี้ยง (Sitter)" },
];

const LIST_STATES = [
  { key: "success", label: "มีรายงาน" },
  { key: "empty", label: "ยังไม่มีรายงาน" },
  { key: "loading", label: "กำลังโหลด" },
  { key: "error", label: "โหลดไม่สำเร็จ" },
];

// TODO(US7-3 รอบ frontend): ลบไฟล์นี้ทิ้งตอนต่อ API จริง (merge ครั้งที่ 2)
//   ลบพร้อมกัน: components/careReport/careReport.mock.js + route /dev/care-report ใน App.jsx
//   ของจริงให้เปิด CareReportsModal / CareReportFormModal จาก OwnerBookingPage และ SitterBookingCard แทน
// CareReportPreviewPage — หน้าดู UI ของ US7-3 ด้วย mock data (เปิดเฉพาะตอน dev: /dev/care-report)
export default function CareReportPreviewPage() {
  const [viewer, setViewer] = useState("owner");
  const [listState, setListState] = useState("success");
  const [failSubmit, setFailSubmit] = useState(false);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [openModal, setOpenModal] = useState(null); // "list" | "form" | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const shownReports = listState === "empty" || listState === "error" ? [] : reports;
  const status = listState === "empty" ? "success" : listState;

  const handleSubmit = (payload) => {
    setIsSubmitting(true);
    setSubmitError("");
    setTimeout(() => {
      setIsSubmitting(false);
      if (failSubmit) {
        setSubmitError("ส่งรายงานได้เฉพาะระหว่างที่กำลังให้บริการเท่านั้น");
        return;
      }
      setReports((prev) => [...prev, buildMockReport(payload)]);
      setListState("success");
      setOpenModal("list");
      toast("ส่งรายงานเรียบร้อยแล้ว", "success");
    }, 900);
  };

  return (
    <main className="home-main" style={{ maxWidth: 720 }}>
      <h1 className="page-title">US7-3 · Care Report UI Preview</h1>
      <p className="section-sub">หน้าทดสอบ UI ด้วยข้อมูลจำลอง ยังไม่เชื่อมต่อ API</p>

      <section className="booking-card" style={{ display: "grid", gap: 16 }}>
        <div>
          <div className="row-label">มุมมอง</div>
          <div className="booking-tabs">
            {VIEWERS.map((v) => (
              <button
                key={v.key}
                type="button"
                className={`chip-btn${viewer === v.key ? " active" : ""}`}
                onClick={() => setViewer(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="row-label">สถานะรายการรายงาน</div>
          <div className="booking-tabs">
            {LIST_STATES.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`chip-btn${listState === s.key ? " active" : ""}`}
                onClick={() => setListState(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={failSubmit} onChange={(e) => setFailSubmit(e.target.checked)} />
          จำลองการส่งรายงานล้มเหลว (400)
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn--small" onClick={() => setOpenModal("list")}>
            ดูรายงานการดูแล ({shownReports.length})
          </button>
          {viewer === "sitter" && (
            <button type="button" className="btn btn--small btn--ghost" onClick={() => setOpenModal("form")}>
              + ส่งรายงาน
            </button>
          )}
        </div>
      </section>

      {openModal === "list" && (
        <CareReportsModal
          subtitle={MOCK_BOOKING_SUBTITLE}
          status={status}
          reports={shownReports}
          viewer={viewer}
          canSubmit={viewer === "sitter"}
          onRetry={() => setListState("success")}
          onAddReport={() => setOpenModal("form")}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === "form" && (
        <CareReportFormModal
          subtitle={MOCK_BOOKING_SUBTITLE}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onClose={() => {
            setSubmitError("");
            setOpenModal(null);
          }}
        />
      )}
    </main>
  );
}
