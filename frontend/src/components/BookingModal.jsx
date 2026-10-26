import React, { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

// 1. ตารางแปลงชื่อประเภทสัตว์เลี้ยงเป็นภาษาไทย
const SPECIES_THAI_MAP = {
  dog: "สุนัข",
  cat: "แมว",
  bird: "นก",
  exotic: "สัตว์แปลก",
  rabbit: "กระต่าย",
  fish: "ปลา",
  rodent: "สัตว์ฟันแทะ",
};

// Helper: ฟังก์ชันแปลงประเภทสัตว์เลี้ยงเป็นภาษาไทย
const formatSpeciesThai = (speciesInput) => {
  if (!speciesInput) return "สัตว์เลี้ยงทุกชนิด";
  const list = Array.isArray(speciesInput) ? speciesInput : [speciesInput];
  return list
    .map((item) => SPECIES_THAI_MAP[String(item).toLowerCase()] || item)
    .join(", ");
};

// Helper: แปลงชื่อประเภทสัตว์เลี้ยงทั้ง ไทย/อังกฤษ เป็น Key มาตรฐาน
const normalizeSpecies = (speciesInput) => {
  if (!speciesInput) return "";
  const str = String(speciesInput).trim().toLowerCase();
  
  const thaiToEng = {
    "สุนัข": "dog",
    "หมา": "dog",
    "แมว": "cat",
    "นก": "bird",
    "สัตว์แปลก": "exotic",
    "กระต่าย": "rabbit",
    "ปลา": "fish",
    "สัตว์ฟันแทะ": "rodent",
  };

  return thaiToEng[str] || str;
};

// Helper: แกะ Pet ID รองรับทุกรูปแบบชื่อคีย์ (petid, petId, id, pet_id)
const getPetId = (pet) =>
  pet?.petId || pet?.petid || pet?.id || pet?.pet_id || pet?.userPetId || pet?._id;

export default function BookingModal({
  isOpen,
  onClose,
  sitter,
  selectedService,
  onSuccess,
}) {
  const [userPets, setUserPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(tomorrow);
  const [endTime, setEndTime] = useState("18:00");

  const [paymentOption, setPaymentOption] = useState("full");
  const [note, setNote] = useState("");

  const [loadingPets, setLoadingPets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // เช็กประเภทบริการ (รายวัน vs รายชั่วโมง)
  const serviceUnitStr = String(
    selectedService?.unit ||
    selectedService?.priceUnit ||
    selectedService?.serviceType ||
    selectedService?.type ||
    selectedService?.category ||
    ""
  ).toLowerCase();

  const isDailyService =
    serviceUnitStr.includes("day") ||
    serviceUnitStr.includes("daily") ||
    serviceUnitStr.includes("วัน");

  // ฟังก์ชันเช็กว่าประเภทสัตว์เลี้ยงตรงกับบริการหรือไม่ (รองรับทั้งภาษาไทยและอังกฤษ)
  const isPetCompatible = (pet, service) => {
    if (!service || !service.species) return true;

    const serviceSpeciesList = Array.isArray(service.species)
      ? service.species
      : [service.species];

    const targetSpecies = serviceSpeciesList.map((s) => normalizeSpecies(s));
    const petSpecies = normalizeSpecies(pet?.species);

    return targetSpecies.includes(petSpecies);
  };

  // ดึงข้อมูลสัตว์เลี้ยงจาก /users/me
  const fetchPets = useCallback(async () => {
    setLoadingPets(true);
    setBookingError("");
    try {
      const res = await api.get("/users/me");
      const petsList = res.data?.data?.pets || res.data?.pets || [];
      setUserPets(petsList);

      if (petsList.length > 0) {
        const compatiblePet = petsList.find((p) =>
          isPetCompatible(p, selectedService)
        );
        const initialPet = compatiblePet || petsList[0];
        const initialId = getPetId(initialPet);
        if (initialId && compatiblePet) {
          setSelectedPetId(String(initialId));
        } else {
          setSelectedPetId("");
        }
      } else {
        setSelectedPetId("");
      }
    } catch (err) {
      console.error("Failed to fetch pets:", err);
      setBookingError("ไม่สามารถดึงข้อมูลสัตว์เลี้ยงได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoadingPets(false);
    }
  }, [selectedService]);

  useEffect(() => {
    if (isOpen) {
      fetchPets();
    }
  }, [isOpen, fetchPets]);

  if (!isOpen) return null;

  // คำนวณระยะเวลาและราคารวม
  const servicePrice = Number(selectedService?.price || 0);
  const startDateTimeObj = new Date(`${startDate}T${startTime}:00`);
  const endDateTimeObj = new Date(`${endDate}T${endTime}:00`);

  let durationCount = 1;
  let unitLabel = isDailyService ? "วัน" : "ชั่วโมง";

  if (!isNaN(startDateTimeObj.getTime()) && !isNaN(endDateTimeObj.getTime())) {
    const diffMs = endDateTimeObj.getTime() - startDateTimeObj.getTime();
    if (diffMs > 0) {
      if (isDailyService) {
        durationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      } else {
        durationCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      }
    }
  }

  const totalPrice = servicePrice * durationCount;
  const paymentAmount =
    paymentOption === "deposit" ? totalPrice * 0.3 : totalPrice;

  // ฟังก์ชันกดยืนยันการจอง
  const handleConfirmBooking = async () => {
    setBookingError("");
    setSubmitting(true);

    try {
      const activePet = userPets.find(
        (p) => String(getPetId(p)) === String(selectedPetId)
      );

      if (!activePet) {
        setBookingError("กรุณาเลือกสัตว์เลี้ยงที่ต้องการจองบริการ");
        setSubmitting(false);
        return;
      }

      if (!isPetCompatible(activePet, selectedService)) {
        setBookingError(
          `สัตว์เลี้ยง (${formatSpeciesThai(activePet.species)}) ไม่ตรงกับประเภทที่บริการรับฝาก (${formatSpeciesThai(selectedService?.species)})`
        );
        setSubmitting(false);
        return;
      }

      const validPetId = Number(getPetId(activePet));
      if (!validPetId || Number.isNaN(validPetId) || validPetId <= 0) {
        setBookingError("ไม่พบรหัสสัตว์เลี้ยงที่ถูกต้อง");
        setSubmitting(false);
        return;
      }

      const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${endDate}T${endTime}:00`).toISOString();

      const bookingPayload = {
        sitterId: Number(sitter?.sitterId || sitter?.id || sitter?.userId),
        serviceId: Number(selectedService?.serviceId || selectedService?.id),
        starttime: startIso,
        endtime: endIso,
        paymentplan: paymentOption === "deposit" ? "deposit" : "full",
        ...(note.trim() ? { note: note.trim() } : {}),
        pets: [
          {
            petId: validPetId,
            ...(note.trim() ? { petNote: note.trim() } : {}),
          },
        ],
      };

      const res = await api.post("/bookings", bookingPayload);

      if (
        res.status === 200 ||
        res.status === 201 ||
        res.data?.status === "success"
      ) {
        alert("จองบริการสำเร็จเรียบร้อยแล้ว!");
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Booking failed:", err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "ไม่สามารถทำรายการจองได้ กรุณาตรวจสอบข้อมูล";
      setBookingError(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          ยืนยันการจองบริการ
        </h2>

        {/* ข้อมูลพี่เลี้ยงและบริการ */}
        <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg text-gray-900">
              {selectedService?.serviceName || selectedService?.name || "บริการฝากเลี้ยง"}
            </h3>
            <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
              ฿{servicePrice.toLocaleString()} / {unitLabel}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            พี่เลี้ยง: {sitter?.sitterName || sitter?.name || sitter?.sittername || "Positter"}
          </p>
          <div className="text-xs text-orange-600 mt-1 font-medium">
            รับฝากประเภท: {formatSpeciesThai(selectedService?.species)}
          </div>
        </div>

        {/* ตัวเลือกสัตว์เลี้ยง */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            เลือกสัตว์เลี้ยง (Pet)
          </label>
          {loadingPets ? (
            <div className="text-sm text-gray-500 py-2">กำลังโหลดสัตว์เลี้ยง...</div>
          ) : userPets.length === 0 ? (
            <div className="text-sm text-red-500 py-2">
              ไม่พบสัตว์เลี้ยงของคุณ กรุณาเพิ่มสัตว์เลี้ยงในโปรไฟล์ก่อนจอง
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userPets.map((pet) => {
                const petIdStr = String(getPetId(pet));
                const isSelected = String(selectedPetId) === petIdStr;
                const compatible = isPetCompatible(pet, selectedService);

                return (
                  <div
                    key={petIdStr}
                    onClick={() => {
                      if (compatible) setSelectedPetId(petIdStr);
                    }}
                    className={`p-3 rounded-xl border transition flex justify-between items-center ${
                      !compatible
                        ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200"
                        : isSelected
                        ? "border-orange-500 bg-orange-50/50 text-orange-900 font-medium cursor-pointer"
                        : "border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">
                        🐾 {pet.name}{" "}
                        {!compatible && (
                          <span className="text-xs text-red-500 font-normal ml-1">
                            (ประเภทไม่ตรงกับบริการ)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        ประเภท: {formatSpeciesThai(pet.species)}{" "}
                        {pet.breed ? `(${pet.breed})` : ""}
                      </div>
                    </div>
                    {isSelected && compatible && (
                      <span className="text-orange-500 font-bold text-sm">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* วันที่และเวลา */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              วันที่เริ่มบริการ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              เวลาเริ่มบริการ {isDailyService ? "(ระบุเวลาฝาก)" : ""}
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              วันที่สิ้นสุดบริการ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              เวลาสิ้นสุดบริการ {isDailyService ? "(ระบุเวลารับ)" : ""}
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        {/* ระยะเวลา */}
        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mb-4 flex justify-between items-center">
          <span>⏱️ ระยะเวลาทั้งหมด:</span>
          <span className="font-semibold text-sm text-gray-800">
            {durationCount} {unitLabel}
          </span>
        </div>

        {/* รูปแบบการชำระเงิน */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            รูปแบบการชำระเงิน (Payment Option)
          </label>
          <select
            value={paymentOption}
            onChange={(e) => setPaymentOption(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
          >
            <option value="full">ชำระเต็มจำนวน 100% (฿{totalPrice.toLocaleString()})</option>
            <option value="deposit">ชำระมัดจำ 30% (฿{(totalPrice * 0.3).toLocaleString()})</option>
          </select>
        </div>

        {/* หมายเหตุ */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            หมายเหตุเพิ่มเติมถึงพี่เลี้ยง
          </label>
          <textarea
            rows="2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น คำแนะนำการให้อาหาร หรือจุดนัดพบ"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
          ></textarea>
        </div>

        {/* สรุปราคา */}
        <div className="border-t pt-3 mb-4 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              ราคายอดรวมทั้งหมด ({durationCount} {unitLabel}):
            </span>
            <span>฿{totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-orange-600">
            <span>ยอดชำระทันที ({paymentOption === "deposit" ? "มัดจำ 30%" : "เต็มจำนวน 100%"}):</span>
            <span>฿{paymentAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* ข้อความแสดง Error */}
        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex items-center gap-2">
            ⚠️ {bookingError}
          </div>
        )}

        {/* ปุ่ม action */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={submitting || !selectedPetId}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 text-sm shadow-md"
          >
            {submitting ? "กำลังดำเนินการ..." : "ยืนยันการจอง"}
          </button>
        </div>
      </div>
    </div>
  );
}