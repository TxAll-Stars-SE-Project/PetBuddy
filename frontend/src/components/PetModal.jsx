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
  
    return (
      <div className="delete-modal-overlay">
        <div className="delete-modal" style={{ maxWidth: "380px" }}>
          <h2>
            {isView
              ? `ข้อมูลของ ${pet.name || "สัตว์เลี้ยง"}`
              : isEdit
              ? "แก้ไขข้อมูลสัตว์เลี้ยง"
              : "เพิ่มสัตว์เลี้ยงใหม่"}
          </h2>
  
          {isView ? (
            /* Small compact view mode */
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", textAlign: "left", fontSize: "14px" }}>
              {pet.photo && (
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <img src={pet.photo} alt={pet.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />
                </div>
              )}
              <div><b>ชื่อ:</b> {pet.name || "-"}</div>
              <div><b>สายพันธุ์ (Species):</b> {pet.species || "-"}</div>
              <div><b>พันธุ์ (Breed):</b> {pet.breed || "-"}</div>
              <div><b>อายุ:</b> {pet.age || "-"}</div>
              <div><b>หมายเหตุ:</b> {pet.notes || "-"}</div>
            </div>
          ) : (
            /* Input form for Add / Edit */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", textAlign: "left" }}>
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                {pet.photo ? (
                  <img 
                    src={pet.photo} 
                    alt="Pet Preview" 
                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ccc" }} 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=Error"; }} // ดัก Error ถ้ารูปพัง
                  />
                ) : (
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#eee", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "30px", border: "1px dashed #ccc", color: "#999" }}>
                    🐾
                  </div>
                )}
              </div>
              <div>
                <label className="profile-label" style={{ display: "block", marginBottom: "2px", fontSize: "13px" }}>ชื่อสัตว์เลี้ยง (Name)</label>
                <input
                  type="text"
                  className="profile-input"
                  style={{ width: "100%" }}
                  placeholder="เช่น บราวนี่"
                  value={pet.name || ""}
                  onChange={(e) => onChange("name", e.target.value)}
                />
              </div>
  
              <div>
                <label className="profile-label" style={{ display: "block", marginBottom: "2px", fontSize: "13px" }}>สายพันธุ์สัตว์ (Species)</label>
                <input
                  type="text"
                  className="profile-input"
                  style={{ width: "100%" }}
                  placeholder="เช่น สุนัข, แมว"
                  value={pet.species || ""}
                  onChange={(e) => onChange("species", e.target.value)}
                />
              </div>
  
              <div>
                <label className="profile-label" style={{ display: "block", marginBottom: "2px", fontSize: "13px" }}>พันธุ์ (Breed)</label>
                <input
                  type="text"
                  className="profile-input"
                  style={{ width: "100%" }}
                  placeholder="เช่น โกลเด้น รีทรีฟเวอร์"
                  value={pet.breed || ""}
                  onChange={(e) => onChange("breed", e.target.value)}
                />
              </div>
  
              <div>
                <label className="profile-label" style={{ display: "block", marginBottom: "2px", fontSize: "13px" }}>อายุ (Age)</label>
                <input
                  type="text"
                  className="profile-input"
                  style={{ width: "100%" }}
                  placeholder="เช่น 2 ปี"
                  value={pet.age || ""}
                  onChange={(e) => onChange("age", e.target.value)}
                />
              </div>
  
              <div>
                <label className="profile-label" style={{ display: "block", marginBottom: "2px", fontSize: "13px" }}>รูปภาพ (Photo URL)</label>
                <input
                  type="text"
                  className="profile-input"
                  style={{ width: "100%" }}
                  placeholder="วางลิงก์รูปภาพ"
                  value={pet.photo || ""}
                  onChange={(e) => onChange("photo", e.target.value)}
                />
              </div>
  
              <div>
                <label className="profile-label" style={{ display: "block", marginBottom: "2px", fontSize: "13px" }}>หมายเหตุ (Notes)</label>
                <textarea
                  className="profile-input"
                  style={{ width: "100%", height: "60px", resize: "vertical" }}
                  placeholder="เช่น แพ้อาหาร"
                  value={pet.notes || ""}
                  onChange={(e) => onChange("notes", e.target.value)}
                />
              </div>
            </div>
          )}
  
          {error && (
            <div className="delete-error" style={{ marginTop: "8px", fontSize: "13px" }}>
              {error}
            </div>
          )}
  
          <div className="delete-modal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {isEdit && (
              <button
                type="button"
                className="profile-delete-button"
                style={{ padding: "6px 12px", fontSize: "13px" }}
                onClick={onDelete}
              >
                ลบสัตว์เลี้ยง
              </button>
            )}
  
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              {isView ? (
                <>
                  <button
                    type="button"
                    className="delete-cancel-button"
                    onClick={onClose}
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    className="profile-save-button"
                    onClick={onSwitchToEdit}
                  >
                    แก้ไข
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="delete-cancel-button"
                    onClick={onClose}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="delete-confirm-button"
                    onClick={onSave}
                  >
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