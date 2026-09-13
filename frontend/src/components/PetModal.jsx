import { useEffect } from "react";

function PetModal({
  pet,
  mode, // "add", "edit", or "view"
  error,
  onChange,
  onClose,
  onSave,
  onDelete,
  onSwitchToEdit,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    return () => {
      if (pet.photo && pet.photo.startsWith("blob:")) {
        URL.revokeObjectURL(pet.photo);
      }
    };
  }, [pet.photo]);

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
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>อัปโหลดรูปภาพ (Photo)</label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                className="profile-input"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const MAX_FILE_SIZE = 5 * 1024 * 1024;
                  if (file.size > MAX_FILE_SIZE) {
                    alert("ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB");
                    return;
                  }

                  if (pet.photo && pet.photo.startsWith("blob:")) {
                    URL.revokeObjectURL(pet.photo);
                  }
                  onChange("photoFile", file); 
                  onChange("photo", URL.createObjectURL(file)); 
                }}
              />
            </div>

            <div className="pet-modal-full-width">
              <label className="profile-label" style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>หมายเหตุ (Notes)</label>
              <textarea 
                className="profile-input" 
                style={{ height: "60px", resize: "vertical" }} 
                placeholder="เช่น แพ้อาหาร" 
                value={pet.notes || ""} 
                onChange={(e) => onChange("notes", e.target.value)} 
              />
            </div>
          </div>
        )}

        {error && (
          <div className="delete-error" style={{ marginTop: "12px", fontSize: "13px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div className="delete-modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isEdit && (
            <button
              type="button"
              className="profile-delete-button"
              style={{ padding: "8px 12px", fontSize: "13px", flex: "none" }}
              onClick={onDelete}
            >
              ลบสัตว์เลี้ยง
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
                <button type="button" className="delete-cancel-button" onClick={onClose}>
                  ยกเลิก
                </button>
                <button type="button" className="delete-confirm-button" onClick={onSave}>
                  บันทึก
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