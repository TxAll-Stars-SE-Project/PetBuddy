import prisma from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { payment_plan } from '../generated/prisma/enums.js';
import { sendNewBookingToSitterEmail } from './mail.service.js';
import { DEPOSIT_RATE } from './payment.service.js';
import { calculateBookingAmounts } from '../validators/booking.validator.js';
import { Prisma } from '../generated/prisma/client.js'
import { ACTIVE_BOOKING_STATUSES } from '../constants/booking.constant.js';

interface PetBookingInput {
  petId: number;
  petNote?: string;
}

export interface CreateBookingInput {
  sitterId: number;
  serviceId: number;
  starttime: string;
  endtime: string;
  paymentplan: payment_plan;
  note?: string;
  pets: PetBookingInput[];
}

export const createBooking = async (ownerId: number, input: CreateBookingInput) => {
  const start = new Date(input.starttime);
  const end = new Date(input.endtime);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(400, 'INVALID_TIME', 'Invalid start or end time format');
  }

  // Past date blocking
  if (start < now) {
    throw new AppError(400, 'INVALID_TIME', 'Cannot book in the past');
  }
  if (end <= start) {
    throw new AppError(400, 'INVALID_TIME', 'End time must be after start time');
  }

  // ตรวจสอบว่ามี พี่เลี้ยง และ บริการ นี้อยู่จริงและเปิดให้บริการ
  const service = await prisma.services.findFirst({
    where: { 
      serviceid: input.serviceId, 
      userid: input.sitterId,
      status: 'published' 
    },
    include: {
      petsitter: {
        include: { 
          USER: true 
        }
      }
    }
  });

  if (!service || service.petsitter?.USER?.is_active === false) {
    throw new AppError(404, 'NOT_FOUND', 'Sitter or service not found');
  }

  // ดึงชื่อของ Pet Owner เพื่อใช้ในอีเมลแจ้งเตือน
  const owner = await prisma.petowner.findUnique({
    where: { userid: ownerId },
    include: { USER: true }
  });

  // ตรวจสอบว่า สัตว์เลี้ยงทั้งหมด เป็นของ Owner คนนี้จริงไหม
  const petIds = input.pets.map(p => Number(p.petId));
  const uniquePetIds = new Set(petIds);
  if (uniquePetIds.size !== petIds.length) {
    throw new AppError(400, 'INVALID_INPUT', 'Duplicate pet IDs are not allowed');
  }
  const ownedPets = await prisma.pet.findMany({
    where: { 
      ownerid: ownerId,
      petid: { in: petIds }
    }
  });

  if (ownedPets.length !== petIds.length) {
    throw new AppError(404, 'PET_NOT_FOUND', 'One or more pets not found or do not belong to you');
  }

  // คำนวณราคา (Backend Calculation) ใช้ DEPOSIT_RATE เดียวกับ payment.service.ts
  const { totalPrice, depositAmount } = calculateBookingAmounts(
    Number(service.price),
    start,
    end,
    input.pets.length,
    DEPOSIT_RATE
  );

  // บันทึกข้อมูลลงฐานข้อมูล (ใช้ Transaction เพื่อรับประกันว่าลงครบทั้ง 2 ตาราง)
  const result = await prisma.$transaction(async (tx) => {
    // ตรวจสอบคิวซ้อน (Overlap Prevention)
    const overlappingBooking = await tx.booking.findFirst({
        where: {
        sitterid: input.sitterId,
        bookingstatus: {
            in: ACTIVE_BOOKING_STATUSES
        },
        starttime: { lt: end },
        endtime: { gt: start }
        }
    });

    if (overlappingBooking) {
        throw new AppError(409, 'TIME_OVERLAP', 'Time slot overlaps with an existing booking');
    }
    // สร้างบิลจอง
    const booking = await tx.booking.create({
      data: {
        ownerid: ownerId,
        sitterid: input.sitterId,
        serviceid: input.serviceId,
        starttime: start,
        endtime: end,
        paymentplan: input.paymentplan,
        note: input.note,
        totalprice: totalPrice,
        bookingstatus: 'pending'
      }
    });

    // สร้างรายละเอียดสัตว์เลี้ยงที่เข้ารับบริการ
    const bookingDetailsData = input.pets.map(p => ({
      bookingid: booking.bookingid,
      petid: p.petId,
      pet_note: p.petNote
    }));

    await tx.bookingdetail.createMany({
      data: bookingDetailsData
    });

    return booking;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
});

  sendNewBookingToSitterEmail({
    sitterEmail: service.petsitter.USER.email,
    sitterUsername: service.petsitter.USER.username,
    ownerName: owner?.USER.username || 'ลูกค้า',
    serviceName: service.servicename,
    bookingId: result.bookingid,
    startTime: input.starttime,
    endTime: input.endtime,
    totalPrice: totalPrice
  }).catch(err => console.error("Email error:", err));

  const responsePets = input.pets.map(inputPet => {
    const petInfo = ownedPets.find(p => p.petid === inputPet.petId);
    return {
      petId: inputPet.petId,
      petName: petInfo?.name || 'Unknown',
      petNote: inputPet.petNote || null
    };
  });

  return {
    bookingId: result.bookingid,
    bookingstatus: result.bookingstatus,
    totalPrice: totalPrice,
    depositAmount: depositAmount,
    pets: responsePets
  };
};

