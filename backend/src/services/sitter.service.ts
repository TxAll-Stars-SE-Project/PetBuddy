import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreateServiceInput } from '../validators/service.validator.js'
import { SitterSearchInput } from '../validators/sitterSearch.validator.js'
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

// ค้นหาพี่เลี้ยง: 1 แถวต่อ 1 sitter, services ที่แสดงคือเฉพาะที่ตรงเงื่อนไขกรองทั้งหมดพร้อมกัน
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
      // escape \ % _ เพื่อให้เป็นตัวอักษรธรรมดา ไม่ใช่ wildcard ของ ILIKE (Prisma contains ไม่ escape ให้)
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
    minPrice: s.services[0].price,   // services เรียงราคาน้อย→มาก และมีอย่างน้อย 1 รายการเสมอ (some)
    rating: null as number | null,   // TODO(task 2): คำนวณจาก review
    reviewCount: 0,
  }))

  return {
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  }
}

export const createService =async (userid: number, input: CreateServiceInput) => {
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