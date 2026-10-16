import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'

async function seedMockBooking() {
  console.log('🚀 กำลังเริ่มสร้างข้อมูลจำลองการจอง (Mock Booking)...')

  try {
    // 1. ค้นหา Sitter ทุกคนในระบบ
    const sitters = await prisma.uSER.findMany({
      where: { petsitter: { isNot: null } },
      include: { petsitter: true },
    })

    if (sitters.length === 0) {
      console.error('❌ ไม่พบบัญชี Pet Sitter ในระบบ กรุณา Register บัญชี Sitter ก่อน')
      return
    }

    console.log(`✅ พบ Pet Sitter ในระบบทั้งหมด ${sitters.length} ท่าน:`)
    sitters.forEach((s) => console.log(`   - ${s.username} (User ID: ${s.userid}, Email: ${s.email})`))

    // 2. ตรวจสอบหรือสร้างเจ้าของสัตว์เลี้ยง (Pet Owner)
    const ownerEmail = 'owner_mock@example.com'
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

    // 3. ตรวจสอบหรือสร้างสัตว์เลี้ยง (Pets) ของ Owner
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

    // 4. วนลูปสร้าง Booking ให้ Sitter ทุกคน
    for (const sitterUser of sitters) {
      // ตรวจสอบ/สร้างบริการของ Sitter คนนี้
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
      }

      // สร้างคำขอจองใหม่สถานะ pending
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

      console.log(`🎉 สร้าง Mock Booking สำเร็จให้ Sitter: ${sitterUser.username} (Booking ID: ${newBooking.bookingid}, Status: ${newBooking.bookingstatus})`)
    }

    console.log('\n--------------------------------------------------')
    console.log('👉 สำเร็จทั้งหมดแล้ว! ตอนนี้สลับไปที่เบราว์เซอร์แล้วกด Refresh (Command + R) ได้ทันที!')
    console.log('--------------------------------------------------')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้าง Mock Booking:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedMockBooking()
