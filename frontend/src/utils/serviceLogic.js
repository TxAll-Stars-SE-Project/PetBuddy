/**
 * Service Form Business Logic & Pure Handlers
 * 
 * 🎓 Layer 1: Pure Functions (Independent of React)
 * - Zero React imports or hook dependencies.
 * - 100% testable via standard unit tests.
 * - Handles data validation, transformations, and math calculations.
 */

// Service category options
export const SERVICE_TYPE_OPTIONS = [
  { value: "walking", label: "พาเดินเล่น (Dog Walking)" },
  { value: "daycare", label: "ฝากเลี้ยงรายวัน (Pet Daycare)" },
  { value: "boarding", label: "ฝากเลี้ยงค้างคืน (Boarding)" },
  { value: "grooming", label: "อาบน้ำ-ตัดขน (Grooming)" },
  { value: "sitting", label: "ดูแลถึงที่พัก (Pet Sitting)" },
];

/**
 * Returns the dynamic price unit hint based on service category.
 * @param {string} serviceType
 * @returns {string}
 */
export const getPriceUnitHint = (serviceType) => {
  switch (serviceType) {
    case "walking":
    case "sitting":
      return "฿ / ชม.";
    case "daycare":
    case "boarding":
      return "฿ / วัน";
    case "grooming":
      return "฿ / ครั้ง";
    default:
      return "฿";
  }
};

/**
 * Calculates the next price value based on delta adjustment (+10 / -10).
 * Enforces non-negative minimum boundary.
 * @param {number|string} currentPrice
 * @param {number} delta
 * @returns {number}
 */
export const calculatePriceStep = (currentPrice, delta) => {
  const current = Number(currentPrice) || 0;
  return Math.max(0, current + delta);
};

/**
 * Toggles a species item in an immutable array.
 * @param {string[]} currentList
 * @param {string} speciesId
 * @returns {string[]}
 */
export const toggleSpeciesItem = (currentList = [], speciesId) => {
  if (!Array.isArray(currentList)) return [speciesId];
  return currentList.includes(speciesId)
    ? currentList.filter((id) => id !== speciesId)
    : [...currentList, speciesId];
};

/**
 * Validates service form inputs.
 * @param {Object} values
 * @param {string} values.serviceName
 * @param {number|string} values.price
 * @param {string[]} values.species
 * @param {string} values.description
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export const validateServiceForm = ({ serviceName = "", price = "", species = [], description = "" }) => {
  const errors = {};
  const trimmedName = String(serviceName).trim();
  const trimmedDesc = String(description).trim();
  const numericPrice = Number(price);

  if (!trimmedName) {
    errors.serviceName = "กรุณากรอกชื่อบริการ";
  }

  if (price === "" || isNaN(numericPrice) || numericPrice <= 0) {
    errors.price = "กรุณาระบุราคาที่มากกว่า 0";
  }

  if (!Array.isArray(species) || species.length === 0) {
    errors.species = "กรุณาเลือกชนิดสัตว์เลี้ยงที่รับดูแลอย่างน้อย 1 ชนิด";
  }

  if (!trimmedDesc) {
    errors.description = "กรุณากรอกคำอธิบายบริการ";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Normalizes and builds the service payload object for API/persistence.
 * @param {Object} params
 * @param {string} params.serviceName
 * @param {string} params.serviceType
 * @param {number|string} params.price
 * @param {string[]} params.species
 * @param {string} params.description
 * @param {string} params.status
 * @param {Object|null} [params.activeService]
 * @returns {Object}
 */
export const buildServicePayload = ({
  serviceName,
  serviceType,
  price,
  species,
  description,
  status,
  activeService = null,
}) => {
  const payload = {
    serviceName: String(serviceName).trim(),
    serviceType,
    price: Number(price) || 0,
    species: Array.isArray(species) ? species : ["dog"],
    description: String(description).trim(),
    status: status || "published",
  };

  const existingId =
    activeService?.serviceId ||
    activeService?.serviceid ||
    activeService?.id;

  if (existingId) {
    payload.serviceId = existingId;
    payload.serviceid = existingId;
  }

  return payload;
};
