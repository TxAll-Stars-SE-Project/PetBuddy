import prisma from '../utils/prisma.js'
import { booking_status } from '../generated/prisma/enums.js'
import { BookingStatusFilter } from '../validators/booking.validator.js'

/**
 * รูปแบบข้อมูลการจองที่ส่งกลับให้เจ้าของสัตว์เลี้ยง (docs/API.md § 2.3)
 */
export interface OwnerBookingResponse {
  bookingId: number
  sitterName: string
  serviceName: string
  starttime: string
  endtime: string
  bookingstatus: string
  totalPrice: number
  pets: {
    petId: number
    petName: string
    petNote: string | null
  }[]
}

/**
 * ดึงรายการจองทั้งหมดของเจ้าของสัตว์เลี้ยงคนปัจจุบัน (รองรับการกรองตามสถานะ)
 */
export const getOwnerBookings = async (
  ownerUserId: number,
  statusFilter?: BookingStatusFilter
): Promise<OwnerBookingResponse[]> => {
  const bookings = await prisma.booking.findMany({
    where: {
      ownerid: ownerUserId,
      ...(statusFilter ? { bookingstatus: statusFilter as booking_status } : {}),
    },
    orderBy: {
      bookingdate: 'desc',
    },
    include: {
      services: {
        select: {
          servicename: true,
        },
      },
      petsitter: {
        include: {
          USER: {
            select: {
              username: true,
            },
          },
        },
      },
      bookingdetail: {
        include: {
          pet: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return bookings.map((b): OwnerBookingResponse => ({
    bookingId: b.bookingid,
    sitterName: b.petsitter?.USER?.username || 'Unknown',
    serviceName: b.services?.servicename || 'Service',
    starttime: b.starttime.toISOString(),
    endtime: b.endtime.toISOString(),
    bookingstatus: b.bookingstatus,
    totalPrice: Number(b.totalprice),
    pets: b.bookingdetail.map((bd) => ({
      petId: bd.petid,
      petName: bd.pet?.name || '',
      petNote: bd.pet_note,
    })),
  }))
}
