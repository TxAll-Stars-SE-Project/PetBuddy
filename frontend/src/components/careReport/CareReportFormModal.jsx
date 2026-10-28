import { useEffect, useRef, useState } from "react";
import "./careReport.css";

const MAX_DETAIL_LENGTH = 1000;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB ตาม docs/API.md § PART 3: 6.1
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ชิปช่วยพิมพ์ — แตะแล้วต่อท้ายข้อความ ช่วยให้พี่เลี้ยงรายงานจากมือถือได้เร็ว
const QUICK_NOTES = [
  { emoji: "🍚", text: "ทานอาหารเรียบร้อย" },
  { emoji: "💧", text: "ดื่มน้ำแล้ว" },
  { emoji: "🚶", text: "พาเดินเล่น" },
  { emoji: "🎾", text: "เล่นด้วยกัน" },
  { emoji: "😴", text: "นอนพักผ่อน" },
  { emoji: "💊", text: "ให้ยาตามเวลา" },
];

function validatePhoto(file) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP";
  if (file.size > MAX_PHOTO_SIZE) return "ไฟล์รูปต้องมีขนาดไม่เกิน 5MB";
  return "";
}

// CareReportFormModal — ฟอร์มส่งรายงานการดูแลของพี่เลี้ยง (US7-3, UI only)
// ไม่เรียก API เอง: ส่ง { reportDetail, photo } ออกทาง onSubmit ให้ parent จัดการ
export default function CareReportFormModal({ subtitle, onClose, onSubmit, isSubmitting = false, submitError = "" }) {
  const [detail, setDetail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [errors, setErrors] = useState({ detail: "", photo: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, isSubmitting]);

  const appendQuickNote = (text) => {
    setDetail((prev) => {
      const base = prev.trimEnd();
      return (base ? `${base} ${text}` : text).slice(0, MAX_DETAIL_LENGTH);
    });
    setErrors((prev) => ({ ...prev, detail: "" }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้หลังลบ
    if (!file) return;
    const error = validatePhoto(file);
    setErrors((prev) => ({ ...prev, photo: error }));
    if (!error) setPhoto(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const reportDetail = detail.trim();
    if (!reportDetail) {
      setErrors((prev) => ({ ...prev, detail: "กรุณาเขียนบันทึกกิจกรรมอย่างน้อย 1 ข้อความ" }));
      return;
    }
    onSubmit({ reportDetail, photo });
  };

  return (
    <div className="delete-modal-overlay" onClick={isSubmitting ? undefined : onClose}>
      <form
        className="delete-modal care-report-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2>ส่งรายงานการดูแล</h2>
        {subtitle && <p className="care-report-sub">{subtitle}</p>}

        <label className="care-report-label" htmlFor="care-report-detail">
          บันทึกกิจกรรม <span className="care-report-required">*</span>
        </label>
        <textarea
          id="care-report-detail"
          className={`care-report-textarea${errors.detail ? " has-error" : ""}`}
          rows={4}
          maxLength={MAX_DETAIL_LENGTH}
          placeholder="เช่น น้องทานอาหารเม็ดหมด อารมณ์ดี วิ่งเล่นรอบสวน"
          value={detail}
          disabled={isSubmitting}
          onChange={(e) => {
            setDetail(e.target.value);
            if (errors.detail) setErrors((prev) => ({ ...prev, detail: "" }));
          }}
        />
        <div className="care-report-field-foot">
          <span className="care-report-error">{errors.detail}</span>
          <span className="care-report-counter">
            {detail.length}/{MAX_DETAIL_LENGTH}
          </span>
        </div>

        <div className="care-report-quick" aria-label="ข้อความด่วน">
          {QUICK_NOTES.map((q) => (
            <button
              key={q.text}
              type="button"
              className="chip-btn"
              disabled={isSubmitting}
              onClick={() => appendQuickNote(q.text)}
            >
              {q.emoji} {q.text}
            </button>
          ))}
        </div>

        <span className="care-report-label">
          รูปถ่ายกิจกรรม <span className="care-report-optional">(ไม่บังคับ)</span>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_PHOTO_TYPES.join(",")}
          capture="environment"
          hidden
          onChange={handlePhotoChange}
        />
        {photoPreview ? (
          <div className="care-report-photo-preview">
            <img src={photoPreview} alt="ตัวอย่างรูปที่จะส่ง" />
            <div className="care-report-photo-actions">
              <button type="button" className="chip-btn" disabled={isSubmitting} onClick={() => fileInputRef.current?.click()}>
                เปลี่ยนรูป
              </button>
              <button type="button" className="chip-btn" disabled={isSubmitting} onClick={removePhoto}>
                ลบรูป
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={`care-report-dropzone${errors.photo ? " has-error" : ""}`}
            disabled={isSubmitting}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="care-report-dropzone-icon" aria-hidden="true">📷</span>
            <span>แตะเพื่อถ่ายรูปหรือเลือกจากเครื่อง</span>
            <small>JPG, PNG, WebP · ไม่เกิน 5MB</small>
          </button>
        )}
        {errors.photo && <p className="care-report-error">{errors.photo}</p>}

        <p className="care-report-hint">ส่งแล้วไม่สามารถแก้ไขได้ เจ้าของสัตว์เลี้ยงจะเห็นรายงานนี้ทันที</p>
        {submitError && <p className="care-report-submit-error">{submitError}</p>}

        <div className="delete-modal-actions">
          <button type="button" className="delete-cancel-button" disabled={isSubmitting} onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="profile-save-button" disabled={isSubmitting}>
            {isSubmitting ? "กำลังส่ง…" : "ส่งรายงาน"}
          </button>
        </div>
      </form>
    </div>
  );
}
