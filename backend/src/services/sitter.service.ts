import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreateServiceInput } from '../validators/service.validator.js'
import { service_type } from '../generated/prisma/enums.js'

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
      servicetype: input.serviceType as service_type,          // ✅ cast แบบ type-safe (validator การันตีค่า)
      species: Array.from(new Set(input.species)),            // ✅ deduplicate (AI Review ข้อ 4)
      price: input.price,
      description: input.description ?? null,
      status: 'published',                                    // auto-publish
    },
  })
  return mapServiceRow(created)
}

// ✅ ฟังก์ชันสำหรับ PATCH
export const updateService = async (serviceId: number, userId: number, input: Partial<CreateServiceInput>) => {
  // 1. หา service + เช็ก ownership
  const service = await prisma.services.findUnique({ where: { serviceid: serviceId } })
  
  if (!service) {
    throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found')
  }
  
  if (service.userid !== userId) {
    throw new AppError(403, 'NOT_OWNER', 'Not the owner of this service')
  }
  
  // 2. อัปเดตเฉพาะ field ที่ส่งมา (partial update)
  const updated = await prisma.services.update({
    where: { serviceid: serviceId },
    data: {
      ...(input.serviceName !== undefined && { servicename: input.serviceName }),
      ...(input.serviceType !== undefined && { servicetype: input.serviceType as service_type }),
      ...(input.species !== undefined && { species: input.species }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.description !== undefined && { description: input.description ?? null }),
    },
  })
  
  return mapServiceRow(updated)
}

// ✅ ฟังก์ชันสำหรับ DELETE
export const deleteService = async (serviceId: number, userId: number) => {
  // 1. หา service + เช็ก ownership
  const service = await prisma.services.findUnique({
    where: { serviceid: serviceId },
    include: { booking: true },  // ดึง bookings มาด้วยเพื่อเช็ก active
  })
  
  if (!service) {
    throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found')
  }
  
  if (service.userid !== userId) {
    throw new AppError(403, 'NOT_OWNER', 'Not the owner of this service')
  }
  
  // 2. เช็ก active bookings (ถ้ามี → ห้ามลบ)
  const activeStatuses = ['pending', 'waiting_payment', 'deposit_paid', 'confirmed', 'waiting_final_payment']
  const hasActiveBookings = service.booking.some((b) => activeStatuses.includes(b.bookingstatus))
  
  if (hasActiveBookings) {
    throw new AppError(409, 'SERVICE_HAS_ACTIVE_BOOKINGS', 'Service has active bookings')
  }
  
  // 3. ลบ service
  await prisma.services.delete({ where: { serviceid: serviceId } })
  
  return { serviceId }
}