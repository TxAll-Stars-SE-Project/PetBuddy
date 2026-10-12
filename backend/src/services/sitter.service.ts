import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreateServiceInput, UpdateServiceInput } from '../validators/service.validator.js'
import { SitterSearchInput } from '../validators/sitterSearch.validator.js'
import { booking_status, service_type } from '../generated/prisma/enums.js'

const ARCHIVED = 'archived'
const ACTIVE_BOOKING_STATUSES: booking_status[] = [
  'pending', 'waiting_payment', 'deposit_paid', 'confirmed', 'waiting_final_payment',
]

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

export const getServicesBySitter = async (userid: number) => {
  const rows = await prisma.services.findMany({
    where: { userid, status: { not: ARCHIVED } },
    orderBy: [{ createdat: 'desc' }, { serviceid: 'desc' }],
  })
  return rows.map(mapServiceRow)
}

export const getPublishedServicesBySitter = async (sitterId: number) => {
  const sitter = await prisma.petsitter.findUnique({ where: { userid: sitterId } })
  if (!sitter) throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found')

  const rows = await prisma.services.findMany({
    where: { userid: sitterId, status: 'published' },
    orderBy: [{ createdat: 'desc' }, { serviceid: 'desc' }],
  })
  return rows.map(mapServiceRow)
}

export const listSitters = async (filters: SitterSearchInput) => {
  const serviceWhere = {
    status: 'published',
    ...(filters.category && { servicetype: filters.category as service_type }),
    ...(filters.petType && { species: { has: filters.petType } }),
    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      price: { gte: filters.minPrice, lte: filters.maxPrice },
    }),
  }

  const where = {
    USER: {
      is_active: true,
      province: filters.province,
      district: filters.district,
      ...(filters.q && {
        username: { contains: filters.q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const },
      }),
    },
    services: { some: serviceWhere },
  }

  const [total, sitters] = await Promise.all([
    prisma.petsitter.count({ where }),
    prisma.petsitter.findMany({
      where,
      include: {
        USER: { select: { username: true, province: true, district: true } },
        services: { where: serviceWhere, orderBy: [{ price: 'asc' }, { serviceid: 'asc' }] },
      },
      orderBy: { userid: 'asc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ])

  const items = sitters.map((s) => ({
    sitterId: s.userid,
    username: s.USER.username,
    province: s.USER.province,
    district: s.USER.district,
    services: s.services.map(mapServiceRow),
    minPrice: s.services[0]?.price ?? null,
    rating: null as number | null,
    reviewCount: 0,
  }))

  return {
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  }
}

export const createService = async (userid: number, input: CreateServiceInput) => {
  const created = await prisma.services.create({
    data: {
      userid,
      servicename: input.serviceName,
      servicetype: input.serviceType as service_type,
      species: Array.from(new Set(input.species)),
      price: input.price,
      description: input.description ?? null,
      status: 'published',
    },
  })
  return mapServiceRow(created)
}

export const updateService = async (serviceId: number, userId: number, input: UpdateServiceInput) => {
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
      ...(input.description !== undefined && { description: input.description }),
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

  await prisma.services.update({
    where: { serviceid: serviceId },
    data: { status: ARCHIVED },
  })

  return { serviceId }
}