import nodemailer from 'nodemailer'
import { getWelcomeEmailHtml } from '../templates/welcome-email.template.js'
import { getPasswordResetEmailHtml } from '../templates/password-reset-email.template.js'
import { getBookingStatusEmailHtml } from '../templates/booking-status-email.template.js'
import { getNewBookingEmailHtml } from '../templates/new-booking-email.template.js';

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

/**
 * ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน ใช้ transporter เดียวกับ Welcome Email
 * โยน error ออกไปให้ผู้เรียก (forgotPassword) จัดการ เพื่อให้ log ความล้มเหลวได้แน่นอน
 * โดยไม่กระทบ response ที่ตอบกลับผู้ใช้เสมอ (ป้องกัน account enumeration)
 */
export const sendPasswordResetEmail = async (to: string, resetLink: string, ttlMinutes: number): Promise<void> => {
  const transporter = getMailTransporter()

  if (!transporter) {
    throw new Error('SMTP credentials are not configured in .env. Cannot send password reset email.')
  }

  const fromAddress = process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`

  const htmlContent = getPasswordResetEmailHtml({ resetLink, ttlMinutes })

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: '🔐 คำขอรีเซ็ตรหัสผ่าน PetBuddy',
    text: `รีเซ็ตรหัสผ่านของคุณโดยใช้ลิงก์นี้ (ใช้ได้ ${ttlMinutes} นาที): ${resetLink}`,
    html: htmlContent,
  })

  console.log(`[MailService] Password reset email sent successfully to ${to} (Message ID: ${info.messageId})`)
}

export interface BookingStatusNotificationParams {
  toEmail: string
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

// ==========================================
// แจ้งเตือน Sitter เมื่อมีการจองใหม่จาก Pet Owner
// ==========================================

export interface NewBookingNotificationParams {
  sitterEmail: string;
  sitterUsername: string;
  ownerName: string;
  serviceName: string;
  bookingId: number;
  startTime: string;
  endTime: string;
  totalPrice: number | string;
}

export const sendNewBookingToSitterEmail = async (
  params: NewBookingNotificationParams
): Promise<boolean> => {
  try {
    const transporter = getMailTransporter();

    if (!transporter) {
      console.warn(
        `[MailService] SMTP credentials are not configured. Skipping new booking email to: ${params.sitterEmail}`
      );
      return false;
    }

    const fromAddress = process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`;

    const htmlContent = getNewBookingEmailHtml(params);

    const textContent = `สวัสดีคุณ ${params.sitterUsername}!\n\nมีคำขอจองคิวใหม่ (รหัส #${params.bookingId}) จากคุณ ${params.ownerName} สำหรับบริการ ${params.serviceName}\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบและยืนยันการรับงานครับ`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.sitterEmail,
      subject: `🐾 แจ้งเตือนคิวใหม่! คำขอจองบริการ PetBuddy (#${params.bookingId})`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[MailService] New booking email sent successfully to ${params.sitterEmail} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[MailService] Failed to send new booking email to ${params.sitterEmail}:`, error);
    return false;
  }
};

/**
 * ส่งอีเมลแจ้งเตือนการเปลี่ยนสถานะการจอง (Accept / Reject / Complete) ถึง Pet Owner
 * เป็นแบบ Non-blocking พร้อม Safe fallback เพื่อไม่ให้กระทบกระบวนการหลักของ API
 */
export const sendBookingStatusNotificationEmail = async (
  params: BookingStatusNotificationParams
): Promise<boolean> => {
  try {
    const transporter = getMailTransporter()

    if (!transporter) {
      console.warn(
        `[MailService] SMTP credentials are not configured. Skipping booking status notification email to: ${params.toEmail}`
      )
      return false
    }

    const fromAddress =
      process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`

    const subjectMap = {
      accept: `🐾 คำขอจองบริการ PetBuddy ของคุณได้รับการตอบรับแล้ว (#${params.bookingId})`,
      reject: `🐾 แจ้งเตือนสถานะคำขอจองบริการ PetBuddy (#${params.bookingId})`,
      complete: `🎉 บริการ PetBuddy ของคุณเสร็จสิ้นเรียบร้อยแล้ว (#${params.bookingId})`,
    }

    const htmlContent = getBookingStatusEmailHtml({
      ownerUsername: params.ownerUsername,
      sitterUsername: params.sitterUsername,
      serviceName: params.serviceName,
      action: params.action,
      bookingId: params.bookingId,
      startTime: params.startTime,
      endTime: params.endTime,
      petNames: params.petNames,
      totalPrice: params.totalPrice,
    })

    const textContent = `สวัสดีคุณ ${params.ownerUsername}!\n\nคำขอจอง #${params.bookingId} (${params.serviceName}) ได้รับการ ${params.action === 'accept' ? 'ตอบรับ' : params.action === 'reject' ? 'ปฏิเสธ' : 'ส่งงานเสร็จสิ้น'} โดยพี่เลี้ยงคุณ ${params.sitterUsername}\n\nขอบคุณที่ใช้บริการ PetBuddy!`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.toEmail,
      subject: subjectMap[params.action],
      text: textContent,
      html: htmlContent,
    })

    console.log(
      `[MailService] Booking status notification email (${params.action}) sent successfully to ${params.toEmail} (Message ID: ${info.messageId})`
    )
    return true
  } catch (error) {
    console.error(
      `[MailService] Failed to send booking status notification email to ${params.toEmail}:`,
      error
    )
    return false
  }
}
