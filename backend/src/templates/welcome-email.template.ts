export interface WelcomeEmailTemplateProps {
  username: string
  email: string
  roleTitle: string
  roleDescription: string
}

/**
 * ฟังก์ชันสร้าง HTML สำหรับ Welcome Email ของ PetBuddy
 * แยกไฟล์ออกมาเป็นโมดูล TypeScript ให้เรียกใช้ได้ทันทีโดยไม่ต้องอ่านไฟล์จากดิสก์
 */
export const getWelcomeEmailHtml = ({
  username,
  email,
  roleTitle,
  roleDescription,
}: WelcomeEmailTemplateProps): string => {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยินดีต้อนรับสู่ PetBuddy</title>
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
                เพื่อนคู่ใจ สัตว์เลี้ยงคู่กาย
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0f172a; font-weight: 700;">
                สวัสดีคุณ ${username} 🎉
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                ยินดีต้อนรับสู่ชุมชนคนรักสัตว์ <strong>PetBuddy</strong> บัญชีของคุณได้รับการสร้างและเปิดใช้งานเรียบร้อยแล้วในฐานะ <strong>${roleTitle}</strong>
              </p>
              
              <!-- Info Box -->
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 18px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9a3412;">
                  💡 <strong>ก้าวต่อไปของคุณ:</strong><br>
                  ${roleDescription}
                </p>
              </div>

              <!-- Account Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 28px;">
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">ชื่อผู้ใช้ (Username):</td>
                  <td style="font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; padding-bottom: 6px;">${username}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">อีเมล (Email):</td>
                  <td style="font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; padding-bottom: 6px;">${email}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b;">สถานะ (Role):</td>
                  <td style="font-size: 13px; color: #f97316; font-weight: 700; text-align: right;">${roleTitle}</td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #64748b;">
                หากคุณมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้ได้ทันที ทีมงาน PetBuddy พร้อมดูแลคุณเสมอครับ
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
