// ตัวเลือกและ label ของตัวกรองค้นหาพี่เลี้ยง (ค่า key ต้องตรงกับ enum ใน backend)
export const PET_TYPES = {
  dog: "🐶 สุนัข",
  cat: "🐱 แมว",
  bird: "🐦 นก",
  exotic: "🦎 สัตว์แปลก",
};

export const SERVICE_TYPES = {
  walking: "พาเดินเล่น",
  sitting: "ดูแลที่บ้าน",
  boarding: "รับฝากเลี้ยง",
  grooming: "อาบน้ำ-ตัดขน",
  daycare: "เลี้ยงรายวัน",
};

export const SORT_OPTIONS = [
  { value: "rating", label: "คะแนนสูงสุด" },
  { value: "priceAsc", label: "ราคาต่ำ → สูง" },
  { value: "priceDesc", label: "ราคาสูง → ต่ำ" },
];

export const DEFAULT_FILTERS = {
  province: "",
  district: "",
  pet: "",
  service: "",
  min: "",
  max: "",
  rating: 0,
  sort: "rating",
};

const MAX_PRICE = 1_000_000;

// คืนข้อความ error ของช่วงราคา (หรือ "" ถ้าใช้ได้) — ตรงกับกติกาของ backend จะได้ไม่ยิง request ที่โดน 400
export function getPriceError({ min, max }) {
  for (const value of [min, max]) {
    if (value === "") continue;
    if (!/^\d+$/.test(value)) return "กรอกราคาเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
    if (Number(value) > MAX_PRICE) return "ราคาต้องไม่เกิน 1,000,000 บาท";
  }
  if (min !== "" && max !== "" && Number(min) > Number(max)) {
    return "ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด";
  }
  return "";
}
