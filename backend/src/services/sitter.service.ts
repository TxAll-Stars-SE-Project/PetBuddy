import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreateServiceInput, UpdateServiceInput } from '../validators/service.validator.js'
import { booking_status, service_type } from '../generated/prisma/enums.js'

const ARCHIVED = 'archived'
const ACTIVE_BOOKING_STATUSES: booking_status[] = [
  'pending', 'waiting_payment', 'deposit_paid', 'confirmed', 'waiting_final_payment',
]

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

// มุมมองเจ้าของ: ซ่อนตัวที่ archive แล้ว (soft-deleted)
export const getServicesBySitter = async (userid: number) => {
  const rows = await prisma.services.findMany({
    where: { userid, status: { not: ARCHIVED } },
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

export const updateService = async (serviceId: number, userId: number, input: UpdateServiceInput) => {
  // Two-step check-then-update is safe here: services.userid is immutable
  // (no ownership-transfer feature exists), so ownership cannot change between queries.
  const service = await prisma.services.findFirst({
    where: { serviceid: serviceId, status: { not: ARCHIVED } },
  })
  if (!service) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found')
  if (service.userid !== userId) throw new AppError(403, 'NOT_OWNER', 'Not the owner of this service')

  const updated = await prisma.services.update({
    where: { serviceid: serviceId },
    data: {
      ...(input.serviceName !== undefined && { servicename: input.serviceName }),
      ...(input.serviceType !== undefined && { servicetype: input.serviceType as service_type }),
      ...(input.species !== undefined && { species: input.species }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.description !== undefined && { description: input.description }),  // null clears
    },
  })
  return mapServiceRow(updated)
}

export const deleteService = async (serviceId: number, userId: number) => {
  const service = await prisma.services.findFirst({
    where: { serviceid: serviceId, status: { not: ARCHIVED } },
  })
  if (!service) throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found')
  if (service.userid !== userId) throw new AppError(403, 'NOT_OWNER', 'Not the owner of this service')

  const activeBookings = await prisma.booking.count({
    where: { serviceid: serviceId, bookingstatus: { in: ACTIVE_BOOKING_STATUSES } },
  })
  if (activeBookings > 0) {
    throw new AppError(409, 'SERVICE_HAS_ACTIVE_BOOKINGS', 'Service has active bookings')
  }

  // Soft delete: keep the row so bookings/payments/reviews history survives (no cascade).
  // Public search already filters status='published', so archived disappears automatically.
  await prisma.services.update({
    where: { serviceid: serviceId },
    data: { status: ARCHIVED },
  })

  return { serviceId }
}
