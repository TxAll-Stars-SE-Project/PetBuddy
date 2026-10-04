import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreateServiceInput } from '../validators/service.validator.js'
import { service_type_enum } from '../generated/prisma/enums.js'

// map เดิมที่ซ้ำกัน → รวมเป็นฟังก์ชันเดียวใช้ร่วมกัน (AI Review: consistent mapping)
const mapServiceRow = (s: {
  serviceid: number
  servicename: string
  servicetype: string
  species: string[]
  price: number
  description: string | null
  status: string
  createdat: Date
}) => ({
  serviceId: s.serviceid,
  serviceName: s.servicename,
  serviceType: s.servicetype,
  species: s.species ?? [],
  price: s.price,
  description: s.description,
  status: s.status,
  createdAt: s.createdat,
})

// มุมมองเจ้าของ: เห็นทุก status
export const getServicesBySitter = async (userid: number) => {
  const rows = await prisma.services.findMany({
    where: { userid },
    orderBy: [{ createdat: 'desc' }, { serviceid: 'desc' }],
  })
  return rows.map(mapServiceRow)
}

// มุมมองสาธารณะ: เห็นเฉพาะ published (กติกา visibility ของ US4-1)
export const getPublishedServicesBySitter = async (sitterId: number) => {
  const sitter = await prisma.petsitter.findUnique({ where: { userid: sitterId } })
  if (!sitter) throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found')

  const rows = await prisma.services.findMany({
    where: { userid: sitterId, status: 'published' },
    orderBy: [{ createdat: 'desc' }, { serviceid: 'desc' }],
  })
  return rows.map(mapServiceRow)
}

export const createService = async (userid: number, input: CreateServiceInput) => {
  const created = await prisma.services.create({
    data: {
      userid,
      servicename: input.serviceName,
      servicetype: input.serviceType as service_type_enum,   // ✅ cast แบบ type-safe (validator การันตีค่า)
      species: Array.from(new Set(input.species)),            // ✅ deduplicate (AI Review ข้อ 4)
      price: input.price,
      description: input.description ?? null,
      status: 'published',                                    // auto-publish
    },
  })
  return mapServiceRow(created)
}