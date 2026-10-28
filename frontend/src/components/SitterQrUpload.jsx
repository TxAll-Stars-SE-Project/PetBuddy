import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "../utils/toast.js";

const VALID_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Row "QR Code รับชำระเงิน" ในหน้าโปรไฟล์ของ Pet Sitter
 * - view mode: แสดง thumbnail (กดเพื่อขยาย) หรือข้อความว่ายังไม่ได้อัปโหลด
 * - edit mode: เลือก/ลากไฟล์ใหม่ (ยังไม่ส่งขึ้น server จนกว่าจะกดบันทึกของ section)
 *   กด ✕ ได้เฉพาะไฟล์ที่เพิ่งเลือก (ยกเลิกกลับไปใช้รูปเดิม) — API ยังไม่มี endpoint ลบ QR
 * - error: ข้อความ error จากฝั่งฟอร์ม (เช่น ยังไม่ได้เลือก QR ตอนสร้างครั้งแรก)
 */
function SitterQrUpload({ qrCodeUrl, isEditing, file, error: formError, onSelectFile, onRemove }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => { if (!isEditing) setFileError(""); }, [isEditing]);

  const error = fileError || formError;

  const processFile = (picked) => {
    if (!picked) return;
    if (!VALID_TYPES.includes(picked.type)) {
      setFileError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น");
      return;
    }
    if (picked.size > MAX_FILE_SIZE) {
      setFileError(`ไฟล์ใหญ่เกิน 5 MB (${formatSize(picked.size)})`);
      toast("ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB", "error");
      return;
    }
    setFileError("");
    onSelectFile(picked);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const currentUrl = file ? previewUrl : qrCodeUrl || "";

  return (
    <div className="profile-row">
      <span className="profile-label">QR Code รับชำระเงิน</span>

      {!isEditing ? (
        <div className="qr-value">
          {qrCodeUrl ? (
            <>
              <img
                className="qr-thumb"
                src={qrCodeUrl}
                alt="QR Code รับชำระเงิน"
                title="คลิกเพื่อดูภาพขยาย"
                onClick={() => setShowLightbox(true)}
              />
              <span className="qr-hint-link">คลิกที่รูปเพื่อขยาย</span>
            </>
          ) : (
            <span className="qr-empty">ยังไม่ได้อัปโหลด</span>
          )}
        </div>
      ) : (
        <div className="profile-field-container">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg, image/png, image/jpg, image/webp"
            hidden
            onChange={(e) => {
              processFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div
            className={`pet-file-upload-box qr-upload-box${isDragging ? " pet-file-upload-box--dragover" : ""}${error ? " qr-upload-box--error" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="pet-file-upload-left">
              {currentUrl ? (
                <img className="qr-preview" src={currentUrl} alt="ตัวอย่าง QR Code" />
              ) : (
                <div className="qr-placeholder">▦</div>
              )}
              <div className="qr-info">
                {currentUrl ? (
                  <>
                    <span className="pet-file-name">{file ? file.name : "QR Code ปัจจุบัน"}</span>
                    <span className="pet-file-status">
                      {file ? `✓ เลือกแล้ว · ${formatSize(file.size)} (ยังไม่ได้บันทึก)` : "✓ มีรูปอยู่แล้ว"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="pet-file-name">ลากรูปมาวาง หรือกดเลือกรูป</span>
                    <span className="pet-file-hint">JPG / PNG / WEBP ไม่เกิน 5 MB</span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="pet-file-choose-btn"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              {currentUrl ? "เปลี่ยนรูป" : "เลือกรูปภาพ"}
            </button>
            {file && (
              <button
                type="button"
                className="pet-file-remove-btn"
                title="ยกเลิกรูปที่เลือก"
                onClick={(e) => { e.stopPropagation(); setFileError(""); onRemove(); }}
              >
                ✕
              </button>
            )}
          </div>
          {error && <div className="qr-error">{error}</div>}
          <div className="qr-edit-note">ใช้สำหรับให้เจ้าของสัตว์เลี้ยงสแกนชำระเงิน</div>
        </div>
      )}

      {showLightbox && qrCodeUrl && (
        <div className="qr-lightbox" onClick={() => setShowLightbox(false)}>
          <div className="qr-lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="qr-lightbox-close" aria-label="ปิด" onClick={() => setShowLightbox(false)}>✕</button>
            <img src={qrCodeUrl} alt="QR Code รับชำระเงิน" />
            <p>QR Code รับชำระเงิน</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SitterQrUpload;
