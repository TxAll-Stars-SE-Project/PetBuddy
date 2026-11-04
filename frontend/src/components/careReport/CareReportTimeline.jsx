import { useEffect, useState } from "react";
import "./careReport.css";

function toDayKey(iso) {
  return new Date(iso).toDateString();
}

function formatDayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "วันนี้";
  if (date.toDateString() === yesterday.toDateString()) return "เมื่อวาน";
  return date.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

// ใหม่สุดอยู่บน แล้วจัดกลุ่มตามวัน
function groupByDay(reports) {
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const groups = [];
  for (const report of sorted) {
    const key = toDayKey(report.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(report);
    else groups.push({ key, label: formatDayLabel(report.createdAt), items: [report] });
  }
  return groups;
}

// CareReportTimeline — แสดงรายงานการดูแลเป็นเส้นเวลา ใช้ร่วมกันทั้ง owner และ sitter (US7-3)
// reports: รูปแบบเดียวกับ GET /api/bookings/{bookingID}/reports
export default function CareReportTimeline({ reports }) {
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!lightbox) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation(); // ปิดแค่รูป ไม่ให้ modal ที่ครอบอยู่ปิดตาม
        setLightbox(null);
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [lightbox]);

  return (
    <>
      <ol className="care-timeline">
        {groupByDay(reports).map((group) => (
          <li key={group.key} className="care-timeline-day">
            <h3 className="care-timeline-day-label">{group.label}</h3>
            <ol className="care-timeline-items">
              {group.items.map((r) => (
                <li key={r.reportId} className="care-timeline-item">
                  <span className="care-timeline-dot" aria-hidden="true" />
                  <time className="care-timeline-time" dateTime={r.createdAt}>
                    {formatTime(r.createdAt)} น.
                  </time>
                  <p className="care-timeline-detail">{r.reportDetail}</p>
                  {r.photoUrl && (
                    <button
                      type="button"
                      className="care-timeline-photo"
                      onClick={() => setLightbox(r)}
                      aria-label="ดูรูปขนาดเต็ม"
                    >
                      <img src={r.photoUrl} alt={`รูปกิจกรรม ${formatTime(r.createdAt)} น.`} loading="lazy" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>

      {lightbox && (
        <div className="care-lightbox" onClick={() => setLightbox(null)} role="dialog" aria-label="รูปกิจกรรม">
          <img src={lightbox.photoUrl} alt={lightbox.reportDetail} onClick={(e) => e.stopPropagation()} />
          <p className="care-lightbox-caption">
            {formatDayLabel(lightbox.createdAt)} · {formatTime(lightbox.createdAt)} น.
          </p>
          <button type="button" className="care-lightbox-close" aria-label="ปิด">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
