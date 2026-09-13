import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import provincesData from "../assets/thai-address/province.json";
import districtsData from "../assets/thai-address/district.json";
import subDistrictsData from "../assets/thai-address/sub_district.json";

import ProfileField from "../components/ProfileField.jsx";
import DeleteAccountModal from "../components/DeleteAccountModal.jsx";
import PetModal from "../components/PetModal.jsx";
import { validateProfile } from "../utils/profileValidation.js";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const isSitter = user?.role === "sitter";

  const [profile, setProfile] = useState({
    username: user?.username || "",
    email: user?.email || "",
    tel: user?.tel || "",
    address: user?.address || "",
    province: user?.province || "",
    district: user?.district || "",      
    subdistrict: user?.subdistrict || "", 
    postalCode: user?.postalCode || "",
    role: user?.role || "owner",
    experience: user?.experience || "",
    thaiId: user?.thaiId || "",
  });

  const [originalProfile, setOriginalProfile] = useState(profile);
  const [errors, setErrors] = useState({});

  // GET /api/users/me
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get("/users/me");
        const data = res.data?.data;

        if (data) {
          const loadedProfile = {
            username: data.username || "",
            email: data.email || "",
            tel: data.tel || "",
            address: data.address || "",
            province: data.province || "",
            district: data.district || data.city || "",
            subdistrict: data.subdistrict || "",
            postalCode: data.postalCode || "",
            role: data.role || "owner",
            experience: data.experience || "",
            thaiId: data.thaiId || "",
          };

          setProfile(loadedProfile);
          setOriginalProfile(loadedProfile);
          

          const fullUserData = { ...user, ...loadedProfile, pets: data.pets || [] };
          if (setUser) setUser(fullUserData);

          const safeUserData = {
            id: fullUserData.id,
            username: fullUserData.username,
            email: fullUserData.email,
            role: fullUserData.role,
          };
          localStorage.setItem("pb_user", JSON.stringify(safeUserData))

          if (data.pets && Array.isArray(data.pets)) {
            const mappedPets = data.pets.map((p) => ({
              petId: p.petId || p.petid || p.id || null,
              name: p.name || "",
              species: p.species || "",
              breed: p.breed || "",
              gender: p.gender || "", 
              weight: p.weight || "",
              age: p.age !== null && p.age !== undefined ? p.age : "",
              photo: p.imageUrl || "",
              notes: p.allergy ? `แพ้: ${p.allergy}` : "",
            }));
            setPets(mappedPets);
          }
        }
      } catch (err) {
        console.error("ดึงข้อมูลโปรไฟล์ไม่สำเร็จ:", err);
      }
    };

    fetchUserProfile();
  }, []);

  // Drop down address states
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubdistricts, setAvailableSubdistricts] = useState([]);
  const [availableZipcodes, setAvailableZipcodes] = useState([]);

  useEffect(() => {
    if (profile.province) {
      const prov = provincesData.find(p => p.name_th === profile.province);
      if (prov) {
        const filteredDistricts = districtsData.filter(d => d.province_id === prov.id);
        setAvailableDistricts(filteredDistricts);
        
        if (profile.district) {
          const dist = filteredDistricts.find(d => d.name_th === profile.district);
          if (dist) {
            const filteredSubdistricts = subDistrictsData.filter(s => s.district_id === dist.id);
            setAvailableSubdistricts(filteredSubdistricts);
            
            if (profile.subdistrict) {
              const sub = filteredSubdistricts.find(s => s.name_th === profile.subdistrict);
              if (sub) setAvailableZipcodes(sub.zip_code ? [sub.zip_code] : []);
            }
          }
        }
      }
    }
  }, [profile.province, profile.district, profile.subdistrict]);

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setProfile((prev) => ({
      ...prev,
      province: selectedProvince,
      district: "", 
      subdistrict: "",
      postalCode: ""
    }));

    const prov = provincesData.find((p) => p.name_th === selectedProvince);
    setAvailableDistricts(prov ? districtsData.filter(d => d.province_id === prov.id) : []);
    setAvailableSubdistricts([]);
    setAvailableZipcodes([]);
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setProfile((prev) => ({
      ...prev,
      district: selectedDistrict,
      subdistrict: "",
      postalCode: ""
    }));

    const dist = availableDistricts.find((d) => d.name_th === selectedDistrict);
    if (dist) {
      const filteredSubdistricts = subDistrictsData.filter(s => s.district_id === dist.id);
      setAvailableSubdistricts(filteredSubdistricts);
      setAvailableZipcodes([]);
    } else {
      setAvailableSubdistricts([]);
      setAvailableZipcodes([]);
    }
  };

  const handleSubdistrictChange = (e) => {
    const selectedSub = e.target.value;
    const sub = availableSubdistricts.find((s) => s.name_th === selectedSub);

    setProfile((prev) => ({
      ...prev,
      subdistrict: selectedSub,
      postalCode: sub && sub.zip_code ? sub.zip_code.toString() : ""
    }));

    if (sub && sub.zip_code) {
      setAvailableZipcodes([sub.zip_code]);
    } else {
      setAvailableZipcodes([]);
    }
  };

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingSitter, setIsEditingSitter] = useState(false);

  const [pets, setPets] = useState(user?.pets || []);
  const [showPetModal, setShowPetModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentPetIndex, setCurrentPetIndex] = useState(null);
  const [activePetForm, setActivePetForm] = useState({
    petId: null, name: "", species: "", breed: "", age: "", photo: "", notes: "",
    gender: "", weight: "", photoFile: null
  });
  const [petError, setPetError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("idle");

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSaveSection = async (sectionType) => {
    const allErrors = validateProfile(profile);
    let sectionErrors = {};

    if (sectionType === "account") {
      if (allErrors.username) sectionErrors.username = allErrors.username;
      if (allErrors.email) sectionErrors.email = allErrors.email;
      if (allErrors.tel) sectionErrors.tel = allErrors.tel;
    } else if (sectionType === "address") {
      if (allErrors.address) sectionErrors.address = allErrors.address;
      if (allErrors.province) sectionErrors.province = allErrors.province;
      if (allErrors.district) sectionErrors.district = allErrors.district;
      if (allErrors.subdistrict) sectionErrors.subdistrict = allErrors.subdistrict;
      if (allErrors.postalCode) sectionErrors.postalCode = allErrors.postalCode;
    } else if (sectionType === "sitter") {
      if (allErrors.experience && profile.experience.trim() !== "") {
        sectionErrors.experience = allErrors.experience;
      }
    }

    setErrors(sectionErrors);

    if (Object.keys(sectionErrors).length > 0) return;
    try {
      const payload = {
        username: profile.username,
        email: profile.email,
        tel: profile.tel,
        province: profile.province,
        district: profile.district,  
        subdistrict: profile.subdistrict,
        postalCode: profile.postalCode,
        address: profile.address,
        role: profile.role,        
      };

      if (profile.role === "sitter") {
        payload.experience = profile.experience;
      }

      await api.put("/users/me", payload);

      const updatedUser = { ...user, ...profile, pets };
      if (setUser) setUser(updatedUser);
      setOriginalProfile({ ...profile });
      setErrors({});

      if (sectionType === "account") setIsEditingAccount(false);
      if (sectionType === "address") setIsEditingAddress(false);
      if (sectionType === "sitter") setIsEditingSitter(false);
      
      alert("บันทึกข้อมูลสำเร็จ!");

    } catch (error) {
      console.error("Save error:", error);
      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCancelSection = (sectionType) => {
    setProfile({ ...originalProfile });
    setErrors({});
    if (sectionType === "account") setIsEditingAccount(false);
    if (sectionType === "address") setIsEditingAddress(false);
    if (sectionType === "sitter") setIsEditingSitter(false);
  };

  const openAddPetModal = () => {
    setCurrentPetIndex(null);
    setModalMode("add");
    setActivePetForm({ petId: null, name: "", species: "", breed: "", age: "", photo: "", notes: "", gender: "", weight: "", photoFile: null });
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

  const handleSavePet = async () => {
    if (!activePetForm.name.trim()) {
      setPetError("กรุณากรอกชื่อสัตว์เลี้ยง");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", activePetForm.name.trim());
      if (activePetForm.species) formData.append("species", activePetForm.species.trim());
      if (activePetForm.breed) formData.append("breed", activePetForm.breed.trim());
      if (activePetForm.gender) formData.append("gender", activePetForm.gender.trim());
      if (activePetForm.weight) formData.append("weight", activePetForm.weight); 
      if (activePetForm.age) formData.append("age", activePetForm.age);
      if (activePetForm.notes) formData.append("notes", activePetForm.notes.trim());

      if (activePetForm.photoFile) {
        formData.append("photo", activePetForm.photoFile);
      }

      let savedPet;

      if (modalMode === "add") {
        const res = await api.post("/pets", formData);
        savedPet = res.data;
      } else if (modalMode === "edit" && activePetForm.petId) {
        const res = await api.patch(`/pets/${activePetForm.petId}`, formData);
        savedPet = res.data;
      }

      const profileRes = await api.get("/users/me");
      const latestPets = profileRes.data?.data?.pets || [];
      
      const mappedPets = latestPets.map((p) => ({
        petId: p.petId || p.petid || p.id || null,
        name: p.name || "",
        species: p.species || "",
        breed: p.breed || "",
        gender: p.gender || "", 
        weight: p.weight || "",
        age: p.age !== null && p.age !== undefined ? p.age : "",
        photo: p.imageUrl || p.photo || "",
        notes: p.allergy || p.notes || "",
      }));

      setPets(mappedPets);
      if (setUser) {
        setUser((prev) => ({ ...prev, pets: mappedPets }));
      }
      
      setShowPetModal(false);
      alert("บันทึกข้อมูลสัตว์เลี้ยงสำเร็จ");

    } catch (error) {
      console.error("Save pet error:", error);
      if (error.response?.status === 409) {
        setPetError("คุณมีสัตว์เลี้ยงชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        setPetError(`บันทึกไม่สำเร็จ: ${error.response?.status || "API อาจจะยังไม่พร้อม"}`);
      }
    }
  };

  const handleRemoveCurrentModalPet = async () => {
    if (currentPetIndex !== null) {
      if (!window.confirm("คุณต้องการลบสัตว์เลี้ยงนี้ใช่หรือไม่?")) return;
      const targetPet = pets[currentPetIndex];
      try {
        // ยิง API ลบข้อมูลหลังบ้าน (ถ้าสัตว์เลี้ยงนี้เคยถูกบันทึกแล้วและมี petId)
        if (targetPet.petId) {
          await api.delete(`/pets/${targetPet.petId}`);
        }

        // ลบออกจากหน้าจอ
        const updatedPets = pets.filter((_, index) => index !== currentPetIndex);
        setPets(updatedPets);
        if (setUser) {
          setUser((prev) => ({ ...prev, pets: updatedPets }));
        }
        setShowPetModal(false);
        
        alert("ลบสัตว์เลี้ยงสำเร็จ");
      } catch (error) {
        console.error("Delete pet error:", error);
        alert("ไม่สามารถลบสัตว์เลี้ยงได้");
      }
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    if (!deletePassword.trim()) {
      setDeleteError("กรุณากรอกรหัสผ่าน");
      return;
    }
    setDeleteStatus("submitting");
    try {
      await api.delete("/auth/account", { data: { password: deletePassword } });
      setShowDeleteModal(false);
      logout(); 
      navigate("/register");
    } catch (err) {
      setDeleteError(err.response?.status === 401 ? "รหัสผ่านไม่ถูกต้อง" : "ไม่สามารถลบบัญชีได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleteStatus("idle");
    }
  };

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

          <section className="profile-section">
            {renderSectionHeader(
              "ข้อมูลที่อยู่",
              isEditingAddress,
              () => { setOriginalProfile({ ...profile }); setIsEditingAddress(true); },
              () => handleCancelSection("address"),
              () => handleSaveSection("address")
            )}
            {!isEditingAddress ? (
              <>
                <ProfileField label="รายละเอียดที่อยู่" field="address" value={profile.address} isEditing={false} />
                <ProfileField label="จังหวัด" field="province" value={profile.province} isEditing={false} />
                <ProfileField label="เมือง/อำเภอ" field="district" value={profile.district} isEditing={false} />
                <ProfileField label="ตำบล/แขวง" field="subdistrict" value={profile.subdistrict} isEditing={false} />
                <ProfileField label="รหัสไปรษณีย์" field="postalCode" value={profile.postalCode} isEditing={false} />
              </>
            ) : (
              <div className="profile-edit-address-grid">
                <div className="profile-row" style={{ gridColumn: "1 / -1" }}> 
                  <span className="profile-label">รายละเอียดที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)</span>
                  <input 
                    type="text"
                    className="profile-input" 
                    value={profile.address} 
                    onChange={(e) => handleChange("address", e.target.value)} 
                    placeholder="เช่น 123/45 ซ.สุขุมวิท 1 ถ.สุขุมวิท" 
                    style={{ width: "100%" }}
                  />
                  {errors.address && <span className="profile-error">{errors.address}</span>}
                </div>
                <div className="profile-row">
                  <span className="profile-label">จังหวัด</span>
                  <input 
                    className="profile-input" 
                    list="province-list" 
                    value={profile.province} 
                    onChange={handleProvinceChange} 
                    placeholder="พิมพ์หรือเลือกจังหวัด..." 
                  />
                  <datalist id="province-list">
                    {provincesData.map((prov) => (
                      <option key={prov.id} value={prov.name_th} />
                    ))}
                  </datalist>
                  {errors.province && <span className="profile-error">{errors.province}</span>}
                </div>

                <div className="profile-row">
                  <span className="profile-label">เมือง/อำเภอ</span>
                  <input 
                    className="profile-input" 
                    list="district-list" 
                    value={profile.district} 
                    onChange={handleDistrictChange} 
                    disabled={!profile.province}
                    placeholder="พิมพ์หรือเลือกอำเภอ..." 
                  />
                  <datalist id="district-list">
                    {(availableDistricts || []).map((dist) => (
                      <option key={dist.id} value={dist.name_th} />
                    ))}
                  </datalist>
                  {errors.district && <span className="profile-error">{errors.district}</span>}
                </div>

                <div className="profile-row">
                  <span className="profile-label">ตำบล/แขวง</span>
                  <input 
                    className="profile-input" 
                    list="sub-list" 
                    value={profile.subdistrict} 
                    onChange={handleSubdistrictChange} 
                    disabled={!profile.district}
                    placeholder="พิมพ์หรือเลือกตำบล..." 
                  />
                  <datalist id="sub-list">
                    {(availableSubdistricts || []).map((sub) => (
                      <option key={sub.id} value={sub.name_th} />
                    ))}
                  </datalist>
                  {errors.subdistrict && <span className="profile-error">{errors.subdistrict}</span>}
                </div>

                <div className="profile-row">
                  <span className="profile-label">รหัสไปรษณีย์</span>
                  <input 
                    className="profile-input" 
                    list="zip-list" 
                    value={profile.postalCode} 
                    onChange={(e) => handleChange("postalCode", e.target.value)} 
                    disabled={!profile.subdistrict}
                    placeholder="รหัสไปรษณีย์" 
                  />
                  <datalist id="zip-list">
                    {(availableZipcodes || []).map((zip, idx) => (
                      <option key={idx} value={zip} />
                    ))}
                  </datalist>
                  {errors.postalCode && <span className="profile-error">{errors.postalCode}</span>}
                </div>
              </div>
            )}
          </section>

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
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {pet.photo ? (
                          <img 
                            src={pet.photo} 
                            alt={pet.name} 
                            onError={(e) => { e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' style='background:%23eee;'%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.35em'%3E%26%23128062%3B%3C/text%3E%3C/svg%3E"; }}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ccc" }} 
                          />
                        ) : (
                          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                            🐾
                          </div>
                        )}
                        <span style={{ fontSize: "15px", fontWeight: "600" }}>{pet.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button type="button" className="profile-edit-button pet-btn-sm" onClick={() => openViewPetModal(index)} title="ดูข้อมูล">🔍</button>
                        <button type="button" className="profile-edit-button pet-btn-sm pet-btn-warning" onClick={() => openEditPetModal(index)} title="แก้ไขข้อมูล">🖋️</button>
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