import 'dotenv/config'
import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import { uploadSlipImage } from '../utils/supabase/storage.js'

// Sample 1x1 PNG for testing slip
const SAMPLE_SLIP_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

const createMockFile = (filename = 'sample_bank_slip.png'): Express.Multer.File => ({
  fieldname: 'slip_image',
  originalname: filename,
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: SAMPLE_SLIP_PNG_BUFFER,
  size: SAMPLE_SLIP_PNG_BUFFER.length,
  stream: null as unknown as import('stream').Readable,
  destination: '',
  filename,
  path: '',
})

async function seedBrowserDemo() {
  console.log('================================================================================')
  console.log('🌱 PetBuddy - Seeding Browser Demo Data for Payment & Verification (US6-2)')
  console.log('================================================================================\n')

  try {
    // 1. Sitter User
    const sitterEmail = 'demo_sitter_tanin@petbuddy.com'
    let sitterUser = await prisma.uSER.findUnique({
      where: { email: sitterEmail },
      include: { petsitter: true },
    })

    if (!sitterUser) {
      const hashedPassword = await hashPassword('Password1234')
      sitterUser = await prisma.uSER.create({
        data: {
          username: 'sitter_tanin',
          email: sitterEmail,
          password: hashedPassword,
          tel: '0812345678',
          province: 'กรุงเทพมหานคร',
          district: 'เขตจตุจักร',
          subdistrict: 'แขวงจตุจักร',
          postal_code: '10900',
          address: '123 ถนนพหลโยธิน',
          is_active: true,
          petsitter: {
            create: {
              thaiid: '1234567890123',
              experience: 'พี่เลี้ยงสัตว์เลี้ยงมืออาชีพ ประสบการณ์ 3 ปี',
            },
          },
        },
        include: { petsitter: true },
      })
      console.log(`✅ สร้างบัญชี Pet Sitter: ${sitterUser.username} (${sitterUser.email})`)
    } else {
      console.log(`✅ พบบัญชี Pet Sitter: ${sitterUser.username} (${sitterUser.email})`)
    }

    // 2. Service
    let service = await prisma.services.findFirst({
      where: { userid: sitterUser.userid },
    })
    if (!service) {
      service = await prisma.services.create({
        data: {
          userid: sitterUser.userid,
          servicename: 'รับฝากดูแลแมวและสุนัขข้ามคืน',
          servicetype: 'sitting',
          species: ['dog', 'cat'],
          price: 500,
          description: 'ดูแลน้องๆ อย่างอบอุ่น มีกล้องตรวจดู 24 ชม. ห้องแอร์สะอาด ป้อนข้าวป้อนน้ำตรงเวลา',
          status: 'published',
        },
      })
      console.log(`✅ สร้างบริการ: "${service.servicename}" (฿500/วัน)`)
    } else {
      console.log(`✅ พบบริการ: "${service.servicename}" (฿500/วัน)`)
    }

    // 3. Owner User
    const ownerEmail = 'demo_owner_somchai@petbuddy.com'
    let ownerUser = await prisma.uSER.findUnique({
      where: { email: ownerEmail },
      include: { petowner: true },
    })

    if (!ownerUser) {
      const hashedPassword = await hashPassword('Password1234')
      ownerUser = await prisma.uSER.create({
        data: {
          username: 'owner_somchai',
          email: ownerEmail,
          password: hashedPassword,
          tel: '0898765432',
          province: 'กรุงเทพมหานคร',
          district: 'เขตปทุมวัน',
          subdistrict: 'แขวงปทุมวัน',
          postal_code: '10330',
          address: '456 สยามสแควร์',
          is_active: true,
          petowner: { create: {} },
        },
        include: { petowner: true },
      })
      console.log(`✅ สร้างบัญชี Pet Owner: ${ownerUser.username} (${ownerUser.email})`)
    } else {
      console.log(`✅ พบบัญชี Pet Owner: ${ownerUser.username} (${ownerUser.email})`)
    }

    // 4. Pet
    let pet = await prisma.pet.findFirst({
      where: { ownerid: ownerUser.userid },
    })
    if (!pet) {
      pet = await prisma.pet.create({
        data: {
          ownerid: ownerUser.userid,
          name: 'น้องโมจิ',
          species: 'cat',
          breed: 'Scottish Fold',
          gender: 'female',
          weight: 4.5,
          allergy: 'ไม่มี',
        },
      })
      console.log(`✅ สร้างสัตว์เลี้ยง: ${pet.name} (${pet.breed})`)
    } else {
      console.log(`✅ พบสัตว์เลี้ยง: ${pet.name} (${pet.breed})`)
    }

    // 5. Scenario 1: Booking พร้อมสลิปรอตรวจ (สำหรับ Sitter ทดสอบ "ตรวจสอบสลิปการโอน")
    const now = new Date()
    const startTime1 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const endTime1 = new Date(startTime1.getTime() + 12 * 60 * 60 * 1000)

    const bookingWithSlip = await prisma.booking.create({
      data: {
        ownerid: ownerUser.userid,
        sitterid: sitterUser.userid,
        serviceid: service.serviceid,
        starttime: startTime1,
        endtime: endTime1,
        totalprice: 6000,
        paymentplan: 'deposit',
        bookingstatus: 'waiting_payment',
        note: 'ขอให้น้องนอนในห้องแอร์ช่วงบ่ายด้วยครับ',
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

    const slipUrl = await uploadSlipImage(createMockFile(), bookingWithSlip.bookingid)
    const payment = await prisma.payment.create({
      data: {
        bookingid: bookingWithSlip.bookingid,
        amount: 1800,
        paymenttype: 'bank_transfer',
        payment_stage: 'deposit',
        payment_status: 'pending_verifying',
        slip_image: slipUrl,
      },
    })

    console.log(`\n🎉 [ชุดทดสอบที่ 1] สร้างการจอง #${bookingWithSlip.bookingid} สำเร็จ!`)
    console.log(`   - สถานะ: waiting_payment (รอชำระมัดจำ)`)
    console.log(`   - ยอดรวม: ฿6,000 (มัดจำ 30%: ฿1,800)`)
    console.log(`   - แนบสลิปแล้ว: Payment #${payment.paymentid} (สถานะ: pending_verifying)`)
    console.log(`   👉 เหมาะสำหรับ: Sitter (${sitterUser.username}) เข้าหน้า /sitter/bookings แท็บ "ยืนยันแล้ว" แล้วกด "ตรวจสอบสลิปการโอน" เพื่อเลื่อนไปแท็บ "สำเร็จ"`)

    // 6. Scenario 2: Booking รอชำระเงินที่ยังไม่ได้แนบสลิป (สำหรับ Owner ทดสอบกด "ชำระเงิน" และแนบสลิปจริง)
    const startTime2 = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const endTime2 = new Date(startTime2.getTime() + 8 * 60 * 60 * 1000)

    const bookingWithoutSlip = await prisma.booking.create({
      data: {
        ownerid: ownerUser.userid,
        sitterid: sitterUser.userid,
        serviceid: service.serviceid,
        starttime: startTime2,
        endtime: endTime2,
        totalprice: 5000,
        paymentplan: 'deposit',
        bookingstatus: 'waiting_payment',
        note: 'น้องชอบวิ่งเล่นในสวนตอนเช้า',
        bookingdetail: {
          create: [
            {
              petid: pet.petid,
              pet_note: 'กินอาหารเปียกเช้า-เย็น',
            },
          ],
        },
      },
    })

    console.log(`\n🎉 [ชุดทดสอบที่ 2] สร้างการจอง #${bookingWithoutSlip.bookingid} สำเร็จ!`)
    console.log(`   - สถานะ: waiting_payment (ยังไม่แนบสลิป)`)
    console.log(`   - ยอดรวม: ฿5,000 (มัดจำ 30%: ฿1,500)`)
    console.log(`   👉 เหมาะสำหรับ: Owner (${ownerUser.username}) เข้าหน้า /bookings แล้วกด "ชำระเงิน" เพื่อแนบสลิปจริง`)

    // 7. Scenario 3: Booking สถานะ pending รอตอบรับ (สำหรับ Sitter ทดสอบกด Accept ในแท็บ "รอดำเนินการ")
    const startTime3 = new Date(now.getTime() + 72 * 60 * 60 * 1000)
    const endTime3 = new Date(startTime3.getTime() + 6 * 60 * 60 * 1000)

    const pendingBooking = await prisma.booking.create({
      data: {
        ownerid: ownerUser.userid,
        sitterid: sitterUser.userid,
        serviceid: service.serviceid,
        starttime: startTime3,
        endtime: endTime3,
        totalprice: 2000,
        paymentplan: 'full',
        bookingstatus: 'pending',
        note: 'ขอให้พี่เลี้ยงถ่ายรูปอัปเดตน้องวันละ 2 ครั้งครับ',
        bookingdetail: {
          create: [
            {
              petid: pet.petid,
              pet_note: 'ชอบนอนกลางวัน',
            },
          ],
        },
      },
    })

    console.log(`\n🎉 [ชุดทดสอบที่ 3] สร้างการจอง #${pendingBooking.bookingid} สำเร็จ!`)
    console.log(`   - สถานะ: pending (รอดำเนินการ)`)
    console.log(`   - ยอดรวม: ฿2,000 (ชำระเต็มจำนวน)`)
    console.log(`   👉 เหมาะสำหรับ: Sitter (${sitterUser.username}) เข้าหน้า /sitter/bookings แท็บ "รอดำเนินการ" แล้วกด "รับงาน (Accept)" เพื่อย้ายไปแท็บ "ยืนยันแล้ว"`)

    console.log('\n================================================================================')
    console.log('🔑 ข้อมูลบัญชีสำหรับใช้ทดสอบบนหน้าเว็บ (Browser Login):')
    console.log('================================================================================')
    console.log('🧑‍💼 บัญชีพี่เลี้ยง (Pet Sitter):')
    console.log(`   - Email:    ${sitterEmail}`)
    console.log(`   - Password: Password1234`)
    console.log(`   - หน้าหลัก:  http://localhost:5173/sitter/bookings`)
    console.log('')
    console.log('🐾 บัญชีเจ้าของสัตว์เลี้ยง (Pet Owner):')
    console.log(`   - Email:    ${ownerEmail}`)
    console.log(`   - Password: Password1234`)
    console.log(`   - หน้าหลัก:  http://localhost:5173/bookings`)
    console.log('================================================================================\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูลจำลอง:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedBrowserDemo()
