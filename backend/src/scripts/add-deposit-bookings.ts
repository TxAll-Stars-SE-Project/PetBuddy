import 'dotenv/config'
import prisma from '../utils/prisma.js'

async function addDepositBookings() {
  console.log('================================================================================')
  console.log('➕ PetBuddy - Adding Extra Mock Bookings (Deposit ฿1,500)')
  console.log('================================================================================\n')

  try {
    const owner = await prisma.uSER.findUnique({
      where: { email: 'demo_owner_somchai@petbuddy.com' },
      include: { petowner: true },
    })
    const sitter = await prisma.uSER.findUnique({
      where: { email: 'demo_sitter_tanin@petbuddy.com' },
      include: { petsitter: true },
    })

    if (!owner || !sitter) {
      console.error('❌ ไม่พบบัญชี demo_owner_somchai หรือ demo_sitter_tanin')
      return
    }

    const service = await prisma.services.findFirst({
      where: { userid: sitter.userid },
    })
    const pet = await prisma.pet.findFirst({
      where: { ownerid: owner.userid },
    })

    if (!service || !pet) {
      console.error('❌ ไม่พบบริการหรือสัตว์เลี้ยงของบัญชี demo')
      return
    }

    const now = new Date()
    const createdBookings = []

    for (let i = 1; i <= 3; i++) {
      const startTime = new Date(now.getTime() + 24 * i * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000)

      const b = await prisma.booking.create({
        data: {
          ownerid: owner.userid,
          sitterid: sitter.userid,
          serviceid: service.serviceid,
          starttime: startTime,
          endtime: endTime,
          totalprice: 5000,
          paymentplan: 'deposit',
          bookingstatus: 'waiting_payment',
          note: `การจองทดสอบมัดจำ 1,500 บาท (รายการที่ ${i})`,
          bookingdetail: {
            create: [
              {
                petid: pet.petid,
                pet_note: 'แมวขี้อ้อน นิสัยเรียบร้อย',
              },
            ],
          },
        },
      })
      createdBookings.push(b)
      console.log(`✅ สร้างการจอง #${b.bookingid} สำเร็จ!`)
      console.log(`   - สถานะ: waiting_payment (รอชำระมัดจำ)`)
      console.log(`   - แผน: มัดจำ 30% (ยอดมัดจำ: ฿1,500 / ยอดรวม: ฿5,000)`)
    }

    console.log('\n================================================================================')
    console.log(`🎉 เพิ่มการจองมัดจำ ฿1,500 จำนวน ${createdBookings.length} รายการ เรียบร้อยแล้ว!`)
    console.log('🐾 เจ้าของสัตว์เลี้ยง (demo_owner_somchai@petbuddy.com) เข้าหน้า /bookings เพื่อทดสอบได้ทันที')
    console.log('================================================================================\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDepositBookings()
