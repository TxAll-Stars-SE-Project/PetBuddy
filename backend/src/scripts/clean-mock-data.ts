import 'dotenv/config'
import prisma from '../utils/prisma.js'

async function cleanMockData() {
  console.log('================================================================================')
  console.log('🧹 PetBuddy - Clean Mock & Demo Data Script')
  console.log('================================================================================\n')

  try {
    // ค้นหาบัญชีทดสอบทั้งหมด (demo_*, demo2_*, sim_*, test_*)
    const demoUsers = await prisma.uSER.findMany({
      where: {
        OR: [
          { email: { startsWith: 'demo_' } },
          { email: { startsWith: 'demo2_' } },
          { email: { startsWith: 'sim_' } },
          { email: { startsWith: 'test_' } },
          { email: { endsWith: '@example.com' } },
        ],
      },
      select: { userid: true, username: true, email: true },
    })

    const demoUserIds = demoUsers.map((u) => u.userid)

    console.log(`🔍 พบบัญชีทดสอบทั้งหมด ${demoUsers.length} บัญชี`)
    if (demoUsers.length > 0) {
      demoUsers.forEach((u) => console.log(`   - [ID: ${u.userid}] ${u.username} (${u.email})`))
    }

    // 1. ลบ payments ที่เกี่ยวข้อง
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        booking: {
          OR: [
            { ownerid: { in: demoUserIds } },
            { sitterid: { in: demoUserIds } },
          ],
        },
      },
    })
    console.log(`\n✅ ลบประวัติการชำระเงิน (Payments): ${deletedPayments.count} รายการ`)

    // 2. ลบ reviews ที่เกี่ยวข้อง
    const deletedReviews = await prisma.review.deleteMany({
      where: {
        booking: {
          OR: [
            { ownerid: { in: demoUserIds } },
            { sitterid: { in: demoUserIds } },
          ],
        },
      },
    })
    console.log(`✅ ลบรีวิว (Reviews): ${deletedReviews.count} รายการ`)

    // 3. ลบ bookingdetail
    const deletedDetails = await prisma.bookingdetail.deleteMany({
      where: {
        booking: {
          OR: [
            { ownerid: { in: demoUserIds } },
            { sitterid: { in: demoUserIds } },
          ],
        },
      },
    })
    console.log(`✅ ลบรายละเอียดการจอง (Booking Details): ${deletedDetails.count} รายการ`)

    // 4. ลบ bookings ทั้งหมดของ demo users
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        OR: [
          { ownerid: { in: demoUserIds } },
          { sitterid: { in: demoUserIds } },
        ],
      },
    })
    console.log(`✅ ลบการจอง (Bookings): ${deletedBookings.count} รายการ`)

    // ตรวจสอบอาร์กิวเมนต์ --delete-users
    const deleteUsersArg = process.argv.includes('--delete-users')
    if (deleteUsersArg && demoUserIds.length > 0) {
      // ลบ services ของ sitter
      await prisma.services.deleteMany({
        where: { userid: { in: demoUserIds } },
      })
      // ลบ pets ของ owner
      await prisma.pet.deleteMany({
        where: { ownerid: { in: demoUserIds } },
      })
      // ลบ petsitter
      await prisma.petsitter.deleteMany({
        where: { userid: { in: demoUserIds } },
      })
      // ลบ petowner
      await prisma.petowner.deleteMany({
        where: { userid: { in: demoUserIds } },
      })
      // ลบ USER
      const deletedUsers = await prisma.uSER.deleteMany({
        where: { userid: { in: demoUserIds } },
      })
      console.log(`\n🗑️  ลบบัญชีผู้ใช้ทดสอบทั้งหมด: ${deletedUsers.count} บัญชี`)
    }

    console.log('\n================================================================================')
    console.log('✨ ทำความสะอาดข้อมูลจำลองสำเร็จเรียบร้อย! ฐานข้อมูลสะอาด 100% พร้อมใช้งานใหม่')
    console.log('================================================================================\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการล้างข้อมูล:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanMockData()
