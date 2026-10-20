import 'dotenv/config'
import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'

async function seedProfessorDemo() {
  console.log('================================================================================')
  console.log('🎓 PetBuddy - Clean & Seed Professor Live Demo (From Sitter Accept to Auto-Verify)')
  console.log('================================================================================\n')

  try {
    // 1. ตรวจสอบหรือสร้าง Sitter User
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

    // 2. ตรวจสอบหรือสร้าง Service
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

    // 3. ตรวจสอบหรือสร้าง Owner User
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

    // 4. ตรวจสอบหรือสร้าง Pet
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

    // 5. ล้างประวัติการจองและชำระเงินเดิมทั้งหมดของคู่ Demo (Clean Slate 100%)
    console.log('\n🧹 ทำความสะอาดข้อมูล: กำลังล้างรายการจองและประวัติการชำระเงินเดิมทั้งหมดของบัญชี Demo...')
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        booking: {
          OR: [
            { ownerid: ownerUser.userid },
            { sitterid: sitterUser.userid },
          ],
        },
      },
    })
    const deletedReviews = await prisma.review.deleteMany({
      where: {
        booking: {
          OR: [
            { ownerid: ownerUser.userid },
            { sitterid: sitterUser.userid },
          ],
        },
      },
    })
    const deletedDetails = await prisma.bookingdetail.deleteMany({
      where: {
        booking: {
          OR: [
            { ownerid: ownerUser.userid },
            { sitterid: sitterUser.userid },
          ],
        },
      },
    })
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        OR: [
          { ownerid: ownerUser.userid },
          { sitterid: sitterUser.userid },
        ],
      },
    })
    console.log(`   ✅ ลบประวัติการชำระเงินเก่า: ${deletedPayments.count} รายการ`)
    console.log(`   ✅ ลบรีวิวเก่า: ${deletedReviews.count} รายการ`)
    console.log(`   ✅ ลบรายละเอียดการจองเก่า: ${deletedDetails.count} รายการ`)
    console.log(`   ✅ ลบรายการจองเก่าทั้งหมด: ${deletedBookings.count} รายการ (ตารางสะอาด 100%!)`)

    // 6. สร้างการจองใหม่สถานะ pending สำหรับ Live Demo ต่อหน้าอาจารย์
    const now = new Date()
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000)

    const pendingBooking = await prisma.booking.create({
      data: {
        ownerid: ownerUser.userid,
        sitterid: sitterUser.userid,
        serviceid: service.serviceid,
        starttime: startTime,
        endtime: endTime,
        totalprice: 5000,
        paymentplan: 'deposit',
        bookingstatus: 'pending',
        note: 'ขอฝากดูแลน้องโมจิ 2 คืนครับ น้องนิสัยเรียบร้อย ขี้อ้อน ชอบนอนห้องแอร์',
        bookingdetail: {
          create: [
            {
              petid: pet.petid,
              pet_note: 'กินอาหารเปียกเช้า-เย็น ขอน้ำสะอาดเปลี่ยนทุกวันครับ',
            },
          ],
        },
      },
    })

    console.log('\n================================================================================')
    console.log(`🎉 [Live Demo Booking] สร้างการจอง #${pendingBooking.bookingid} สำเร็จเรียบร้อย!`)
    console.log('================================================================================')
    console.log(`📌 สถานะ:              pending (รอดำเนินการ - รอ Sitter กดยืนยันรับงาน)`)
    console.log(`💰 แผนการชำระเงิน:       มัดจำ 30% (Deposit)`)
    console.log(`💵 ยอดรวมทั้งหมด:        ฿5,000.00`)
    console.log(`🎯 ยอดมัดจำที่ต้องชำระ:    ฿1,500.00 (ยอดที่จะใช้สแกนสลิปจริง)`)
    console.log(`🐾 สัตว์เลี้ยง:           ${pet.name} (${pet.breed})`)
    console.log(`📅 ช่วงเวลา:            ${startTime.toLocaleDateString('th-TH')} - ${endTime.toLocaleDateString('th-TH')}`)
    console.log('================================================================================')

    console.log('\n📋 ขั้นตอน Demo ให้อาจารย์ดู (Step-by-Step Flow):')
    console.log('--------------------------------------------------------------------------------')
    console.log('1️⃣ [ฝั่ง Sitter]: เข้าสู่ระบบด้วย demo_sitter_tanin@petbuddy.com (Password1234)')
    console.log('   - ไปที่ http://localhost:5173/sitter/bookings')
    console.log(`   - ในแท็บ "รอดำเนินการ" จะเห็นการจอง #${pendingBooking.bookingid} รอการตอบรับ`)
    console.log('   - กดปุ่ม "รับงาน (Accept)" -> รายการจะย้ายไปแท็บ "ยืนยันแล้ว" (สถานะ: รอชำระมัดจำ)')
    console.log('')
    console.log('2️⃣ [ฝั่ง Owner]: สลับไปที่บัญชี demo_owner_somchai@petbuddy.com (Password1234)')
    console.log('   - ไปที่ http://localhost:5173/bookings')
    console.log(`   - จะเห็นการจอง #${pendingBooking.bookingid} สถานะเปลี่ยนเป็น "รอชำระมัดจำ" (ยอด ฿1,500)`)
    console.log('   - กดปุ่ม "ชำระเงิน" และแนบสลิปจริงยอด 1,500 บาท')
    console.log('   - ระบบ Thunder Solution จะ Auto-Verify สลิปในเสี้ยววินาที')
    console.log('   - สถานะจะเปลี่ยนเป็น "ชำระมัดจำแล้ว" ทันที!')
    console.log('')
    console.log('3️⃣ [ฝั่ง Sitter]: กลับมาดูที่หน้า /sitter/bookings')
    console.log('   - รายการจองจะย้ายไปแท็บ "สำเร็จ" อัตโนมัติ โดยพี่เลี้ยงไม่ต้องกดตรวจสลิปเอง')
    console.log('   - จะมีปุ่ม "ส่งงานเสร็จสิ้น (Complete Job)" พร้อมให้กดเมื่อให้บริการเสร็จ!')
    console.log('================================================================================\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProfessorDemo()
