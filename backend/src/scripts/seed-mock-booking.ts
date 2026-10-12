import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'

async function seedMockBooking() {
  console.log('🚀 กำลังเริ่มสร้างข้อมูลจำลองการจอง (Mock Booking)...')

  try {
    // 1. ค้นหา Sitter ล่าสุด (หรือ sitter_test@gmail.com)
    let sitterUser = await prisma.uSER.findUnique({
      where: { email: 'sitter_test@gmail.com' },
      include: { petsitter: true },
    })

    if (!sitterUser || !sitterUser.petsitter) {
      // ค้นหา sitter คนแรกที่เจอในระบบ
      sitterUser = await prisma.uSER.findFirst({
        where: { petsitter: { isNot: null } },
        include: { petsitter: true },
      })
    }

    if (!sitterUser || !sitterUser.petsitter) {
      console.error('❌ ไม่พบบัญชี Pet Sitter ในระบบ กรุณา Register บัญชี Sitter ก่อน')
      return
    }

    console.log(`✅ พบ Pet Sitter: ${sitterUser.username} (User ID: ${sitterUser.userid})`)

    // 2. ตรวจสอบหรือสร้างบริการ (Service) ของ Sitter คนนี้
    let service = await prisma.services.findFirst({
      where: { userid: sitterUser.userid },
    })

    if (!service) {
      service = await prisma.services.create({
        data: {
          userid: sitterUser.userid,
          servicename: 'รับฝากดูแลสัตว์เลี้ยงช่วงกลางวัน',
          servicetype: 'sitting',
          price: 500,
          description: 'ดูแลน้องๆ อย่างใกล้ชิด มีพื้นที่วิ่งเล่น มีห้องแอร์ ป้อนข้าวป้อนน้ำตรงเวลา',
          status: 'published',
          species: ['dog', 'cat'],
        },
      })
      console.log(`✅ สร้างบริการตัวอย่าง: "${service.servicename}" (Service ID: ${service.serviceid})`)
    } else {
      console.log(`✅ พบบริการของ Sitter: "${service.servicename}" (Service ID: ${service.serviceid})`)
    }

    // 3. ตรวจสอบหรือสร้างเจ้าของสัตว์เลี้ยง (Pet Owner)
    const ownerEmail = 'owner_mock@gmail.com'
    let ownerUser = await prisma.uSER.findUnique({
      where: { email: ownerEmail },
      include: { petowner: true },
    })

    if (!ownerUser) {
      const hashedPassword = await hashPassword('Password1234')
      ownerUser = await prisma.uSER.create({
        data: {
          username: 'somchai_owner',
          email: ownerEmail,
          password: hashedPassword,
          tel: '0891234567',
          province: 'กรุงเทพมหานคร',
          district: 'เขตปทุมวัน',
          subdistrict: 'แขวงปทุมวัน',
          postal_code: '10330',
          address: '456 สยามพารากอน',
          is_active: true,
          petowner: {
            create: {},
          },
        },
        include: { petowner: true },
      })
      console.log(`✅ สร้าง Pet Owner ตัวอย่าง: ${ownerUser.username} (User ID: ${ownerUser.userid})`)
    } else {
      console.log(`✅ พบ Pet Owner ตัวอย่าง: ${ownerUser.username} (User ID: ${ownerUser.userid})`)
    }

    // 4. ตรวจสอบหรือสร้างสัตว์เลี้ยง (Pets) ของ Owner
    let petDog = await prisma.pet.findFirst({
      where: { ownerid: ownerUser.userid, name: 'เจ้าตูบ' },
    })
    if (!petDog) {
      petDog = await prisma.pet.create({
        data: {
          ownerid: ownerUser.userid,
          name: 'เจ้าตูบ',
          species: 'dog',
          breed: 'Golden Retriever',
          gender: 'male',
          weight: 25.5,
          allergy: 'ไม่มี',
        },
      })
    }

    let petCat = await prisma.pet.findFirst({
      where: { ownerid: ownerUser.userid, name: 'ส้มจี๊ด' },
    })
    if (!petCat) {
      petCat = await prisma.pet.create({
        data: {
          ownerid: ownerUser.userid,
          name: 'ส้มจี๊ด',
          species: 'cat',
          breed: 'Scottish Fold',
          gender: 'female',
          weight: 4.2,
          allergy: 'แพ้อาหารเม็ดบางยี่ห้อ',
        },
      })
    }
    console.log(`✅ สัตว์เลี้ยงพร้อม: ${petDog.name} (${petDog.breed}) และ ${petCat.name} (${petCat.breed})`)

    // 5. สร้างการจองจำลอง (Mock Booking) สถานะ pending
    const startTime = new Date(Date.now() + 86400000) // พรุ่งนี้
    const endTime = new Date(Date.now() + 86400000 + 14400000) // พรุ่งนี้ + 4 ชั่วโมง

    const newBooking = await prisma.booking.create({
      data: {
        ownerid: ownerUser.userid,
        sitterid: sitterUser.userid,
        serviceid: service.serviceid,
        bookingdate: new Date(),
        starttime: startTime,
        endtime: endTime,
        totalprice: 1000,
        paymentplan: 'full',
        bookingstatus: 'pending',
        note: 'ขอให้พาเจ้าตูบเดินเล่นรอบเย็นด้วยนะครับ ส่วนส้มจี๊ดค่อนข้างขี้อาย ขอบคุณครับ',
        bookingdetail: {
          create: [
            {
              petid: petDog.petid,
              pet_note: 'ชอบเล่นบอล ไม่ดุ เป็นมิตรมาก',
            },
            {
              petid: petCat.petid,
              pet_note: 'ชอบนอนในกล่อง อย่าเปิดประตูทิ้งไว้น้องชอบแอบ',
            },
          ],
        },
      },
    })

    console.log('\n🎉 สร้างข้อมูลจำลองการจอง (Mock Booking) สำเร็จแล้ว!')
    console.log('--------------------------------------------------')
    console.log(`📌 Booking ID: ${newBooking.bookingid}`)
    console.log(`📌 สถานะ: ${newBooking.bookingstatus}`)
    console.log(`📌 พี่เลี้ยง: ${sitterUser.username}`)
    console.log(`📌 เจ้าของ: ${ownerUser.username}`)
    console.log(`📌 บริการ: ${service.servicename}`)
    console.log(`📌 สัตว์เลี้ยง: ${petDog.name}, ${petCat.name}`)
    console.log(`📌 ยอดเงินรวม: ${newBooking.totalprice} บาท`)
    console.log('--------------------------------------------------')
    console.log(`👉 ตอนนี้กลับไปที่ Postman แล้วกด Send ที่ 'GET /api/sitter/bookings' ได้เลย!`)
    console.log(`👉 และสามารถทดสอบ 'PATCH /api/sitter/bookings/${newBooking.bookingid}' ด้วย action: "accept" ได้เลย!`)
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้าง Mock Booking:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedMockBooking()
