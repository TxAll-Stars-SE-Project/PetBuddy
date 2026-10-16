export interface PasswordResetEmailTemplateProps {
  resetLink: string
  ttlMinutes: number
}

/**
 * ฟังก์ชันสร้าง HTML สำหรับอีเมลรีเซ็ตรหัสผ่านของ PetBuddy
 * แยกไฟล์ออกมาเป็นโมดูล TypeScript ให้เรียกใช้ได้ทันทีโดยไม่ต้องอ่านไฟล์จากดิสก์
 */
export const getPasswordResetEmailHtml = ({
  resetLink,
  ttlMinutes,
}: PasswordResetEmailTemplateProps): string => {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รีเซ็ตรหัสผ่าน PetBuddy</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 36px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                🐾 PetBuddy
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #fed7aa;">
                คำขอรีเซ็ตรหัสผ่าน
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0f172a; font-weight: 700;">
                รีเซ็ตรหัสผ่านของคุณ 🔐
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี PetBuddy ของคุณ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
                      ตั้งรหัสผ่านใหม่
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 18px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9a3412;">
                  ⏳ ลิงก์นี้จะหมดอายุภายใน <strong>${ttlMinutes} นาที</strong> และใช้ได้เพียงครั้งเดียว
                </p>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                หากปุ่มด้านบนใช้งานไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; word-break: break-all;">
                <a href="${resetLink}" style="color: #f97316;">${resetLink}</a>
              </p>

              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #64748b;">
                หากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยต่ออีเมลนี้ได้ รหัสผ่านของคุณจะไม่ถูกเปลี่ยนแปลง
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                อีเมลนี้ถูกส่งโดยอัตโนมัติจากระบบ PetBuddy • ขอขอบคุณที่ร่วมเป็นส่วนหนึ่งของชุมชนเรา 🐶🐱
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
