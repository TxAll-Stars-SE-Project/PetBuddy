import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createBooking } from "../services/booking.api";
import { getSitterServices, getSitterBusySlots } from "../services/sitters.js";
import { api } from "../services/api.js";
import { toast } from "../utils/toast.js";
import AlertBanner from "./ui/AlertBanner.jsx";
import Button from "./ui/Button.jsx";

function getMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function BookingModal({ sitter, services: initialServices = [], isOpen, onClose, onSuccess }) {
  const { user } = useAuth();

  // State สำหรับเก็บสัตว์เลี้ยงของผู้ใช้
  const [userPets, setUserPets] = useState([]);

  const sitterId = sitter?.sitterId || sitter?.id || sitter?.petsitterid;
  const [services, setServices] = useState(initialServices);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedPetIds, setSelectedPetIds] = useState([]);
  const [starttime, setStarttime] = useState("");
  const [endtime, setEndtime] = useState("");
  const [paymentplan, setPaymentplan] = useState("deposit");
  const [note, setNote] = useState("");

  const [busySlots, setBusySlots] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. ดึงโปรไฟล์และสัตว์เลี้ยงล่าสุดเมื่อเปิด Modal
  useEffect(() => {
    if (!isOpen) return;

    api.get("/users/me")
      .then((res) => {
        const profileData = res.data?.data || res.data;
        const petsList =
          profileData?.pets ||
          profileData?.petowner?.pets ||
          profileData?.petowner?.pet ||
          user?.pets ||
          [];
        setUserPets(petsList);
      })
      .catch((err) => {
        console.error("Failed to fetch user pets:", err);
        setUserPets(user?.pets || []);
      });
  }, [isOpen, user]);

  // 2. ดึงรายการบริการของพี่เลี้ยงถ้าไม่ได้ส่งส่งพารามิเตอร์มา
  useEffect(() => {
    if (!isOpen || !sitterId) return;
    if (initialServices && initialServices.length > 0) {
      setServices(initialServices);
    } else {
      getSitterServices(sitterId)
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || sitter?.services || [];
          setServices(list);
        })
        .catch(() => setServices(sitter?.services || []));
    }
  }, [isOpen, sitterId, initialServices, sitter]);

  // เลือกบริการแรกให้อัตโนมัติเมื่อดึงข้อมูลเสร็จ
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      const firstId = services[0].serviceid || services[0].serviceId || services[0].id;
      setSelectedServiceId(firstId);
    }
  }, [services, selectedServiceId]);

  // ดึงสล็อตเวลาที่ไม่ว่างเมื่อเลือกวันเริ่มต้น
  useEffect(() => {
    if (sitterId && starttime) {
      const selectedDate = starttime.split("T")[0];
      getSitterBusySlots(sitterId, selectedDate)
        .then((slots) => setBusySlots(slots || []))
        .catch(() => setBusySlots([]));
    }
  }, [sitterId, starttime]);

  const activeService = useMemo(() => {
    return services.find(
      (s) => String(s.serviceid || s.serviceId || s.id) === String(selectedServiceId)
    );
  }, [services, selectedServiceId]);

  const totalPrice = useMemo(() => {
    if (!activeService || !starttime || !endtime || selectedPetIds.length === 0) return 0;
    const start = new Date(starttime);
    const end = new Date(endtime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;

    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const priceRate = Number(activeService.price || activeService.rate || 0);

    return diffHours * priceRate * selectedPetIds.length;
  }, [activeService, starttime, endtime, selectedPetIds]);

  if (!isOpen || !sitter) return null;

  const handlePetToggle = (petId) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedServiceId) return setError("กรุณาเลือกบริการที่ต้องการ");
    if (!starttime || !endtime) return setError("กรุณาระบุวันและเวลาเริ่ม-สิ้นสุด");

    const now = new Date();
    const start = new Date(starttime);
    const end = new Date(endtime);

    if (start < now) return setError("วันและเวลาเริ่มต้นต้องไม่เป็นเวลาในอดีต");
    if (end <= start) return setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
    if (selectedPetIds.length === 0) return setError("กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว");

    setSubmitting(true);
    try {
      await createBooking({
        sitterId: Number(sitterId),
        serviceId: Number(selectedServiceId),
        petIds: selectedPetIds,
        starttime: new Date(starttime).toISOString(),
        endtime: new Date(endtime).toISOString(),
        paymentplan,
        note,
      });

      toast("ส่งคำขอการจองสำเร็จแล้ว!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถส่งคำขอจองได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const minDateTime = getMinDateTime();

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" style={{ maxWidth: "560px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <h2>จองบริการกับ {sitter.username || sitter.fullname}</h2>

        {error && <AlertBanner type="error">{error}</AlertBanner>}

        <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
          <div className="field">
            <label className="field-label">เลือกบริการ <span className="req">*</span></label>
            <select className="input" value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
              {services.map((s) => {
                const sId = s.serviceid || s.serviceId || s.id;
                return (
                  <option key={sId} value={sId}>
                    {s.servicename || s.title || s.servicetype} — ฿{Number(s.price || s.rate).toLocaleString()}/ชม.
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="field-label">เวลาเริ่ม <span className="req">*</span></label>
              <input type="datetime-local" className="input" min={minDateTime} value={starttime} onChange={(e) => setStarttime(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">เวลาสิ้นสุด <span className="req">*</span></label>
              <input type="datetime-local" className="input" min={starttime || minDateTime} value={endtime} onChange={(e) => setEndtime(e.target.value)} />
            </div>
          </div>

          {busySlots.length > 0 && (
            <div className="demo-hint" style={{ marginBottom: "12px", textAlign: "left" }}>
              ⚠️ ช่วงเวลาที่ไม่ว่างในวันที่เลือก:
              <ul style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
                {busySlots.map((slot, idx) => (
                  <li key={idx}>
                    {new Date(slot.starttime).toLocaleTimeString()} - {new Date(slot.endtime).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="field">
            <label className="field-label">สัตว์เลี้ยงที่จะฝากดูแล <span className="req">*</span></label>
            {userPets.length === 0 ? (
              <p className="muted" style={{ fontSize: "13px" }}>คุณยังไม่มีข้อมูลสัตว์เลี้ยง (เพิ่มได้ในหน้าโปรไฟล์)</p>
            ) : (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                {userPets.map((pet) => {
                  const pId = pet.petId || pet.petid || pet.id;
                  const active = selectedPetIds.includes(pId);
                  return (
                    <button key={pId} type="button" className={`chip-btn ${active ? "active" : ""}`} onClick={() => handlePetToggle(pId)}>
                      🐾 {pet.name} ({pet.species || "สัตว์เลี้ยง"})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">แผนการชำระเงิน</label>
            <select className="input" value={paymentplan} onChange={(e) => setPaymentplan(e.target.value)}>
              <option value="deposit">ชำระมัดจำ 30%</option>
              <option value="full">ชำระเต็มจำนวน (100%)</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label">หมายเหตุถึงพี่เลี้ยง</label>
            <textarea className="input" rows={2} placeholder="ข้อควรระวัง หรือรายละเอียดเพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div style={{ background: "var(--primary-soft)", border: "1px solid var(--primary-border)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>ราคารวมประมาณการ ({selectedPetIds.length} ตัว)</span>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--primary)" }}>฿{totalPrice.toLocaleString("th-TH")}</div>
          </div>

          <div className="delete-modal-actions">
            <button type="button" className="delete-cancel-button" onClick={onClose} disabled={submitting}>ยกเลิก</button>
            <Button type="submit" loading={submitting}>ยืนยันการจอง</Button>
          </div>
        </form>
      </div>
    </div>
  );
}