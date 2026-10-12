import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'

async function simulateOwnerBooking() {
  console.log('🐾 กำลังเริ่มระบบจำลองเจ้าของสัตว์เลี้ยงส่งคำขอจอง (Simulate Owner Booking Request)...')

  try {
    // 1. ดึง argument --sitter=<emailOrUsername> หากมีการระบุมา
    const sitterArg = process.argv
      .find((arg) => arg.startsWith('--sitter='))
      ?.split('=')[1]
      ?.trim()

    let targetSitters: { userid: number; username: string; email: string }[] = []

    if (sitterArg) {
      const found = await prisma.uSER.findFirst({
        where: {
          OR: [{ email: sitterArg }, { username: sitterArg }],
          petsitter: { isNot: null },
        },
        select: { userid: true, username: true, email: true },
      })
      if (!found) {
        console.error(`❌ ไม่พบบัญชี Pet Sitter ที่ตรงกับ: "${sitterArg}"`)
        return
      }
      targetSitters = [found]
      console.log(`📌 ระบุเจาะจง Sitter: ${found.username} (${found.email})`)
    } else {
      // ค้นหา Sitter ทั้งหมดในระบบ
      const allSitters = await prisma.petsitter.findMany({
        include: {
          USER: {
            select: { userid: true, username: true, email: true },
          },
        },
        orderBy: { userid: 'desc' },
      })

      if (allSitters.length === 0) {
        console.error('❌ ไม่พบบัญชี Pet Sitter ในระบบ กรุณาสมัครสมาชิกบัญชีพี่เลี้ยง (Sitter) ก่อน')
        return
      }

      targetSitters = allSitters.map((s) => s.USER)
      console.log(`📌 พบ Pet Sitter ในระบบทั้งหมด ${targetSitters.length} ท่าน: ${targetSitters.map((s) => s.username).join(', ')}`)
      console.log(`🚀 กำลังสร้างคำขอจองให้ Sitter ทุกคน เพื่อให้ล็อกอินบัญชีไหนก็ทดสอบได้ทันที!`)
    }

    // 2. ตรวจสอบหรือค้นหาบัญชีเจ้าของสัตว์เลี้ยง (Pet Owner) ที่ไม่ใช่ Sitter เหล่านี้
    const sitterUserIds = targetSitters.map((s) => s.userid)
    let ownerUser = await prisma.uSER.findFirst({
      where: {
        petowner: { isNot: null },
        userid: { notIn: sitterUserIds },
      },
      include: { petowner: true },
    })

    if (!ownerUser) {
      // หากยังไม่มี Pet Owner เลยในระบบ ให้สร้างใหม่ด้วยชื่อและอีเมลแบบ Unique
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const hashedPassword = await hashPassword('Password1234')
      ownerUser = await prisma.uSER.create({
        data: {
          username: `owner_somchai_${randomSuffix}`,
          email: `owner_somchai_${randomSuffix}@gmail.com`,
          password: hashedPassword,
          tel: '0891234567',
          province: 'กรุงเทพมหานคร',
          district: 'เขตปทุมวัน',
          subdistrict: 'แขวงปทุมวัน',
          postal_code: '10330',
          address: '999/1 ถนนพระราม 1',
          is_active: true,
          petowner: {
            create: {},
          },
        },
        include: { petowner: true },
      })
      console.log(`✅ สร้างบัญชี Pet Owner ตัวอย่างใหม่: ${ownerUser.username} (${ownerUser.email})`)
    } else {
      console.log(`✅ พบบัญชี Pet Owner ในระบบ: ${ownerUser.username} (${ownerUser.email})`)
    }

    // 3. ตรวจสอบหรือสร้างสัตว์เลี้ยง (Pets) ของ Owner
    let pets = await prisma.pet.findMany({
      where: { ownerid: ownerUser.userid },
    })

    if (pets.length === 0) {
      const petDog = await prisma.pet.create({
        data: {
          ownerid: ownerUser.userid,
          name: 'เจ้าตูบ',
          species: 'dog',
          breed: 'Golden Retriever',
          gender: 'male',
          weight: 26.0,
          allergy: 'ไม่มี',
        },
      })
      const petCat = await prisma.pet.create({
        data: {
          ownerid: ownerUser.userid,
          name: 'ส้มจี๊ด',
          species: 'cat',
          breed: 'Scottish Fold',
          gender: 'female',
          weight: 4.1,
          allergy: 'แพ้อาหารเม็ดบางยี่ห้อ',
        },
      })
      pets = [petDog, petCat]
      console.log(`✅ สร้างข้อมูลสัตว์เลี้ยงตัวอย่าง: ${petDog.name} และ ${petCat.name}`)
    } else {
      console.log(`✅ พบสัตว์เลี้ยงของ Owner จำนวน ${pets.length} ตัว (${pets.map((p) => p.name).join(', ')})`)
    }

    const targetPets = pets.slice(0, 2)
    const petNamesStr = targetPets.map((p) => p.name).join(' กับ ')

    // 4. วนลูปสร้าง Booking ให้ Sitter ทุกคน
    for (const targetSitter of targetSitters) {
      // ตรวจสอบ/สร้างบริการของ Sitter คนนี้
      let service = await prisma.services.findFirst({
        where: { userid: targetSitter.userid },
      })

      if (!service) {
        service = await prisma.services.create({
          data: {
            userid: targetSitter.userid,
            servicename: 'รับฝากดูแลสัตว์เลี้ยงช่วงกลางวัน',
            servicetype: 'sitting',
            price: 500,
            description: 'ดูแลน้องๆ อย่างอบอุ่น มีพื้นที่วิ่งเล่น มีห้องแอร์ ป้อนข้าวป้อนน้ำตรงเวลา',
            status: 'published',
            species: ['dog', 'cat'],
          },
        })
        console.log(`✅ สร้างบริการให้ Sitter: ${targetSitter.username} ("${service.servicename}")`)
      }

      // สร้างคำขอจองใหม่ (Booking Status: pending)
      const startTime = new Date(Date.now() + 86400000) // พรุ่งนี้
      const endTime = new Date(Date.now() + 86400000 + 14400000) // พรุ่งนี้ + 4 ชั่วโมง

      const newBooking = await prisma.booking.create({
        data: {
          ownerid: ownerUser.userid,
          sitterid: targetSitter.userid,
          serviceid: service.serviceid,
          bookingdate: new Date(),
          starttime: startTime,
          endtime: endTime,
          totalprice: 1000,
          paymentplan: 'full',
          bookingstatus: 'pending',
          note: `ขอฝากดูแล ${petNamesStr} ช่วงบ่ายด้วยนะครับ น้องๆ เข้ากับคนง่ายมาก ขอบคุณครับ`,
          bookingdetail: {
            create: targetPets.map((pet) => ({
              petid: pet.petid,
              pet_note: pet.species === 'dog' ? 'ชอบเล่นบอล ไม่ดุ เป็นมิตรมาก' : 'ชอบนอนในกล่อง ป้อนขนมแมวเลียได้',
            })),
          },
        },
      })

      console.log(`🎉 สร้างคำขอจองสำเร็จให้ Sitter: ${targetSitter.username} (Booking #${newBooking.bookingid}, สถานะ: pending)`)
    }

    console.log('\n============================================================')
    console.log('✨ สร้างข้อมูลคำขอจองเสร็จสมบูรณ์เรียบร้อยแล้ว!')
    console.log('------------------------------------------------------------')
    console.log('👉 ขั้นตอนต่อไป:')
    console.log('   1. เปิดเบราว์เซอร์ไปที่: http://localhost:5173/sitter/bookings')
    console.log('   2. กด Refresh (Command + R) หน้านั้นได้ทันที')
    console.log('   3. จะพบการ์ดคำขอจองใหม่ล่าสุด พร้อมปุ่ม "รับงาน (Accept)" และ "ปฏิเสธ (Reject)"')
    console.log('   4. ลองคลิกดู จะมี Confirmation Dialog เด้งขึ้นมาถามยืนยันก่อนทำงาน!')
    console.log('============================================================\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการจำลองการจอง:', error)
  } finally {
    await prisma.$disconnect()
  }
}

simulateOwnerBooking()
