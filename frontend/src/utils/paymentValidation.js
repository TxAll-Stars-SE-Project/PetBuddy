const VALID_SLIP_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SLIP_SIZE = 5 * 1024 * 1024;

export function validateSlipFile(file) {
  if (!file || !VALID_SLIP_TYPES.includes(file.type)) {
    return {
      isValid: false,
      errorMsg: "กรุณาเลือกไฟล์รูปภาพ JPEG, PNG หรือ WEBP",
    };
  }

  if (file.size > MAX_SLIP_SIZE) {
    return {
      isValid: false,
      errorMsg: "ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB",
    };
  }

  return { isValid: true, errorMsg: "" };
}
