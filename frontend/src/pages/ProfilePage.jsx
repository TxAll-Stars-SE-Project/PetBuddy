import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import { navigate } from "../router.js";
import { api } from "../services/api.js";

import ProfileField from "../components/ProfileField.jsx";
import DeleteAccountModal from "../components/DeleteAccountModal.jsx";
import PetModal from "../components/PetModal.jsx";
import { validateProfile } from "../utils/profileValidation.js";

function ProfilePage() {
  const { user } = useAuth();
  const isSitter = user?.role === "sitter";

  const [profile, setProfile] = useState({
    username: user?.username || "",
    email: user?.email || "",
    tel: user?.tel || "",
    province: user?.province || "",
    city: user?.city || "",
    postalCode: user?.postalCode || "",
    role: user?.role || "owner",
    experience: user?.experience || "",
    thaiId: user?.thaiId || "",
  });

  const [originalProfile, setOriginalProfile] = useState(profile);
  const [errors, setErrors] = useState({});

  // Individual Section Edit States
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingSitter, setIsEditingSitter] = useState(false);

  // Pet States
  const [pets, setPets] = useState(user?.pets || []);
  const [showPetModal, setShowPetModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentPetIndex, setCurrentPetIndex] = useState(null);
  const [activePetForm, setActivePetForm] = useState({
    name: "", species: "", breed: "", age: "", photo: "", notes: "",
  });
  const [petError, setPetError] = useState("");

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("idle");

  // Handlers
  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSaveSection = (sectionType) => {
    const validationErrors = validateProfile(profile);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const updatedUser = { ...user, ...profile, pets };
    localStorage.setItem("pb_user", JSON.stringify(updatedUser));
    setOriginalProfile({ ...profile });
    setErrors({});

    if (sectionType === "account") setIsEditingAccount(false);
    if (sectionType === "address") setIsEditingAddress(false);
    if (sectionType === "sitter") setIsEditingSitter(false);
  };

  const handleCancelSection = (sectionType) => {
    setProfile({ ...originalProfile });
    setErrors({});
    if (sectionType === "account") setIsEditingAccount(false);
    if (sectionType === "address") setIsEditingAddress(false);
    if (sectionType === "sitter") setIsEditingSitter(false);
  };

  // Pet Handlers
  const openAddPetModal = () => {
    setCurrentPetIndex(null);
    setModalMode("add");
    setActivePetForm({ name: "", species: "", breed: "", age: "", photo: "", notes: "" });
    setPetError("");
    setShowPetModal(true);
  };

  const openViewPetModal = (index) => {
    setCurrentPetIndex(index);
    setModalMode("view");
    setActivePetForm({ ...pets[index] });
    setPetError("");
    setShowPetModal(true);
  };

  const openEditPetModal = (index) => {
    setCurrentPetIndex(index);
    setModalMode("edit");
    setActivePetForm({ ...pets[index] });
    setPetError("");
    setShowPetModal(true);
  };

  const handleSavePet = () => {
    if (!activePetForm.name.trim()) {
      setPetError("กรุณากรอกชื่อสัตว์เลี้ยง");
      return;
    }

    const updatedPets = modalMode === "edit" && currentPetIndex !== null
      ? pets.map((p, idx) => (idx === currentPetIndex ? activePetForm : p))
      : [...pets, activePetForm];

    setPets(updatedPets);
    localStorage.setItem("pb_user", JSON.stringify({ ...user, ...profile, pets: updatedPets }));
    setShowPetModal(false);
  };

  const handleRemoveCurrentModalPet = () => {
    if (currentPetIndex !== null) {
      const updatedPets = pets.filter((_, index) => index !== currentPetIndex);
      setPets(updatedPets);
      localStorage.setItem("pb_user", JSON.stringify({ ...user, ...profile, pets: updatedPets }));
      setShowPetModal(false);
    }
  };

  // Delete Account Handler
  const handleDelete = async () => {
    setDeleteError("");
    if (!deletePassword.trim()) {
      setDeleteError("กรุณากรอกรหัสผ่าน");
      return;
    }
    setDeleteStatus("submitting");
    try {
      await api.delete("/auth/account", { password: deletePassword });
      localStorage.removeItem("pb_token");
      localStorage.removeItem("pb_user");
      setShowDeleteModal(false);
      navigate("/register");
    } catch (err) {
      setDeleteError(err.status === 401 ? "รหัสผ่านไม่ถูกต้อง" : "ไม่สามารถลบบัญชีได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleteStatus("idle");
    }
  };

  // Reusable header component rendering helper
  const renderSectionHeader = (title, isEditing, onEdit, onCancel, onSave) => (
    <div className="profile-section-header">
      <h2>{title}</h2>
      {!isEditing ? (
        <button type="button" className="profile-save-button" onClick={onEdit}>
          แก้ไข
        </button>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="profile-cancel-button" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="profile-save-button" onClick={onSave}>
            บันทึก
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Navbar />
      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-avatar">
            {(profile.username || "U").charAt(0).toUpperCase()}
          </div>
          <h1>โปรไฟล์ของฉัน</h1>
          <p className="profile-role">
            {isSitter ? "🐾 พี่เลี้ยงสัตว์" : "🐶 เจ้าของสัตว์เลี้ยง"}
          </p>

          {/* Account Section */}
          <section className="profile-section">
            {renderSectionHeader(
              "ข้อมูลบัญชี",
              isEditingAccount,
              () => { setOriginalProfile({ ...profile }); setIsEditingAccount(true); },
              () => handleCancelSection("account"),
              () => handleSaveSection("account")
            )}
            <ProfileField label="ชื่อผู้ใช้" field="username" value={profile.username} isEditing={isEditingAccount} error={errors.username} onChange={handleChange} />
            <ProfileField label="อีเมล" field="email" type="email" value={profile.email} isEditing={isEditingAccount} error={errors.email} onChange={handleChange} />
            <ProfileField label="เบอร์โทร" field="tel" type="tel" value={profile.tel} isEditing={isEditingAccount} error={errors.tel} onChange={handleChange} />
          </section>

          {/* Address Section */}
          <section className="profile-section">
            {renderSectionHeader(
              "ข้อมูลที่อยู่",
              isEditingAddress,
              () => { setOriginalProfile({ ...profile }); setIsEditingAddress(true); },
              () => handleCancelSection("address"),
              () => handleSaveSection("address")
            )}
            <ProfileField label="จังหวัด" field="province" value={profile.province} isEditing={isEditingAddress} error={errors.province} onChange={handleChange} />
            <ProfileField label="เมือง/อำเภอ" field="city" value={profile.city} isEditing={isEditingAddress} error={errors.city} onChange={handleChange} />
            <ProfileField label="รหัสไปรษณีย์" field="postalCode" value={profile.postalCode} isEditing={isEditingAddress} error={errors.postalCode} onChange={handleChange} />
          </section>

          {/* Sitter Section */}
          {isSitter && (
            <section className="profile-section">
              {renderSectionHeader(
                "ข้อมูลพี่เลี้ยงสัตว์",
                isEditingSitter,
                () => { setOriginalProfile({ ...profile }); setIsEditingSitter(true); },
                () => handleCancelSection("sitter"),
                () => handleSaveSection("sitter")
              )}
              <ProfileField label="ประสบการณ์" field="experience" value={profile.experience} isEditing={isEditingSitter} error={errors.experience} onChange={handleChange} />
              <div className="profile-row">
                <span className="profile-label">เลขบัตรประชาชน</span>
                <span className="profile-value">{profile.thaiId ? `*********${profile.thaiId.slice(-4)}` : "-"}</span>
              </div>
            </section>
          )}

          {/* Pet Section */}
          {!isSitter && (
            <section className="profile-section" style={{ borderTop: "2px solid #eee", paddingTop: "20px" }}>
              <div className="profile-section-header">
                <h2>ข้อมูลสัตว์เลี้ยง</h2>
                <button type="button" className="profile-save-button" onClick={openAddPetModal}>
                  + เพิ่มสัตว์เลี้ยง
                </button>
              </div>
              <div>
                {pets && pets.length > 0 ? (
                  pets.map((pet, index) => (
                    <div key={index} style={{ background: "#f9f9f9", padding: "10px 14px", borderRadius: "8px", marginBottom: "8px", border: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "15px", fontWeight: "600" }}>🐾 {pet.name}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button type="button" className="profile-edit-button" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => openViewPetModal(index)} title="ดูข้อมูล">🦹‍♂️​</button>
                        <button type="button" className="profile-edit-button" style={{ padding: "4px 10px", fontSize: "12px", background: "#f0ad4e", borderColor: "#eea236", color: "#fff" }} onClick={() => openEditPetModal(index)} title="แก้ไขข้อมูล">🖋️​</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="profile-row">
                    <span className="profile-value" style={{ width: "100%", textAlign: "center", color: "#888" }}>- ยังไม่มีข้อมูลสัตว์เลี้ยง -</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* General Page Actions */}
          <div className="profile-actions" style={{ marginTop: "20px" }}>
            <div className="profile-actions-row">
              <button type="button" className="profile-delete-button" onClick={() => { setDeletePassword(""); setDeleteError(""); setDeleteStatus("idle"); setShowDeleteModal(true); }}>
                ลบบัญชี
              </button>
            </div>
            <button type="button" className="profile-confirm-button" onClick={() => navigate("/")}>
              ยืนยันหน้าหลัก
            </button>
          </div>
        </div>

        {showPetModal && (
          <PetModal
            pet={activePetForm}
            mode={modalMode}
            error={petError}
            onChange={(field, value) => {
              setActivePetForm((prev) => ({ ...prev, [field]: value }));
              if (field === "name") setPetError("");
            }}
            onClose={() => { setShowPetModal(false); setPetError(""); }}
            onSave={handleSavePet}
            onDelete={handleRemoveCurrentModalPet}
            onSwitchToEdit={() => setModalMode("edit")}
          />
        )}

        {showDeleteModal && (
          <DeleteAccountModal
            password={deletePassword}
            error={deleteError}
            status={deleteStatus}
            onPasswordChange={setDeletePassword}
            onCancel={() => { if (deleteStatus !== "submitting") setShowDeleteModal(false); }}
            onConfirm={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default ProfilePage;