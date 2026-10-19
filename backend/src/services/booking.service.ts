import prisma from '../utils/prisma.js'

export interface CreateBookingInput {
  sitterId: number
  serviceId: number
  petIds: number[]
  starttime: string
  endtime: string
  paymentplan: 'deposit' | 'full'
  note?: string
}

export async function createBooking(ownerUserId: number, input: CreateBookingInput) {
  // ดึงข้อมูลบริการเพื่อนำราคามาคำนวณราคารวม
  const service = await prisma.services.findUnique({
    where: { serviceid: input.serviceId },
  })

  const start = new Date(input.starttime)
  const end = new Date(input.endtime)
  const diffHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))
  const priceRate = Number(service?.price || 0)
  const calculatedTotalPrice = diffHours * priceRate * input.petIds.length

  const booking = await prisma.booking.create({
    data: {
      ownerid: ownerUserId,
      sitterid: input.sitterId,
      serviceid: input.serviceId,
      starttime: start,
      endtime: end,
      paymentplan: input.paymentplan,
      note: input.note || null,
      bookingstatus: 'pending',
      totalprice: calculatedTotalPrice,
      bookingdetail: {
        create: input.petIds.map((petId) => ({
          petid: petId,
        })),
      },
    },
  })

  return booking
}