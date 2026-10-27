export interface BookingStatusEmailTemplateProps {
  ownerUsername: string
  sitterUsername: string
  serviceName: string
  action: 'accept' | 'reject' | 'complete'
  bookingId: number
  startTime: string
  endTime: string
  petNames: string[]
  totalPrice: number | string
}

export const getBookingStatusEmailHtml = ({
  ownerUsername,
  sitterUsername,
  serviceName,
  action,
  bookingId,
  startTime,
  endTime,
  petNames,
  totalPrice,
}: BookingStatusEmailTemplateProps): string => {
  let statusTitle = ''
  let statusMessage = ''
  let statusBadgeBg = ''
  let statusBadgeText = ''
  let actionAdvice = ''

  if (action === 'accept') {
    statusTitle = 'คำขอจองได้รับการตอบรับแล้ว'
    statusMessage = `พี่เลี้ยง <strong>คุณ ${sitterUsername}</strong> ได้ตอบรับคำขอจองบริการของคุณเรียบร้อยแล้ว`
    statusBadgeBg = '#dcfce7'
    statusBadgeText = '#15803d'
    actionAdvice = 'กรุณาดำเนินการชำระเงิน/มัดจำในระบบเพื่อยืนยันการจองให้เสร็จสมบูรณ์'
  } else if (action === 'reject') {
    statusTitle = 'คำขอจองถูกปฏิเสธ'
    statusMessage = `ขออภัย พี่เลี้ยง <strong>คุณ ${sitterUsername}</strong> ไม่สะดวกรับคำขอจองนี้ในวันและเวลาดังกล่าว`
    statusBadgeBg = '#fee2e2'
    statusBadgeText = '#b91c1c'
    actionAdvice = 'คุณสามารถเลือกค้นหาพี่เลี้ยงท่านอื่นหรือเปลี่ยนช่วงเวลาการจองได้ที่ PetBuddy'
  } else {
    statusTitle = 'บริการเสร็จสิ้นเรียบร้อยแล้ว'
    statusMessage = `พี่เลี้ยง <strong>คุณ ${sitterUsername}</strong> ได้ดำเนินการส่งมอบงานบริการเสร็จสิ้นเรียบร้อยแล้ว`
    statusBadgeBg = '#e0f2fe'
    statusBadgeText = '#0369a1'
    actionAdvice = 'กรุณาตรวจสอบรายละเอียดและดำเนินการชำระเงินส่วนที่เหลือ (หากมี) พร้อมให้รีวิวความประทับใจ'
  }

  const petsDisplay = petNames.length > 0 ? petNames.join(', ') : 'สัตว์เลี้ยงของคุณ'

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle} - PetBuddy</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fff7ef; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff7ef; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 12px 32px rgba(31, 41, 55, 0.08); overflow: hidden; border: 1px solid #e5e7eb;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                PetBuddy
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 15px; color: #fed7aa;">
                แจ้งเตือนสถานะการจองบริการ
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeText}; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 999px; margin-bottom: 16px;">
                ${statusTitle}
              </div>

              <h2 style="margin: 0 0 14px 0; font-size: 20px; color: #1f2937; font-weight: 700;">
                สวัสดีคุณ ${ownerUsername}
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                ${statusMessage}
              </p>
              
              <!-- Booking Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff3e8; border-radius: 12px; border-left: 6px solid #f97316; margin: 20px 0; padding: 16px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">หมายเลขการจอง:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">#${bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">บริการ:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">พี่เลี้ยง:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">คุณ ${sitterUsername}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">สัตว์เลี้ยง:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">${petsDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">เริ่มบริการ:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">${startTime}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">สิ้นสุดบริการ:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 0 0; font-size: 15px; font-weight: 700; color: #1f2937; border-top: 1px dashed #fdba74;">ยอดรวม:</td>
                  <td style="padding: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #ea580c; text-align: right; border-top: 1px dashed #fdba74;">${Number(totalPrice).toLocaleString('th-TH')} บาท</td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">
                  📌 <strong>ขั้นตอนถัดไป:</strong> ${actionAdvice}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #f97316;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 12px;">
                      ดูรายละเอียดการจองของคุณ
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fff7ef; padding: 20px 28px; text-align: center; border-top: 1px solid #fed7aa;">
              <p style="margin: 0; font-size: 13px; color: #9a3412;">
                หากมีข้อสงสัยเพิ่มเติม สามารถติดต่อทีมงาน PetBuddy ได้ตลอด 24 ชั่วโมง
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #c2410c;">
                © PetBuddy - เพื่อนคู่ใจ สัตว์เลี้ยงคู่กาย
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
