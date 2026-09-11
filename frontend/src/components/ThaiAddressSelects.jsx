import { useEffect, useMemo, useState } from "react";

export default function ThaiAddressSelects({ value, onChange, errors }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subId, setSubId] = useState("");

  // lazy load JSON (code-splitting) เพื่อไม่ให้ bundle หน้าแรกบวม
  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("../assets/thai-address/province.json"),
      import("../assets/thai-address/district.json"),
      import("../assets/thai-address/sub_district.json"),
    ]).then(([p, d, s]) => {
      if (!mounted) return;
      setProvinces(p.default);
      setDistricts(d.default);
      setSubDistricts(s.default);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const districtOptions = useMemo(
    () => districts.filter((d) => String(d.province_id) === String(provinceId)),
    [districts, provinceId]
  );
  const subOptions = useMemo(
    () => subDistricts.filter((s) => String(s.district_id) === String(districtId)),
    [subDistricts, districtId]
  );

  const handleProvince = (e) => {
  const id = e.target.value;
  const prov = provinces.find((p) => String(p.id) === String(id));
  setProvinceId(id); setDistrictId(""); setSubId("");
  onChange({ province: prov?.name_th || "", district: "", subdistrict: "", postalCode: "" });
  };

  const handleDistrict = (e) => {
    const id = e.target.value;
    const dist = districtOptions.find((d) => String(d.id) === String(id));
    setDistrictId(id); setSubId("");
    onChange({ district: dist?.name_th || "", subdistrict: "", postalCode: "" });
  };

  const handleSub = (e) => {
    const id = e.target.value;
    const sub = subOptions.find((s) => String(s.id) === String(id));
    setSubId(id);
    onChange({
      subdistrict: sub?.name_th || "",                                  // 👈 ส่งชื่อขึ้นไปด้วย
      postalCode: sub?.zip_code ? String(sub.zip_code) : "",
    });
  };

  return (
    <div className="grid-2">
      <div className="field">
        <label className="field-label">จังหวัด <span className="req">*</span></label>
        <select className="input" value={provinceId} onChange={handleProvince} disabled={loading}>
          <option value="">{loading ? "กำลังโหลดข้อมูลที่อยู่..." : "— เลือกจังหวัด —"}</option>
          {provinces.map((p) => <option key={p.id} value={p.id}>{p.name_th}</option>)}
        </select>
        {errors?.province && <div className="field-error">{errors.province}</div>}
      </div>

      <div className="field">
        <label className="field-label">อำเภอ/เขต <span className="req">*</span></label>
        <select className="input" value={districtId} onChange={handleDistrict} disabled={!provinceId || loading}>
          <option value="">— เลือกอำเภอ/เขต —</option>
          {districtOptions.map((d) => <option key={d.id} value={d.id}>{d.name_th}</option>)}
        </select>
        {errors?.district && <div className="field-error">{errors.district}</div>}
      </div>

      <div className="field">
        <label className="field-label">ตำบล/แขวง <span className="req">*</span></label>
        <select className="input" value={subId} onChange={handleSub} disabled={!districtId || loading}>
          <option value="">— เลือกตำบล/แขวง —</option>
          {subOptions.map((s) => <option key={s.id} value={s.id}>{s.name_th}</option>)}
        </select>
        {errors?.subdistrict && <div className="field-error">{errors.subdistrict}</div>}
      </div>

      <div className="field">
        <label className="field-label">รหัสไปรษณีย์</label>
        <input className="input" value={value.postalCode || ""} readOnly placeholder="ระบบเติมให้อัตโนมัติ" />
        {errors?.postalCode && <div className="field-error">{errors.postalCode}</div>}
      </div>
    </div>
  );
}