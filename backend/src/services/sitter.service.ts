import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { CreateServiceInput, UpdateServiceInput } from '../validators/service.validator.js'
import { SitterSearchInput, SitterSort } from '../validators/sitterSearch.validator.js'
import { booking_status, service_type } from '../generated/prisma/enums.js'
import { Prisma } from '../generated/prisma/client.js'
import { ACTIVE_BOOKING_STATUSES } from '../constants/booking.constant.js'


const ARCHIVED = 'archived'
// ACTIVE_BOOKING_STATUSES is imported from constants

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

export const getProfileById = async (sitterId: number) => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
    include: { USER: true },
  });

  if (!sitter || sitter.USER?.is_active === false) {
    throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found');
  }


  const ratingAgg = await prisma.review.aggregate({
    where: { booking: { sitterid: sitterId } },
    _avg: { review_score: true }
  });
  const avgRating = ratingAgg._avg.review_score 
    ? Math.round(ratingAgg._avg.review_score * 10) / 10 
    : 0;

  return {
    sitterId: sitter.userid,
    username: sitter.USER.username,
    province: sitter.USER.province || "",
    rating: avgRating
  };
};

export const getSitterReviewsById = async (sitterId: number) => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
  });
  if (!sitter) throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found');

  const reviews = await prisma.review.findMany({
    where: {
      booking: {
        sitterid: sitterId,
      },
    },
    include: {
      booking: {
        include: {
          petowner: {
            include: {
              USER: true,
            },
          },
        },
      },
    },
    orderBy: { reviewid: 'desc' },
  });

  return reviews.map((r) => ({
    reviewId: r.reviewid,
    rating: r.review_score ?? 0,
    comment: r.review_detail ?? '',
    ownerName: r.booking.petowner.USER.username,
    createdAt: r.booking.bookingdate, // ใช้ bookingdate แทนเพราะตาราง review ยังไม่มี created_at
  }));
};

export const getBusySlots = async (sitterId: number, dateString: string) => {
  const sitter = await prisma.petsitter.findUnique({
    where: { userid: sitterId },
  });
  
  if (!sitter) {
    throw new AppError(404, 'SITTER_NOT_FOUND', 'Sitter not found');
  }

  // ขอบเขตเวลาของวันนั้น
  const startOfDay = new Date(`${dateString}T00:00:00+07:00`);
  const endOfDay = new Date(`${dateString}T23:59:59.999+07:00`);

  // ดึง Booking ที่มีสถานะยังดำเนินการอยู่ และเวลาคาบเกี่ยวกับวันดังกล่าว
  const bookings = await prisma.booking.findMany({
    where: {
      sitterid: sitterId,
      bookingstatus: {
        in: ACTIVE_BOOKING_STATUSES,
      },
      // เช็คเวลาที่เหลื่อมกัน
      starttime: { lte: endOfDay },
      endtime: { gte: startOfDay },
    },
    select: {
      starttime: true,
      endtime: true,
    },
    orderBy: {
      starttime: 'asc',
    },
  });

  return {
    date: dateString,
    busySlots: bookings.map((b) => ({
      starttime: b.starttime,
      endtime: b.endtime,
    })),
  };
};

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

// ORDER BY ต่อ sort option (ค่าคงที่ ไม่รับ input จากผู้ใช้) — userid ปิดท้ายเสมอเพื่อให้ลำดับคงที่ ไม่ซ้ำ/ตกหล่นข้ามหน้า
const SORT_SQL: Record<SitterSort, Prisma.Sql> = {
  rating: Prisma.sql`avg_rating DESC NULLS LAST, review_count DESC, userid ASC`,
  priceAsc: Prisma.sql`min_price ASC, userid ASC`,
  priceDesc: Prisma.sql`min_price DESC, userid ASC`,
}

interface RankedSitter {
  userid: number
  min_price: number
  avg_rating: number | null
  review_count: number
}

