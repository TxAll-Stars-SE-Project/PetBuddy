import { useEffect, useRef, useState } from "react";
import { toast } from "../utils/toast.js";
import AlertBanner from "./ui/AlertBanner.jsx";

const PET_TYPE_OPTIONS = [
  { label: "สุนัข", icon: "🐶", value: "สุนัข" },
  { label: "แมว", icon: "🐱", value: "แมว" },
  { label: "นก", icon: "🐦", value: "นก" },
  { label: "สัตว์แปลก", icon: "🦎", value: "สัตว์แปลก" },
];

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
    <div className="delete-modal-overlay" style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div 
        className="delete-modal pet-modal-container"
        style={{
          maxWidth: "520px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "20px 24px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ margin: "0 0 14px 0", fontSize: "18px", fontWeight: "700", textAlign: "center" }}>
          {isView
            ? `ข้อมูลของ ${pet.name || "สัตว์เลี้ยง"}`
            : isEdit
            ? "แก้ไขข้อมูลสัตว์เลี้ยง"
            : "เพิ่มสัตว์เลี้ยงใหม่"}
        </h2>

        {isView ? (
          /* โหมดดูข้อมูล (View) */
          <div className="pet-modal-view-container" style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {pet.photo && (
              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <img src={pet.photo} alt={pet.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />
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
          <div className="pet-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>
            
            {/* Avatar Image Header */}
            <div className="pet-modal-full-width" style={{ gridColumn: "1 / -1", textAlign: "center", marginBottom: "4px" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title="คลิกเพื่อเลือกหรือเปลี่ยนรูปภาพ"
                style={{
                  width: "72px",
                  height: "72px",
                  margin: "0 auto",
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: "50%",
                }}
              >
                {pet.photo ? (
                  <img 
                    src={pet.photo} 
                    alt="Pet Preview" 
                    style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }}
                    onError={(e) => { e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' style='background:%23eee;'%3E%3Ctext x='50%25' y='50%25' font-size='30' text-anchor='middle' dy='.35em'%3E%26%23128062%3B%3C/text%3E%3C/svg%3E"; }} 
                  />
                ) : (
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", border: "1px solid #d1d5db" }}>
                    🐾
                  </div>
                )}
                <div style={{ position: "absolute", bottom: "0", right: "0", background: "#f97316", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", border: "2px solid #fff" }}>
                  📷
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="profile-label" style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "600" }}>
                ชื่อสัตว์เลี้ยง (Name)
              </label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น บราวนี่"
                value={pet.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px" }}
              />
            </div>

            {/* Species Pill Selector */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600" }}>
                สายพันธุ์สัตว์ (Species)
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {PET_TYPE_OPTIONS.map((option) => {
                  const isSelected = (pet.species || "") === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isSaving || isDeleting}
                      onClick={() => onChange("species", option.value)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 12px",
                        borderRadius: "16px",
                        border: isSelected ? "2px solid #f97316" : "1px solid #d1d5db",
                        backgroundColor: isSelected ? "#fff7ed" : "#ffffff",
                        color: isSelected ? "#c2410c" : "#374151",
                        fontWeight: isSelected ? "600" : "normal",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Breed & Gender */}
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "600" }}>พันธุ์ (Breed)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น โกลเด้น"
                value={pet.breed || ""}
                onChange={(e) => onChange("breed", e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px" }}
              />
            </div>
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "600" }}>เพศ (Gender)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น ผู้, เมีย"
                value={pet.gender || ""}
                onChange={(e) => onChange("gender", e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px" }}
              />
            </div>

            {/* Age & Weight */}
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "600" }}>อายุ (Age)</label>
              <input
                type="text"
                className="profile-input"
                placeholder="เช่น 2 ปี"
                value={pet.age || ""}
                onChange={(e) => onChange("age", e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px" }}
              />
            </div>
            <div>
              <label className="profile-label" style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "600" }}>น้ำหนัก (กก.)</label>
              <input
                type="number"
                step="0.1"
                className="profile-input"
                placeholder="เช่น 12.5"
                value={pet.weight || ""}
                onChange={(e) => onChange("weight", e.target.value)}
                style={{ padding: "8px 10px", fontSize: "13px" }}
              />
            </div>

            {/* Upload Section */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600" }}>
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
                style={{
                  pointerEvents: isSaving || isDeleting ? "none" : "auto",
                  opacity: isSaving || isDeleting ? 0.65 : 1,
                  padding: "8px 12px",
                }}
              >
                <div className="pet-file-upload-left">
                  <button type="button" className="pet-file-choose-btn" disabled={isSaving || isDeleting} style={{ padding: "4px 10px", fontSize: "12px" }}>
                    <span>{pet.photo ? "เปลี่ยนรูป" : "เลือกรูปภาพ"}</span>
                  </button>
                  <div className="pet-file-info" style={{ fontSize: "12px" }}>
                    {pet.photoFile ? (
                      <span className="pet-file-name" title={pet.photoFile.name}>
                        📎 {pet.photoFile.name}
                      </span>
                    ) : pet.photo ? (
                      <span className="pet-file-status">
                        ✓ มีรูปภาพแล้ว
                      </span>
                    ) : (
                      <span className="pet-file-hint">
                        ยังไม่ได้เลือกไฟล์ (ไม่เกิน 5MB)
                      </span>
                    )}
                  </div>
                </div>

                {(pet.photoFile || pet.photo) && (
                  <button
                    type="button"
                    className="pet-file-remove-btn"
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

            {/* Notes Input */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="profile-label" style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "600" }}>หมายเหตุ (Notes)</label>
              <textarea 
                className="profile-input" 
                style={{ height: "48px", resize: "vertical", padding: "8px", fontSize: "13px" }} 
                placeholder="เช่น แพ้อาหาร" 
                value={pet.notes || ""} 
                disabled={isSaving || isDeleting}
                onChange={(e) => onChange("notes", e.target.value)} 
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: "10px" }}>
            <AlertBanner type="error">{error}</AlertBanner>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="delete-modal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isSaving || isDeleting}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                flex: "none",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: isSaving || isDeleting ? "not-allowed" : "pointer",
                opacity: isSaving || isDeleting ? 0.6 : 1,
                transition: "background-color 0.15s ease",
              }}
            >
              {isDeleting ? "กำลังลบ…" : "ลบสัตว์เลี้ยง"}
            </button>
          )}

          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            {isView ? (
              <>
                <button type="button" className="delete-cancel-button" onClick={onClose} style={{ padding: "6px 14px", fontSize: "13px" }}>
                  ปิด
                </button>
                <button type="button" className="profile-save-button" onClick={onSwitchToEdit} style={{ padding: "6px 14px", fontSize: "13px" }}>
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
                  style={{ padding: "6px 14px", fontSize: "13px" }}
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  className="profile-save-button" 
                  onClick={onSave}
                  disabled={isSaving || isDeleting}
                  style={{ padding: "6px 16px", fontSize: "13px", minWidth: "90px" }}
                >
                  {isSaving ? "กำลังบันทึก…" : "บันทึก"}
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