export const updateServiceStatus = async (sitterId: number, bookingId: number, action: string) => {
  // 1. หาข้อมูล Booking
  const booking = await prisma.booking.findUnique({
    where: { bookingid: bookingId },
    include: {
      petowner: { include: { USER: true } },
      services: true
    }
  });

  if (!booking) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  // 2. ตรวจสอบสิทธิ์ (ต้องเป็นพี่เลี้ยงที่รับงานนี้เท่านั้น)
  if (booking.sitterid !== sitterId) {
    throw new AppError(403, 'FORBIDDEN', 'Not the assigned sitter of this booking');
  }

  let newStatus = '';

  // 3. State Machine Logic ตาม API Doc
  if (action === 'start') {
    // 3.1 เช็คสถานะ
    if (booking.bookingstatus !== 'confirmed' && booking.bookingstatus !== 'deposit_paid') {
      throw new AppError(400, 'INVALID_STATUS', 'Booking must be confirmed or deposit paid before starting');
    }
    
    // 3.2 เช็คเวลา (ต้องถึงเวลาเริ่มงานแล้ว)
    const now = new Date();
    const startDate = new Date(booking.starttime);
    if (now < startDate) {
      throw new AppError(400, 'EARLY_START', 'Cannot start service before the scheduled start date');
    }

    newStatus = 'in_progress';

  } else if (action === 'complete') {
    // 3.3 เช็คสถานะ
    if (booking.bookingstatus !== 'in_progress') {
      // ใช้ข้อความเป๊ะๆ ตามสเปก
      throw new AppError(400, 'INVALID_STATUS', 'Cannot complete service before starting. Current status must be in_progress.');
    }
    
    // 3.4 เช็คแผนการชำระเงิน
    newStatus = booking.paymentplan === 'full' ? 'completed' : 'waiting_final_payment';
    
  } else {
    throw new AppError(400, 'INVALID_ACTION', 'Action must be "start" or "complete"');
  }

  // 4. อัปเดตสถานะลง Database
  const updatedBooking = await prisma.booking.update({
    where: { bookingid: bookingId },
    data: { 
      bookingstatus: newStatus as any
    }
  });

  // 4. ส่งอีเมลแจ้งเตือน Pet Owner (เดี๋ยวเราไปเขียนฟังก์ชันนี้ใน mail.service.ts กันต่อ)
  /*
  if (action === 'start') {
    sendServiceStartedEmail({ ... });
  } else if (action === 'complete') {
    sendServiceCompletedEmail({ ... });
  }
  */

  return {
    bookingId: updatedBooking.bookingid,
    bookingstatus: updatedBooking.bookingstatus,
    action: action
  };
};