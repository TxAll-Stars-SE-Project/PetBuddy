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

    // 4. ตรวจสอบหรือสร้าง Pets (2 ตัวเพื่อความสมจริง)
    let pet1 = await prisma.pet.findFirst({
      where: { ownerid: ownerUser.userid, name: 'น้องโมจิ' },
    })
    if (!pet1) {
      pet1 = await prisma.pet.create({
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
      console.log(`✅ สร้างสัตว์เลี้ยง 1: ${pet1.name} (${pet1.breed})`)
    } else {
      console.log(`✅ พบสัตว์เลี้ยง 1: ${pet1.name} (${pet1.breed})`)
    }

    let pet2 = await prisma.pet.findFirst({
      where: { ownerid: ownerUser.userid, name: 'น้องเฉาก๊วย' },
    })
    if (!pet2) {
      pet2 = await prisma.pet.create({
        data: {
          ownerid: ownerUser.userid,
          name: 'น้องเฉาก๊วย',
          species: 'dog',
          breed: 'Golden Retriever',
          gender: 'male',
          weight: 28.0,
          allergy: 'ไม่มี',
        },
      })
      console.log(`✅ สร้างสัตว์เลี้ยง 2: ${pet2.name} (${pet2.breed})`)
    } else {
      console.log(`✅ พบสัตว์เลี้ยง 2: ${pet2.name} (${pet2.breed})`)
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

    // 6. สร้างการจองใหม่สถานะ pending จำนวน 4 รายการ สำหรับ Live Demo
    const now = new Date()

    const pendingConfigs = [
      {
        pet: pet1,
        totalprice: 5000,
        paymentplan: 'deposit' as const,
        depositAmount: 1500,
        note: 'ขอฝากดูแลน้องโมจิ 2 คืนครับ น้องนิสัยเรียบร้อย ขี้อ้อน ชอบนอนห้องแอร์',
        petNote: 'กินอาหารเปียกเช้า-เย็น ขอน้ำสะอาดเปลี่ยนทุกวันครับ',
        label: '🎯 [รายการที่ 1 - สำหรับ Demo หลัก] มัดจำ ฿1,500 (กดรับงาน -> แนบสลิปจริง -> Auto-Verify)',
        startOffsetHours: 24,
        durationHours: 48,
      },
      {
        pet: pet2,
        totalprice: 5000,
        paymentplan: 'deposit' as const,
        depositAmount: 1500,
        note: 'ฝากดูแลน้องเฉาก๊วยช่วงวันหยุดสุดสัปดาห์ครับ น้องร่าเริง เป็นมิตร',
        petNote: 'มีสายจูงและอาหารเม็ดเตรียมไว้ให้พร้อมครับ พาเดินเล่นวันละ 2 รอบ',
        label: '✨ [รายการที่ 2 - มัดจำ ฿1,500 สำรอง] สำหรับทดสอบรอบสองหรือสำรอง',
        startOffsetHours: 72,
        durationHours: 36,
      },
      {
        pet: pet1,
        totalprice: 2000,
        paymentplan: 'full' as const,
        depositAmount: 2000,
        note: 'ขอฝากดูแลช่วงบ่ายวันนี้ด่วนครับ พอดีติดธุระกะทันหันที่ต่างจังหวัด',
        petNote: 'น้องชอบนอนกลางวัน กินอาหารเม็ดสูตรควบคุมก้อนขน',
        label: '🚫 [รายการที่ 3 - สำหรับ Demo ปฏิเสธ (Reject)] ให้เห็น Dialog ยืนยันสีแดง',
        startOffsetHours: 12,
        durationHours: 24,
      },
      {
        pet: pet2,
        totalprice: 5000,
        paymentplan: 'deposit' as const,
        depositAmount: 1500,
        note: 'ขอจองล่วงหน้าสำหรับช่วงวันหยุดยาวสิ้นเดือนครับ',
        petNote: 'ชอบให้แปรงขนตอนเช้า และชอบเล่นลูกบอลยาง',
        label: '📋 [รายการที่ 4 - มัดจำ ฿1,500] แสดงในแท็บรอดำเนินการให้เห็นว่ามีคิวรอ',
        startOffsetHours: 120,
        durationHours: 48,
      },
    ]

    console.log('\n================================================================================')
    console.log('🎉 สร้างรายการคำขอจองสถานะ "รอดำเนินการ" (Pending) สำหรับ Live Demo:')
    console.log('================================================================================')

    const createdBookings = []
    for (const cfg of pendingConfigs) {
      const startTime = new Date(now.getTime() + cfg.startOffsetHours * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + cfg.durationHours * 60 * 60 * 1000)

      const b = await prisma.booking.create({
        data: {
          ownerid: ownerUser.userid,
          sitterid: sitterUser.userid,
          serviceid: service.serviceid,
          starttime: startTime,
          endtime: endTime,
          totalprice: cfg.totalprice,
          paymentplan: cfg.paymentplan,
          bookingstatus: 'pending',
          note: cfg.note,
          bookingdetail: {
            create: [
              {
                petid: cfg.pet.petid,
                pet_note: cfg.petNote,
              },
            ],
          },
        },
      })

      createdBookings.push({ ...b, cfg })
      console.log(`\n📌 ${cfg.label}`)
      console.log(`   - รหัสการจอง:      #${b.bookingid}`)
      console.log(`   - สถานะ:          pending (รอดำเนินการ)`)
      console.log(`   - แผนการชำระ:      ${cfg.paymentplan === 'deposit' ? 'มัดจำ 30%' : 'ชำระเต็มจำนวน'}`)
      console.log(`   - ยอดมัดจำ/ชำระ:   ฿${cfg.depositAmount.toLocaleString('th-TH')}`)
      console.log(`   - สัตว์เลี้ยง:       ${cfg.pet.name} (${cfg.pet.breed})`)
    }

    console.log('\n================================================================================')
    console.log(`✨ สร้างการจองสถานะ "รอดำเนินการ" ทั้งหมด ${createdBookings.length} รายการ สำเร็จเรียบร้อย!`)
    console.log('================================================================================')

    console.log('\n📋 ลำดับการ Demo ให้อาจารย์ดู (Step-by-Step Flow):')
    console.log('--------------------------------------------------------------------------------')
    console.log('1️⃣ [ฝั่ง Sitter]: เข้าสู่ระบบด้วย demo_sitter_tanin@petbuddy.com (Password1234)')
    console.log('   - ไปที่ http://localhost:5173/sitter/bookings')
    console.log(`   - ในแท็บ "รอดำเนินการ" จะเห็นตัวเลข (4) มีคำขอ 4 รายการ`)
    console.log(`   - เลือกการจอง #${createdBookings[0].bookingid} -> กดปุ่ม "รับงาน (Accept)" -> รายการจะย้ายไปแท็บ "ยืนยันแล้ว"`)
    console.log(`   - (ถ้าต้องการโชว์ Reject): เลือกการจอง #${createdBookings[2].bookingid} -> กด "ปฏิเสธ (Reject)" -> ย้ายไปแท็บ "ยกเลิก/ปฏิเสธ"`)
    console.log('')
    console.log('2️⃣ [ฝั่ง Owner]: สลับไปที่บัญชี demo_owner_somchai@petbuddy.com (Password1234)')
    console.log('   - ไปที่ http://localhost:5173/bookings')
    console.log(`   - การจอง #${createdBookings[0].bookingid} จะมีปุ่ม "ชำระเงิน" พร้อมยอดมัดจำ ฿1,500`)
    console.log('   - กดปุ่ม "ชำระเงิน" และแนบสลิปจริงยอด 1,500 บาท')
    console.log('   - Thunder Solution จะ Auto-Verify สลิปในเสี้ยววินาที -> สถานะเปลี่ยนเป็น "ชำระมัดจำแล้ว"')
    console.log('')
    console.log('3️⃣ [ฝั่ง Sitter]: กลับมาดูที่หน้า /sitter/bookings')
    console.log(`   - การจอง #${createdBookings[0].bookingid} จะย้ายมาที่แท็บ "สำเร็จ" อัตโนมัติ`)
    console.log('   - มีปุ่ม "ส่งงานเสร็จสิ้น (Complete Job)" พร้อมให้กดเมื่อบริการเสร็จ!')
    console.log('================================================================================\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProfessorDemo()
