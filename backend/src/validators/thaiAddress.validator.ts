import { provinces, districts, subDistricts } from '@bilions/thailand-address'
import { ValidationError } from '../types/user.js'

export interface ThaiAddressValidationResult {
  isValid: boolean
  errors: ValidationError[]
  normalized?: {
    province: string
    district: string
    subdistrict: string
    postalCode: string
  }
}

/**
 * ฟังก์ชันช่วยตัดคำนำหน้าและ normalize ตัวหนังสือเพื่อเทียบชื่อที่อยู่ (ทั้งภาษาไทยและอังกฤษ)
 */
export function normalizeAddressName(text: string): string {
  if (!text) return ''
  return text
    .trim()
    .toLowerCase()
    .replace(/^(จังหวัด|จ\.|อำเภอ|อ\.|เขต|ตำบล|ต\.|แขวง)\s*/g, '')
    .replace(/^(province|district|subdistrict|khet|amphoe|tambon|khwaeng)\s*/gi, '')
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '')
}

/**
 * ตรวจสอบความถูกต้องและความสัมพันธ์ของที่อยู่ไทย 4 ระดับ:
 * 1. Province (จังหวัด)
 * 2. District (อำเภอ/เขต)
 * 3. Subdistrict (ตำบล/แขวง)
 * 4. Postal Code (รหัสไปรษณีย์)
 */
export function validateThaiAddress(
  provinceInput: string,
  districtInput: string,
  subdistrictInput: string,
  postalCodeInput: string
): ThaiAddressValidationResult {
  const errors: ValidationError[] = []

  const normProv = normalizeAddressName(provinceInput)
  const normDist = normalizeAddressName(districtInput)
  const normSub = normalizeAddressName(subdistrictInput)
  const cleanPostal = (postalCodeInput || '').trim()

  // 1. ตรวจสอบจังหวัด (Province)
  if (!normProv) {
    errors.push({ field: 'province', message: 'กรุณากรอกจังหวัด' })
    return { isValid: false, errors }
  }

  const matchedProvince = provinces.find(
    (p) =>
      normalizeAddressName(p.name_in_thai) === normProv ||
      normalizeAddressName(p.name_in_english) === normProv
  )

  if (!matchedProvince) {
    errors.push({ field: 'province', message: 'ไม่พบจังหวัดที่ระบุในประเทศไทย' })
    return { isValid: false, errors }
  }

  // 2. ตรวจสอบอำเภอ/เขต (District) ภายใต้จังหวัดที่เลือก
  if (!normDist) {
    errors.push({ field: 'district', message: 'กรุณากรอกอำเภอ/เขต' })
    return { isValid: false, errors }
  }

  const provinceDistricts = districts.filter((d) => d.province_id === matchedProvince.id)
  const matchedDistrict = provinceDistricts.find(
    (d) =>
      normalizeAddressName(d.name_in_thai) === normDist ||
      normalizeAddressName(d.name_in_english) === normDist
  )

  if (!matchedDistrict) {
    errors.push({
      field: 'district',
      message: 'อำเภอ/เขต ไม่ถูกต้องหรือไม่ตรงกับจังหวัดที่เลือก',
    })
    return { isValid: false, errors }
  }

  // 3. ตรวจสอบตำบล/แขวง (Subdistrict) ภายใต้อำเภอ/เขตที่เลือก
  if (!normSub) {
    errors.push({ field: 'subdistrict', message: 'กรุณากรอกตำบล/แขวง' })
    return { isValid: false, errors }
  }

  const districtSubdistricts = subDistricts.filter(
    (s) => s.district_id === matchedDistrict.id
  )

  const matchedSubdistrict = districtSubdistricts.find(
    (s) =>
      normalizeAddressName(s.name_in_thai) === normSub ||
      (s.name_in_english &&
        s.name_in_english !== 'NULL' &&
        normalizeAddressName(s.name_in_english) === normSub)
  )

  if (!matchedSubdistrict) {
    errors.push({
      field: 'subdistrict',
      message: 'ตำบล/แขวง ไม่ถูกต้องหรือไม่ตรงกับอำเภอ/เขตที่เลือก',
    })
    return { isValid: false, errors }
  }

  // 4. ตรวจสอบรหัสไปรษณีย์ (Postal Code)
  if (!cleanPostal) {
    errors.push({ field: 'postalCode', message: 'กรุณากรอกรหัสไปรษณีย์' })
    return { isValid: false, errors }
  }

  // เช็คว่าตรงกับ zip_code ของตำบลนี้ หรืออยู่ในกลุ่ม zip_code ที่ถูกต้องของอำเภอนี้
  const validZipsInDistrict = new Set(
    districtSubdistricts.map((s) => String(s.zip_code).trim())
  )
  const targetZip = String(matchedSubdistrict.zip_code).trim()

  if (cleanPostal !== targetZip && !validZipsInDistrict.has(cleanPostal)) {
    errors.push({
      field: 'postalCode',
      message: 'รหัสไปรษณีย์ไม่ถูกต้องหรือไม่ตรงกับตำบล/อำเภอที่เลือก',
    })
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    normalized: {
      province: matchedProvince.name_in_thai,
      district: matchedDistrict.name_in_thai.replace(/^(เขต|อำเภอ)\s*/, ''),
      subdistrict: matchedSubdistrict.name_in_thai,
      postalCode: targetZip || cleanPostal,
    },
  }
}
