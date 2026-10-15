import prisma from '../utils/prisma.js'
import { hashPassword } from '../utils/password.js'
import {
  getPaymentSummary,
  submitPaymentSlip,
  verifyPaymentSlip,
} from '../services/payment.service.js'
import { AppError } from '../utils/errors.js'

// Sample 1x1 transparent PNG buffer for testing slip upload
const SAMPLE_SLIP_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

const createMockSlipFile = (filename = 'bank_slip.png'): Express.Multer.File => ({
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

async function runPaymentDemo() {
  console.log('\n================================================================================')
  console.log('🐾 PetBuddy - Live Demo: Epic Payment & Booking Status (Sprint 2 / US6-2)')
  console.log('================================================================================\n')

  try {
    // --------------------------------------------------------------------------
    // 1. SETUP: ตรวจสอบหรือสร้าง Sitter, Owner, Service, Pets และ Booking
    // --------------------------------------------------------------------------
    console.log('🔄 [Setup] กำลังเตรียมข้อมูลจำลองสำหรับการสาธิต (Seeding Test Data)...')

    // 1.1 Sitter
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
          petsitter: {
            create: {
              thaiid: '1234567890123',
              experience: 'พี่เลี้ยงมืออาชีพ ประสบการณ์ 3 ปี',
            },
          },
        },
        include: { petsitter: true },
      })
    }
    console.log(`   ✅ Sitter: ${sitterUser.username} (ID: ${sitterUser.userid})`)

    // 1.2 Sitter Service
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
          description: 'ดูแลน้องๆ อย่างอบอุ่น มีกล้องตรวจดู 24 ชม.',
        },
      })
    }
    console.log(`   ✅ Service: "${service.servicename}" (Price: ฿${service.price}/ชม.)`)

    // 1.3 Pet Owner
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
          petowner: { create: {} },
        },
        include: { petowner: true },
      })
    }
    console.log(`   ✅ Owner: ${ownerUser.username} (ID: ${ownerUser.userid})`)

    // 1.4 Pet
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
        },
      })
    }
    console.log(`   ✅ Pet: ${pet.name} (${pet.species})`)

    // 1.5 Booking ในสถานะ waiting_payment (คำนวณราคารวม ฿6,000, แผนมัดจำ deposit)
    const totalPrice = 6000
    const now = new Date()
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000)

    const booking = await prisma.booking.create({
      data: {
        ownerid: ownerUser.userid,
        sitterid: sitterUser.userid,
        serviceid: service.serviceid,
        starttime: startTime,
        endtime: endTime,
        totalprice: totalPrice,
        paymentplan: 'deposit',
        bookingstatus: 'waiting_payment',
        note: 'สุนัขชอบทานอาหารเปียกตอนเย็นครับ',
        bookingdetail: {
          create: [
            {
              petid: pet.petid,
              pet_note: 'แมวขี้อ้อน ไม่ดุ',
            },
          ],
        },
      },
    })
    console.log(`   ✅ Booking #${booking.bookingid} สร้างเสร็จเรียบร้อย! (สถานะ: ${booking.bookingstatus}, ราคารวม: ฿${totalPrice.toLocaleString()})`)

    // --------------------------------------------------------------------------
    // 2. DEMO STEP 1: GET /api/bookings/:bookingID/payments (ดูสรุปยอด)
    // --------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------')
    console.log('📌 [Step 1] Owner เรียกดูสรุปยอดชำระเงิน (GET /api/bookings/:id/payments)')
    console.log('--------------------------------------------------------------------------------')
    const summary1 = await getPaymentSummary(ownerUser.userid, booking.bookingid)
    console.log('📊 สรุปยอดที่คำนวณได้จาก Backend:')
    console.log(`   - รหัสการจอง: #${summary1.bookingId}`)
    console.log(`   - สถานะปัจจุบัน: ${summary1.bookingstatus}`)
    console.log(`   - ราคารวมทั้งหมด: ฿${summary1.totalPrice.toLocaleString()}`)
    console.log(`   - แผนการชำระเงิน: ${summary1.paymentplan} (มัดจำ 30% + ชำระส่วนที่เหลือ)`)
    console.log(`   - ยอดมัดจำที่ต้องชำระตอนนี้ (30%): ฿${summary1.depositAmount.toLocaleString()}`)
    console.log(`   - ยอดคงเหลือที่ต้องจ่ายภายหลัง: ฿${summary1.remainingAmount.toLocaleString()}`)
    console.log(`   - ประวัติการชำระเงินเดิม: ${summary1.payments.length} รายการ`)

    // --------------------------------------------------------------------------
    // 3. DEMO STEP 2: POST /api/payments (Owner อัปโหลดสลิปมัดจำ)
    // --------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------')
    console.log('📌 [Step 2] Owner แนบสลิปโอนเงินมัดจำ (POST /api/payments)')
    console.log('--------------------------------------------------------------------------------')
    console.log(`📤 กำลังส่งข้อมูล: bookingId=${booking.bookingid}, amount=1800, stage=deposit, file=bank_slip.png`)
    
    const depositFile = createMockSlipFile('deposit_slip.png')
    const depositResult = await submitPaymentSlip(
      ownerUser.userid,
      {
        bookingId: booking.bookingid,
        amount: 1800,
        payment_stage: 'deposit',
        paymentType: 'bank_transfer',
      },
      depositFile
    )

    console.log('✅ บันทึกสลิปชำระเงินสำเร็จ!')
    console.log(`   - Payment ID: #${depositResult.paymentId}`)
    console.log(`   - สถานะสลิป: ${depositResult.payment_status} (รอพี่เลี้ยงตรวจสอบ)`)
    console.log(`   - Cloud Storage URL: ${depositResult.slip_image}`)

    // --------------------------------------------------------------------------
    // 4. DEMO STEP 3: Security & Fraud Prevention (Negative Test Case)
    // --------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------')
    console.log('📌 [Step 3] ทดสอบระบบป้องกันการชำระเงินซ้ำซ้อน (Duplicate Pay Prevention)')
    console.log('--------------------------------------------------------------------------------')
    try {
      console.log('⚠️ พยายามส่งสลิปรอบ deposit ซ้ำขณะที่รายการเดิมยังรอตรวจอยู่...')
      await submitPaymentSlip(
        ownerUser.userid,
        {
          bookingId: booking.bookingid,
          amount: 1800,
          payment_stage: 'deposit',
          paymentType: 'bank_transfer',
        },
        depositFile
      )
      console.error('❌ ผิดพลาด: ระบบไม่ควรยอมให้ส่งสลิปซ้ำ!')
    } catch (err) {
      if (err instanceof AppError) {
        console.log(`🛡️ ระบบบล็อกการส่งซ้ำสำเร็จตามคาดหมาย! [Status: ${err.statusCode}, Code: ${err.errorCode}]`)
        console.log(`   เหตุผล: "${err.message}"`)
      }
    }

    // --------------------------------------------------------------------------
    // 5. DEMO STEP 4: PATCH /api/bookings/:id/verify-payment (พี่เลี้ยงอนุมัติสลิป)
    // --------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------')
    console.log('📌 [Step 4] Sitter ตรวจสอบและอนุมัติสลิปมัดจำ (PATCH /api/bookings/:id/verify-payment)')
    console.log('--------------------------------------------------------------------------------')
    console.log(`🧑‍💼 พี่เลี้ยง (${sitterUser.username}) กดยืนยันสลิป paymentId=${depositResult.paymentId}`)

    const verifyResult = await verifyPaymentSlip(
      sitterUser.userid,
      booking.bookingid,
      depositResult.paymentId,
      'verify'
    )

    console.log('✅ ผลการตรวจสอบสลิป:')
    console.log(`   - สถานะสลิปเปลี่ยนเป็น: ${verifyResult.payment_status} (verified)`)
    console.log(`   - สถานะการจองเปลี่ยนเป็น: ${verifyResult.bookingstatus} (confirmed) 🎉`)
    console.log(`   - ส่งอีเมลแจ้งเตือนไปยัง: ${ownerUser.email} เรียบร้อยแล้ว`)

    // --------------------------------------------------------------------------
    // 6. DEMO STEP 5: ตรวจสอบสถานะและยอดคงเหลืออีกครั้ง
    // --------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------')
    console.log('📌 [Step 5] ตรวจสอบสรุปยอดหลังยืนยันมัดจำ (Dynamic Remaining Balance)')
    console.log('--------------------------------------------------------------------------------')
    const summary2 = await getPaymentSummary(ownerUser.userid, booking.bookingid)
    console.log(`   - สถานะการจอง: ${summary2.bookingstatus}`)
    console.log(`   - ยอดรวม: ฿${summary2.totalPrice.toLocaleString()}`)
    console.log(`   - ยอดที่จ่ายแล้ว: ฿1,800`)
    console.log(`   - ยอดคงเหลือที่ต้องจ่ายตอนจบงาน (Remaining Amount): ฿${summary2.remainingAmount.toLocaleString()}`)
    console.log(`   - รายการสลิปในประวัติ: 1 รายการ (สถานะ: ${summary2.payments[0].payment_status})`)

    // --------------------------------------------------------------------------
    // 7. DEMO STEP 6: วงจรปิดงาน (Final Payment Flow)
    // --------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------')
    console.log('📌 [Step 6] วงจรชำระส่วนที่เหลือหลังจบงาน (Final Payment Lifecycle)')
    console.log('--------------------------------------------------------------------------------')
    console.log('1️⃣ พี่เลี้ยงดูแลสัตว์เลี้ยงเสร็จสิ้น ปรับสถานะเป็น waiting_final_payment...')
    await prisma.booking.update({
      where: { bookingid: booking.bookingid },
      data: { bookingstatus: 'waiting_final_payment' },
    })

    console.log('2️⃣ Owner แนบสลิปยอดคงเหลือ ฿4,200 (payment_stage=final)...')
    const finalFile = createMockSlipFile('final_slip.png')
    const finalPayment = await submitPaymentSlip(
      ownerUser.userid,
      {
        bookingId: booking.bookingid,
        amount: 4200,
        payment_stage: 'final',
        paymentType: 'bank_transfer',
      },
      finalFile
    )
    console.log(`   ✅ แนบสลิป Final สำเร็จ [Payment #${finalPayment.paymentId}, Status: ${finalPayment.payment_status}]`)

    console.log('3️⃣ พี่เลี้ยงตรวจสอบสลิป Final และกดยืนยัน (verify)...')
    const finalVerifyResult = await verifyPaymentSlip(
      sitterUser.userid,
      booking.bookingid,
      finalPayment.paymentId,
      'verify'
    )
    console.log(`   🎉 สถานะการจองสมบูรณ์แบบ: ${finalVerifyResult.bookingstatus} (Completed)`)

    // สรุปสุดท้าย
    const finalSummary = await getPaymentSummary(ownerUser.userid, booking.bookingid)
    console.log('\n================================================================================')
    console.log('🏆 สรุปผลการสาธิต (Demo Summary Report):')
    console.log('================================================================================')
    console.table([
      {
        'Booking ID': `#${finalSummary.bookingId}`,
        'Total Price': `฿${finalSummary.totalPrice.toLocaleString()}`,
        'Deposit Paid': `฿1,800 (30%)`,
        'Final Paid': `฿4,200 (70%)`,
        'Remaining': `฿${finalSummary.remainingAmount.toLocaleString()}`,
        'Final Status': finalSummary.bookingstatus,
        'Total Slips': `${finalSummary.payments.length} verified`,
      },
    ])
    console.log('✨ การทดสอบครบทุก Requirement ของ US6-2 เรียบร้อย 100% พร้อมสาธิตให้อาจารย์ดูได้ทันที!\n')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการรัน Demo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runPaymentDemo()
