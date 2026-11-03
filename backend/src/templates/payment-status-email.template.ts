export interface PaymentStatusEmailParams {
  ownerUsername: string
  sitterUsername: string
  serviceName: string
  action: 'verify' | 'reject'
  paymentStage: string
  amount: number
  bookingId: number
  bookingStatus: string
}

export const getPaymentStatusEmailHtml = ({
  ownerUsername,
  sitterUsername,
  serviceName,
  action,
  paymentStage,
  amount,
  bookingId,
  bookingStatus,
}: PaymentStatusEmailParams): string => {
  const isVerified = action === 'verify'

  const stageLabelMap: Record<string, string> = {
    deposit: 'เงินมัดจำ (Deposit 30%)',
    final: 'ยอดคงเหลือส่วนสุดท้าย (Final Payment)',
    full: 'ชำระเต็มจำนวน (Full Payment)',
  }
  const stageLabel = stageLabelMap[paymentStage] || paymentStage

  const formattedAmount = `฿${Number(amount).toLocaleString('th-TH')}`

  const statusTitle = isVerified
    ? 'สลิปการโอนเงินได้รับการยืนยันเรียบร้อยแล้ว'
    : 'สลิปการโอนเงินไม่ผ่านการตรวจสอบ'

  const statusColor = isVerified ? '#16A34A' : '#DC2626'
  const statusBg = isVerified ? '#F0FDF4' : '#FEF2F2'
  const statusBorder = isVerified ? '#BBF7D0' : '#FECACA'

  const bookingStatusText = isVerified
    ? bookingStatus === 'completed'
      ? 'เสร็จสิ้น (Completed)'
      : 'ยืนยันแล้ว (Confirmed)'
    : 'รอการชำระเงินใหม่ (Waiting Payment)'

  const actionMessage = isVerified
    ? bookingStatus === 'completed'
      ? 'การชำระเงินส่วนที่เหลือเสร็จสมบูรณ์ คำขอจองบริการของท่านเสร็จสิ้นแล้ว ขอบคุณที่ไว้วางใจใช้บริการ PetBuddy'
      : 'พี่เลี้ยงได้ตรวจสอบและยืนยันสลิปเงินมัดจำเรียบร้อยแล้ว การจองของท่านได้รับการยืนยันแล้ว และพี่เลี้ยงพร้อมเริ่มให้บริการตามเวลาที่นัดหมาย'
    : 'พี่เลี้ยงได้ตรวจสอบสลิปการโอนเงินแล้วพบว่าข้อมูลไม่ถูกต้อง กรุณาตรวจสอบยอดเงิน หรือแนบสลิปที่ถูกต้องใหม่อีกครั้งผ่านหน้ารายการจองของฉัน'

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle}</title>
  <style>
    body {
      font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FFF7EF;
      margin: 0;
      padding: 24px;
      color: #1F2937;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(31, 41, 55, 0.08);
      border: 1px solid #FED7AA;
    }
    .header {
      background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
      padding: 32px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1F2937;
    }
    .status-badge {
      display: inline-block;
      padding: 10px 18px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 15px;
      color: ${statusColor};
      background-color: ${statusBg};
      border: 1px solid ${statusBorder};
      margin-bottom: 20px;
    }
    .card {
      background-color: #FFFDF9;
      border: 1px solid #FED7AA;
      border-radius: 14px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #E5E7EB;
      font-size: 14px;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6B7280;
    }
    .detail-value {
      font-weight: 600;
      color: #1F2937;
      text-align: right;
    }
    .footer {
      background-color: #FFF3E8;
      padding: 20px 24px;
      text-align: center;
      font-size: 13px;
      color: #6B7280;
      border-top: 1px solid #FED7AA;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PetBuddy</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">ระบบแจ้งเตือนสถานะการชำระเงิน</p>
    </div>
    <div class="content">
      <div class="greeting">สวัสดีคุณ ${ownerUsername},</div>
      <div class="status-badge">${statusTitle}</div>
      <p style="line-height: 1.6; font-size: 15px; color: #374151; margin-bottom: 20px;">
        ${actionMessage}
      </p>

      <div class="card">
        <div class="detail-row">
          <span class="detail-label">รหัสการจอง:</span>
          <span class="detail-value">#${bookingId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">บริการ:</span>
          <span class="detail-value">${serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">พี่เลี้ยงที่ดูแล:</span>
          <span class="detail-value">${sitterUsername}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">รอบการชำระ:</span>
          <span class="detail-value">${stageLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ยอดเงิน:</span>
          <span class="detail-value" style="color: #F97316; font-size: 16px;">${formattedAmount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">สถานะการจองปัจจุบัน:</span>
          <span class="detail-value">${bookingStatusText}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      อีเมลนี้เป็นข้อความอัตโนมัติจากระบบ PetBuddy กรุณาอย่าตอบกลับ<br>
      ขอขอบคุณที่ร่วมสร้างชุมชนสัตว์เลี้ยงที่อบอุ่นและปลอดภัยไปด้วยกัน 🐾
    </div>
  </div>
</body>
</html>
  `
}
