import prisma from '../utils/prisma.js'
import { AppError } from '../utils/errors.js'
import { booking_status } from '../generated/prisma/enums.js'
import { SitterBookingAction, BookingStatusFilter } from '../validators/booking.validator.js'
import { sendBookingStatusNotificationEmail } from './mail.service.js'

export interface FormattedBookingResponse {
  bookingId: number
  ownerName: string
  serviceName: string
  starttime: string
  endtime: string
  bookingstatus: string
  totalprice: number
  paymentplan: string | null
  note: string | null
  bookingdate: string
  owner: {
    ownerId: number
    fullname: string
    phone: string
    email: string
  }
  service: {
    serviceId: number
    title: string
    servicetype: string
    price: number
  }
  pets: {
    petId: number
    petName: string
    petNote: string | null
    species: string | null
    breed: string | null
    imageUrl: string | null
  }[]
}

/**
 * ดึงรายการคำขอจองทั้งหมดที่ส่งมาหาพี่เลี้ยงคนปัจจุบัน (รองรับการกรองตามสถานะ)
 */
export const getSitterBookings = async (
  sitterUserId: number,
  statusFilter?: BookingStatusFilter
): Promise<FormattedBookingResponse[]> => {
  const bookings = await prisma.booking.findMany({
    where: {
      sitterid: sitterUserId,
      ...(statusFilter ? { bookingstatus: statusFilter as booking_status } : {}),
    },
    orderBy: {
      bookingdate: 'desc',
    },
    include: {
      services: {
        select: {
          serviceid: true,
          servicename: true,
          servicetype: true,
          price: true,
        },
      },
      petowner: {
        include: {
          USER: {
            select: {
              userid: true,
              username: true,
              email: true,
              tel: true,
            },
          },
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
              petid: true,
              name: true,
              species: true,
              breed: true,
              image_url: true,
            },
          },
        },
      },
    },
  })

  return bookings.map((b): FormattedBookingResponse => {
    const ownerUser = b.petowner?.USER
    const serviceInfo = b.services

    const pets = b.bookingdetail.map((bd) => ({
      petId: bd.petid,
      petName: bd.pet?.name || '',
      petNote: bd.pet_note,
      species: bd.pet?.species || null,
      breed: bd.pet?.breed || null,
      imageUrl: bd.pet?.image_url || null,
    }))

    return {
      bookingId: b.bookingid,
      ownerName: ownerUser?.username || 'Unknown',
      serviceName: serviceInfo?.servicename || 'Service',
      starttime: b.starttime.toISOString(),
      endtime: b.endtime.toISOString(),
      bookingstatus: b.bookingstatus,
      totalprice: Number(b.totalprice),
      paymentplan: b.paymentplan,
      note: b.note,
      bookingdate: b.bookingdate.toISOString(),
      owner: {
        ownerId: ownerUser?.userid || b.ownerid,
        fullname: ownerUser?.username || 'Unknown',
        phone: ownerUser?.tel || '',
        email: ownerUser?.email || '',
      },
      service: {
        serviceId: serviceInfo?.serviceid || b.serviceid,
        title: serviceInfo?.servicename || '',
        servicetype: serviceInfo?.servicetype || '',
        price: serviceInfo?.price || 0,
      },
      pets,
    }
  })
}

/**
 * อัปเดตสถานะการจองโดยพี่เลี้ยง (accept / reject / complete)
 * พร้อมส่งอีเมลแจ้งเตือนไปยังเจ้าของสัตว์เลี้ยง
 */
export const updateBookingStatusBySitter = async (
  sitterUserId: number,
  bookingId: number,
  action: SitterBookingAction
): Promise<{ bookingId: number; bookingstatus: string }> => {
  // 1. ค้นหา Booking
  const existingBooking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
    include: {
      services: true,
      petowner: {
        include: {
          USER: true,
        },
      },
      petsitter: {
        include: {
          USER: true,
        },
      },
      bookingdetail: {
        include: {
          pet: true,
        },
      },
    },
  })

  if (!existingBooking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  }

  // 2. ตรวจสอบสิทธิ์ว่าต้องเป็นพี่เลี้ยงที่ได้รับการมอบหมายคำขอนี้เท่านั้น
  if (existingBooking.sitterid !== sitterUserId) {
    throw new AppError(403, 'FORBIDDEN', 'Not the assigned sitter of this booking')
  }

  // 3. ตรวจสอบความถูกต้องของ State Transition
  let nextStatus: booking_status
  if (action === 'accept') {
    if (existingBooking.bookingstatus !== 'pending') {
      throw new AppError(409, 'INVALID_STATUS_TRANSITION', 'Invalid status transition')
    }
    nextStatus = 'waiting_payment'
  } else if (action === 'reject') {
    if (existingBooking.bookingstatus !== 'pending') {
      throw new AppError(409, 'INVALID_STATUS_TRANSITION', 'Invalid status transition')
    }
    nextStatus = 'rejected'
  } else if (action === 'complete') {
    if (existingBooking.bookingstatus !== 'confirmed') {
      throw new AppError(409, 'INVALID_STATUS_TRANSITION', 'Invalid status transition')
    }
    nextStatus = 'waiting_final_payment'
  } else {
    throw new AppError(400, 'INVALID_ACTION', 'Invalid action')
  }

  // 4. บันทึกการเปลี่ยนสถานะลง Database
  const updated = await prisma.booking.update({
    where: { bookingid: bookingId },
    data: { bookingstatus: nextStatus },
  })

  // 5. ส่งอีเมลแจ้งเตือนไปยัง Pet Owner (แบบ Non-blocking safe dispatch)
  const ownerUser = existingBooking.petowner?.USER
  const sitterUser = existingBooking.petsitter?.USER
  if (ownerUser?.email) {
    const petNames = existingBooking.bookingdetail.map((bd) => bd.pet.name)
    sendBookingStatusNotificationEmail({
      toEmail: ownerUser.email,
      ownerUsername: ownerUser.username,
      sitterUsername: sitterUser?.username || 'พี่เลี้ยง',
      serviceName: existingBooking.services?.servicename || 'บริการสัตว์เลี้ยง',
      action,
      bookingId: existingBooking.bookingid,
      startTime: existingBooking.starttime.toLocaleString('th-TH'),
      endTime: existingBooking.endtime.toLocaleString('th-TH'),
      petNames,
      totalPrice: Number(existingBooking.totalprice),
    }).catch((err) => {
      console.error('[SitterBookingService] Error dispatching booking notification email:', err)
    })
  }

  return {
    bookingId: updated.bookingid,
    bookingstatus: updated.bookingstatus,
  }
}
