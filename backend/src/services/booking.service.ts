import prisma from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { payment_plan } from '../generated/prisma/enums.js';
import { sendNewBookingToSitterEmail } from './mail.service.js';
import { Prisma } from '../generated/prisma/client.js'

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

  //Past date blocking
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

  if (!service) {
    throw new AppError(404, 'NOT_FOUND', 'Sitter or service not found');
  }

  // ดึงชื่อของ Pet Owner เพื่อใช้ในอีเมลแจ้งเตือน
  const owner = await prisma.petowner.findUnique({
    where: { userid: ownerId },
    include: { USER: true }
  });

  // ตรวจสอบว่า สัตว์เลี้ยงทั้งหมด เป็นของ Owner คนนี้จริงไหม
  const petIds = input.pets.map(p => p.petId);
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

  
  // คำนวณราคา (Backend Calculation)
  // หาระยะเวลาเป็นชั่วโมง (ปัดเศษขึ้นถ้ามีเศษนาที)
  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) throw new AppError(400, 'INVALID_TIME', 'End time must be after start time');
  
  const hours = Math.ceil(durationMs / (1000 * 60 * 60));
  const numberOfPets = input.pets.length;
  
  const totalPrice = service.price * hours * numberOfPets;
  const depositAmount = totalPrice * 0.3; // มัดจำ 30% 

  // บันทึกข้อมูลลงฐานข้อมูล (ใช้ Transaction เพื่อรับประกันว่าลงครบทั้ง 2 ตาราง)
  const result = await prisma.$transaction(async (tx) => {
    // ตรวจสอบคิวซ้อน (Overlap Prevention)
    const overlappingBooking = await tx.booking.findFirst({
        where: {
        sitterid: input.sitterId,
        bookingstatus: {
            in: ['pending', 'waiting_payment', 'deposit_paid', 'confirmed', 'waiting_final_payment']
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