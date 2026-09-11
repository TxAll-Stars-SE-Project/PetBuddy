import nodemailer from 'nodemailer'
import { getWelcomeEmailHtml } from '../templates/welcome-email.template.js'

interface WelcomeEmailParams {
  email: string
  username: string
  role?: string
}

/**
 * สร้าง Transporter สำหรับส่งอีเมลผ่าน SMTP (เช่น Gmail)
 */
const getMailTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT) || 587
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  // ตัดช่องว่างออกในกรณีผู้ใช้ก๊อปรหัส App Password ของ Google มาแบบมีวรรค 4 ช่วง
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

/**
 * ส่งอีเมลต้อนรับ (Welcome Email) เมื่อผู้ใช้สมัครสมาชิกสำเร็จ
 * เป็นฟังก์ชันแบบ non-blocking และมี safe fallback ในตัว (ไม่ทำให้ register พังหากส่งเมลขัดข้อง)
 */
export const sendWelcomeEmail = async ({
  email,
  username,
  role = 'owner',
}: WelcomeEmailParams): Promise<boolean> => {
  try {
    const transporter = getMailTransporter()

    if (!transporter) {
      console.warn(
        `[MailService] SMTP credentials are not configured in .env. Skipping welcome email to: ${email}`
      )
      return false
    }

    const fromAddress =
      process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`

    const isSitter = role === 'sitter'
    const roleTitle = isSitter ? 'ผู้ดูแลสัตว์เลี้ยง (Pet Sitter)' : 'เจ้าของสัตว์เลี้ยง (Pet Owner)'
    const roleDescription = isSitter
      ? 'คุณสามารถเริ่มต้นตั้งค่าโปรไฟล์ สร้างรายการบริการ และรับฝากดูแลสัตว์เลี้ยงจากเจ้าของที่ไว้วางใจได้เลย'
      : 'คุณสามารถเริ่มต้นค้นหาพี่เลี้ยงและสถานที่รับฝากที่ไว้ใจได้ พร้อมดูแลน้องๆ สัตว์เลี้ยงแสนรักของคุณได้ทันที'

    // สร้าง HTML content จาก template module
    const htmlContent = getWelcomeEmailHtml({
      username,
      email,
      roleTitle,
      roleDescription,
    })

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `🐾 ยินดีต้อนรับสู่ PetBuddy, คุณ ${username}!`,
      text: `สวัสดีคุณ ${username}!\n\nยินดีต้อนรับสู่ PetBuddy ในฐานะ ${roleTitle}\n${roleDescription}\n\nขอบคุณที่ร่วมเป็นส่วนหนึ่งกับเรา!\nทีมงาน PetBuddy`,
      ...(htmlContent ? { html: htmlContent } : {}),
    })

    console.log(`[MailService] Welcome email sent successfully to ${email} (Message ID: ${info.messageId})`)
    return true
  } catch (error) {
    console.error(`[MailService] Failed to send welcome email to ${email}:`, error)
    // ส่งไม่สำเร็จแต่ไม่ throw เพื่อไม่ให้กระทบขั้นตอน register
    return false
  }
}
