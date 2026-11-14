import nodemailer from 'nodemailer'
import { getWelcomeEmailHtml } from '../templates/welcome-email.template.js'
import { getPasswordResetEmailHtml } from '../templates/password-reset-email.template.js'
import { getBookingStatusEmailHtml } from '../templates/booking-status-email.template.js'
import { getNewBookingEmailHtml } from '../templates/new-booking-email.template.js';
import { getBookingCancelledEmailHtml } from '../templates/booking-cancelled-email.template.js'
import {
  getPaymentStatusEmailHtml,
  PaymentStatusEmailParams,
} from '../templates/payment-status-email.template.js'
import { getCareReportEmailHtml, CareReportEmailParams } from '../templates/care-report-email.template.js'
import { SitterBookingAction } from '../validators/booking.validator.js';

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
  action: SitterBookingAction
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
      start: `⏳ บริการ PetBuddy ของคุณกำลังเริ่มต้นขึ้นแล้ว! (#${params.bookingId})`,
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

    const actionTextMap: Record<SitterBookingAction, string> = {
  accept: 'ตอบรับ',
  reject: 'ปฏิเสธ',
  start: 'เริ่มให้บริการ',
  complete: 'ส่งงานเสร็จสิ้น',
};
const actionText = actionTextMap[params.action] || 'อัปเดตสถานะ';

const textContent = `สวัสดีคุณ ${params.ownerUsername}!\n\nคำขอจอง #${params.bookingId} (${params.serviceName}) ได้รับการ${actionText} โดยพี่เลี้ยงคุณ ${params.sitterUsername}\n\nขอบคุณที่ใช้บริการ PetBuddy!`;

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

// ==========================================
// แจ้งเตือน Sitter เมื่อ Pet Owner ยกเลิกการจอง (US 6-3)
// ==========================================

export interface BookingCancelledNotificationParams {
  sitterEmail: string
  sitterUsername: string
  ownerName: string
  serviceName: string
  bookingId: number
  startTime: string
  endTime: string
  petNames: string[]
  totalPrice: number | string
  depositPaid: boolean
}

/**
 * ส่งอีเมลแจ้งพี่เลี้ยงว่าเจ้าของสัตว์เลี้ยงยกเลิกการจอง
 * เป็นแบบ Non-blocking พร้อม Safe fallback เพื่อไม่ให้กระทบกระบวนการหลักของ API
 */
export const sendBookingCancelledToSitterEmail = async (
  params: BookingCancelledNotificationParams
): Promise<boolean> => {
  try {
    const transporter = getMailTransporter()

    if (!transporter) {
      console.warn(
        `[MailService] SMTP credentials are not configured. Skipping booking cancelled email to: ${params.sitterEmail}`
      )
      return false
    }

    const fromAddress = process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`

    const textContent = `สวัสดีคุณ ${params.sitterUsername}!\n\nคุณ ${params.ownerName} ได้ยกเลิกการจอง #${params.bookingId} (${params.serviceName})\n${params.depositPaid ? 'ค่ามัดจำที่ชำระแล้วจะไม่ถูกคืนตามนโยบายของ PetBuddy' : 'การจองนี้ยังไม่มีการชำระเงิน'}\n\nขอบคุณที่ใช้บริการ PetBuddy!`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.sitterEmail,
      subject: `🐾 การจองถูกยกเลิก (#${params.bookingId})`,
      text: textContent,
      html: getBookingCancelledEmailHtml(params),
    })

    console.log(
      `[MailService] Booking cancelled email sent successfully to ${params.sitterEmail} (Message ID: ${info.messageId})`
    )
    return true
  } catch (error) {
    console.error(
      `[MailService] Failed to send booking cancelled email to ${params.sitterEmail}:`,
      error
    )
    return false
  }
}

/**
 * ส่งอีเมลแจ้งผลการตรวจสอบสลิปการโอนเงิน (Non-blocking safe dispatch - US 6-2)
 */
export const sendPaymentStatusNotificationEmail = async (
  params: PaymentStatusEmailParams & { toEmail: string }
): Promise<boolean> => {
  try {
    const transporter = getMailTransporter()

    if (!transporter) {
      console.warn(
        `[MailService] SMTP credentials are not configured in .env. Skipping payment status email to: ${params.toEmail}`
      )
      return false
    }

    const fromAddress =
      process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`

    const htmlContent = getPaymentStatusEmailHtml(params)
    const subject =
      params.action === 'verify'
        ? `🐾 ยืนยันการชำระเงินเรียบร้อยแล้ว - การจอง #${params.bookingId}`
        : `⚠️ สลิปการโอนเงินไม่ผ่านการตรวจสอบ - การจอง #${params.bookingId}`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.toEmail,
      subject,
      text: `สวัสดีคุณ ${params.ownerUsername}!\n\nสถานะการชำระเงินสำหรับการจอง #${params.bookingId} (${params.serviceName}): ${params.action === 'verify' ? 'ได้รับการยืนยันแล้ว' : 'ไม่ผ่านการตรวจสอบ'}\nยอดเงิน: ฿${params.amount.toLocaleString('th-TH')}`,
      ...(htmlContent ? { html: htmlContent } : {}),
    })

    console.log(
      `[MailService] Payment status email sent successfully to ${params.toEmail} (Message ID: ${info.messageId})`
    )
    return true
  } catch (error) {
    console.error(
      `[MailService] Failed to send payment status email to ${params.toEmail}:`,
      error
    )
    return false
  }
}

// ==========================================
// แจ้ง Pet Owner เมื่อพี่เลี้ยงส่งรายงานการดูแล (US 7-3)
// ==========================================

/**
 * ส่งอีเมลแจ้งเจ้าของสัตว์เลี้ยงว่ามีรายงานการดูแลใหม่
 * เป็นแบบ Non-blocking พร้อม Safe fallback เพื่อไม่ให้กระทบกระบวนการหลักของ API
 */
export const sendCareReportToOwnerEmail = async (
  params: CareReportEmailParams & { toEmail: string }
): Promise<boolean> => {
  try {
    const transporter = getMailTransporter()

    if (!transporter) {
      console.warn(
        `[MailService] SMTP credentials are not configured. Skipping care report email to: ${params.toEmail}`
      )
      return false
    }

    const fromAddress = process.env.MAIL_FROM || `"PetBuddy" <${process.env.SMTP_USER}>`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.toEmail,
      subject: `📝 รายงานการดูแลน้องจากพี่เลี้ยง (#${params.bookingId})`,
      text: `สวัสดีคุณ ${params.ownerUsername}!\n\nพี่เลี้ยงคุณ ${params.sitterUsername} ส่งรายงานการดูแลใหม่สำหรับการจอง #${params.bookingId} (${params.serviceName})\n\n${params.reportDetail}\n\nดูรายงานทั้งหมดได้ที่หน้าการจองของคุณใน PetBuddy`,
      html: getCareReportEmailHtml(params),
    })

    console.log(
      `[MailService] Care report email sent successfully to ${params.toEmail} (Message ID: ${info.messageId})`
    )
    return true
  } catch (error) {
    console.error(`[MailService] Failed to send care report email to ${params.toEmail}:`, error)
    return false
  }
}
