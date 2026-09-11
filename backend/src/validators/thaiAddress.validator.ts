import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

interface ProvinceItem {
  id: number
  name_th: string
  name_en: string
}

interface DistrictItem {
  id: number
  name_th: string
  name_en: string
  province_id: number
}

interface SubdistrictItem {
  id: number
  zip_code: number
  name_th: string
  name_en: string
  district_id: number
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


function loadAddressData() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const candidateDirs = [
    path.resolve(currentDir, '../data/thai-address'),
    path.resolve(currentDir, '../../src/data/thai-address'),
    path.resolve(process.cwd(), 'src/data/thai-address'),
    path.resolve(process.cwd(), '../frontend/src/assets/thai-address'),
  ]

  let dataDir = candidateDirs[0]
  for (const dir of candidateDirs) {
    if (fs.existsSync(path.join(dir, 'province.json'))) {
      dataDir = dir
      break
    }
  }

  const provinces: ProvinceItem[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'province.json'), 'utf8')
  )
  const districts: DistrictItem[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'district.json'), 'utf8')
  )
  const subDistricts: SubdistrictItem[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'sub_district.json'), 'utf8')
  )

  return { provinces, districts, subDistricts }
}

const { provinces, districts, subDistricts } = loadAddressData()

// Pre-indexed Maps สำหรับการค้นหา O(1)
const provinceIndex = new Map<string, ProvinceItem>()
for (const p of provinces) {
  provinceIndex.set(normalizeAddressName(p.name_th), p)
  if (p.name_en) {
    provinceIndex.set(normalizeAddressName(p.name_en), p)
  }
}

// Key: `${provinceId}:${normalizedDistrictName}`
const districtIndex = new Map<string, DistrictItem>()
for (const d of districts) {
  districtIndex.set(`${d.province_id}:${normalizeAddressName(d.name_th)}`, d)
  if (d.name_en) {
    districtIndex.set(`${d.province_id}:${normalizeAddressName(d.name_en)}`, d)
  }
}

// Key: `${districtId}:${normalizedSubdistrictName}`
const subdistrictIndex = new Map<string, SubdistrictItem>()
const districtZips = new Map<number, Set<string>>()
for (const s of subDistricts) {
  subdistrictIndex.set(`${s.district_id}:${normalizeAddressName(s.name_th)}`, s)
  if (s.name_en) {
    subdistrictIndex.set(`${s.district_id}:${normalizeAddressName(s.name_en)}`, s)
  }

  if (!districtZips.has(s.district_id)) {
    districtZips.set(s.district_id, new Set())
  }
  districtZips.get(s.district_id)!.add(String(s.zip_code).trim())
}

/**
 * ตรวจสอบความถูกต้องและความสัมพันธ์ของที่อยู่ไทย 4 ระดับแบบ O(1) Fast Lookup:
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

  const matchedProvince = provinceIndex.get(normProv)
  if (!matchedProvince) {
    errors.push({ field: 'province', message: 'ไม่พบจังหวัดที่ระบุในประเทศไทย' })
    return { isValid: false, errors }
  }

  // 2. ตรวจสอบอำเภอ/เขต (District) ภายใต้จังหวัดที่เลือก
  if (!normDist) {
    errors.push({ field: 'district', message: 'กรุณากรอกอำเภอ/เขต' })
    return { isValid: false, errors }
  }

  const matchedDistrict = districtIndex.get(`${matchedProvince.id}:${normDist}`)
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

  const matchedSubdistrict = subdistrictIndex.get(`${matchedDistrict.id}:${normSub}`)
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

  const targetZip = String(matchedSubdistrict.zip_code).trim()
  const validZipsForDistrict = districtZips.get(matchedDistrict.id)

  if (cleanPostal !== targetZip && (!validZipsForDistrict || !validZipsForDistrict.has(cleanPostal))) {
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
      province: matchedProvince.name_th,
      district: matchedDistrict.name_th.replace(/^(เขต|อำเภอ)\s*/, ''),
      subdistrict: matchedSubdistrict.name_th.replace(/^(แขวง|ตำบล)\s*/, ''),
      postalCode: targetZip || cleanPostal,
    },
  }
}
