import { useEffect, useRef, useState } from "react";
import { toast } from "../utils/toast.js";
import AlertBanner from "./ui/AlertBanner.jsx";

function PetModal({
  pet,
  mode, // "add", "edit", or "view"
  error,
  isSaving = false,
  isDeleting = false,
  onChange,
  onClose,
  onSave,
  onDelete,
  onSwitchToEdit,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (pet.photo && pet.photo.startsWith("blob:")) {
        URL.revokeObjectURL(pet.photo);
      }
    };
  }, [pet.photo]);

  const processFile = (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG หรือ WEBP)", "error");
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast("ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB", "error");
      return;
    }

    if (pet.photo && pet.photo.startsWith("blob:")) {
      URL.revokeObjectURL(pet.photo);
    }
    onChange("photoFile", file);
    onChange("photo", URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    if (pet.photo && pet.photo.startsWith("blob:")) {
      URL.revokeObjectURL(pet.photo);
    }
    onChange("photoFile", null);
    onChange("photo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal pet-modal-container">
        <h2>
          {isView
            ? `ข้อมูลของ ${pet.name || "สัตว์เลี้ยง"}`
            : isEdit
            ? "แก้ไขข้อมูลสัตว์เลี้ยง"
            : "เพิ่มสัตว์เลี้ยงใหม่"}
        </h2>

        {isView ? (
          /* โหมดดูข้อมูล (View) */
          <div className="pet-modal-view-container">
            {pet.photo && (
              <div className="pet-modal-preview-wrapper">
                <img src={pet.photo} alt={pet.name} className="pet-modal-preview-img" />
              </div>
            )}
            <div><b>ชื่อ:</b> {pet.name || "-"}</div>
            <div><b>สายพันธุ์ (Species):</b> {pet.species || "-"}</div>
            <div><b>พันธุ์ (Breed):</b> {pet.breed || "-"}</div>
            <div><b>เพศ (Gender):</b> {pet.gender || "-"}</div>
            <div><b>อายุ:</b> {pet.age || "-"}</div>
            <div><b>น้ำหนัก:</b> {pet.weight ? `${pet.weight} กก.` : "-"}</div>
            <div><b>หมายเหตุ:</b> {pet.notes || "-"}</div>
          </div>
        ) : (
          /* โหมดกรอกข้อมูล (Add / Edit) */
          <div className="pet-modal-grid">
            
            <div className="pet-modal-full-width pet-modal-preview-wrapper">
              <div
                className="pet-modal-avatar-clickable"
                onClick={() => fileInputRef.current?.click()}
                title="คลิกเพื่อเลือกหรือเปลี่ยนรูปภาพ"
              >
                {pet.photo ? (
                  <img 
                    src={pet.photo} 
                    alt="Pet Preview" 
                    className="pet-modal-preview-img"
                    onError={(e) => { e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' style='background:%23eee;'%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.35em'%3E%26%23128062%3B%3C/text%3E%3C/svg%3E"; }} 
                  />
                ) : (
                  <div className="pet-modal-placeholder">🐾</div>
                )}
                <div className="pet-modal-avatar-badge" title="อัปโหลดรูปภาพ">
                  📷
                </div>
              </div>
            </div>

            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>ชื่อสัตว์เลี้ยง (Name)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น บราวนี่"
                value={pet.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>สายพันธุ์สัตว์ (Species)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น สุนัข, แมว"
                value={pet.species || ""}
                onChange={(e) => onChange("species", e.target.value)}
              />
            </div>

            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>พันธุ์ (Breed)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น โกลเด้น รีทรีฟเวอร์"
                value={pet.breed || ""}
                onChange={(e) => onChange("breed", e.target.value)}
              />
            </div>
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>เพศ (Gender)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น ผู้, เมีย"
                value={pet.gender || ""}
                onChange={(e) => onChange("gender", e.target.value)}
              />
            </div>

            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>อายุ (Age)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น 2 ปี"
                value={pet.age || ""}
                onChange={(e) => onChange("age", e.target.value)}
              />
            </div>
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>น้ำหนัก (Weight - กก.)</label>
              <input
                type="number"
                step="0.1"
                className="profile-input"
                placeholder="เช่น 12.5"
                value={pet.weight || ""}
                onChange={(e) => onChange("weight", e.target.value)}
              />
            </div>

            <div className="pet-modal-full-width">
              <label className="profile-label" style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>
                รูปภาพสัตว์เลี้ยง (Photo)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/jpg, image/webp"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <div 
                className={`pet-file-upload-box ${isDragging ? "pet-file-upload-box--dragover" : ""}`}
                onClick={() => {
                  if (!isSaving && !isDeleting) fileInputRef.current?.click();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                title={isSaving || isDeleting ? "กำลังประมวลผล..." : "คลิกหรือลากไฟล์รูปภาพมาวางที่นี่"}
                style={{
                  pointerEvents: isSaving || isDeleting ? "none" : "auto",
                  opacity: isSaving || isDeleting ? 0.65 : 1,
                }}
              >
                <div className="pet-file-upload-left">
                  <button type="button" className="pet-file-choose-btn" disabled={isSaving || isDeleting}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>{pet.photo ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}</span>
                  </button>
                  <div className="pet-file-info">
                    {pet.photoFile ? (
                      <span className="pet-file-name" title={pet.photoFile.name}>
                        📎 {pet.photoFile.name}
                        <span className="pet-file-size">
                          {" "}({(pet.photoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </span>
                    ) : pet.photo ? (
                      <span className="pet-file-status">
                        ✓ มีรูปภาพแล้ว <span className="pet-file-hint">(คลิกเพื่อเปลี่ยน)</span>
                      </span>
                    ) : (
                      <span className="pet-file-hint">
                        ยังไม่ได้เลือกไฟล์ (JPG, PNG ไม่เกิน 5MB)
                      </span>
                    )}
                  </div>
                </div>

                {(pet.photoFile || pet.photo) && (
                  <button
                    type="button"
                    className="pet-file-remove-btn"
                    title="ลบรูปภาพนี้"
                    disabled={isSaving || isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSaving && !isDeleting) handleRemovePhoto();
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="pet-modal-full-width">
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>หมายเหตุ (Notes)</label>
              <textarea 
                className="profile-input" 
                style={{ height: "60px", resize: "vertical" }} 
                placeholder="เช่น แพ้อาหาร" 
                value={pet.notes || ""} 
                disabled={isSaving || isDeleting}
                onChange={(e) => onChange("notes", e.target.value)} 
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: "14px" }}>
            <AlertBanner type="error">{error}</AlertBanner>
          </div>
        )}

        <div className="delete-modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isEdit && (
            <button
              type="button"
              className="profile-delete-button"
              style={{ padding: "8px 14px", fontSize: "13px", flex: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={onDelete}
              disabled={isSaving || isDeleting}
            >
              {isDeleting && <span className="spinner" aria-hidden="true"></span>}
              <span>{isDeleting ? "กำลังลบ…" : "ลบสัตว์เลี้ยง"}</span>
            </button>
          )}

          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            {isView ? (
              <>
                <button type="button" className="delete-cancel-button" onClick={onClose}>
                  ปิด
                </button>
                <button type="button" className="profile-save-button" onClick={onSwitchToEdit}>
                  แก้ไข
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  className="delete-cancel-button" 
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  className="profile-save-button" 
                  onClick={onSave}
                  disabled={isSaving || isDeleting}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", minWidth: "110px" }}
                >
                  {isSaving && <span className="spinner" aria-hidden="true"></span>}
                  <span>{isSaving ? "กำลังบันทึก…" : "บันทึก"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PetModal;