// CTE กลาง: matched = sitter ที่มี service ตรงเงื่อนไขทั้งหมด + ราคาต่ำสุดของ service เหล่านั้น,
// rated = คะแนนเฉลี่ย/จำนวนรีวิว (ข้าม review_score ที่เป็น null), ranked = รวมกัน + กรอง minRating
const buildRankedQuery = (filters: SitterSearchInput) => {
  const conditions: Prisma.Sql[] = [Prisma.sql`u.is_active = true`, Prisma.sql`s.status = 'published'`]
  if (filters.province) conditions.push(Prisma.sql`u.province = ${filters.province}`)
  if (filters.district) conditions.push(Prisma.sql`u.district = ${filters.district}`)
  // escape \ % _ เพื่อให้เป็นตัวอักษรธรรมดา ไม่ใช่ wildcard ของ ILIKE
  if (filters.q) conditions.push(Prisma.sql`u.username ILIKE ${`%${filters.q.replace(/[\\%_]/g, '\\$&')}%`}`)
  if (filters.category) conditions.push(Prisma.sql`s.servicetype = ${filters.category}::service_type`)
  if (filters.petType) conditions.push(Prisma.sql`${filters.petType} = ANY(s.species)`)
  if (filters.minPrice !== undefined) conditions.push(Prisma.sql`s.price >= ${filters.minPrice}`)
  if (filters.maxPrice !== undefined) conditions.push(Prisma.sql`s.price <= ${filters.maxPrice}`)

  // sitter ที่ยังไม่มีรีวิวไม่ผ่านเงื่อนไข minRating (avg_rating เป็น NULL)
  const ratingFilter =
    filters.minRating !== undefined ? Prisma.sql`WHERE rt.avg_rating >= ${filters.minRating}` : Prisma.empty

  return Prisma.sql`
    WITH matched AS (
      SELECT p.userid, MIN(s.price) AS min_price
      FROM petsitter p
      JOIN "USER" u ON u.userid = p.userid
      JOIN services s ON s.userid = p.userid
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY p.userid
    ), rated AS (
      SELECT b.sitterid, AVG(r.review_score)::float8 AS avg_rating, COUNT(r.review_score)::int AS review_count
      FROM review r
      JOIN booking b ON b.bookingid = r.bookingid
      WHERE r.review_score IS NOT NULL AND b.sitterid IN (SELECT userid FROM matched)
      GROUP BY b.sitterid
    ), ranked AS (
      SELECT m.userid, m.min_price, rt.avg_rating, COALESCE(rt.review_count, 0)::int AS review_count
      FROM matched m
      LEFT JOIN rated rt ON rt.sitterid = m.userid
      ${ratingFilter}
    )`
}

// ค้นหาพี่เลี้ยง: 1 แถวต่อ 1 sitter, services ที่แสดงคือเฉพาะที่ตรงเงื่อนไขกรองทั้งหมดพร้อมกัน
// เรียงลำดับ + แบ่งหน้าใน SQL (เรียงก่อนตัดหน้า) แล้วค่อยดึงรายละเอียด service ของ sitter ในหน้านั้น
export const listSitters = async (filters: SitterSearchInput) => {
  const serviceWhere = {
    status: 'published',
    ...(filters.category && { servicetype: filters.category as service_type }),
    ...(filters.petType && { species: { has: filters.petType } }),
    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      price: { gte: filters.minPrice, lte: filters.maxPrice },
    }),
  }

  const ranked = buildRankedQuery(filters)
  const [countRows, pageRows] = await Promise.all([
    prisma.$queryRaw<{ total: number }[]>(Prisma.sql`${ranked} SELECT COUNT(*)::int AS total FROM ranked`),
    prisma.$queryRaw<RankedSitter[]>(
      Prisma.sql`${ranked} SELECT * FROM ranked ORDER BY ${SORT_SQL[filters.sort]} LIMIT ${filters.limit} OFFSET ${(filters.page - 1) * filters.limit}`
    ),
  ])
  const total = countRows[0]?.total ?? 0

  const sitters = await prisma.petsitter.findMany({
    where: { userid: { in: pageRows.map((r) => r.userid) } },
    include: {
      USER: { select: { username: true, province: true, district: true } },
      services: { where: serviceWhere, orderBy: [{ price: 'asc' }, { serviceid: 'asc' }] },
    },
  })
  const byId = new Map(sitters.map((s) => [s.userid, s]))

  const items = pageRows.flatMap((row) => {
    const s = byId.get(row.userid)
    if (!s || s.services.length === 0) return []   // sitter/service ถูกลบหรือ archive ระหว่างสอง query (race เล็กน้อย) → ข้าม
    return [{
      sitterId: s.userid,
      username: s.USER.username,
      province: s.USER.province,
      district: s.USER.district,
      services: s.services.map(mapServiceRow),
      minPrice: row.min_price,
      // ปัดทศนิยม 1 ตำแหน่งตอนแสดงผลเท่านั้น; การเรียง/กรอง minRating ใช้ค่าเฉลี่ยจริง
      rating: row.avg_rating === null ? null : Math.round(row.avg_rating * 10) / 10,
      reviewCount: row.review_count,
    }]
  })

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
