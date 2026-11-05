import { escapeHtml } from './booking-cancelled-email.template.js';

export interface CareReportEmailParams {
  ownerUsername: string;
  sitterUsername: string;
  serviceName: string;
  bookingId: number;
  petNames: string[];
  reportDetail: string;
  photoUrl: string | null;
  createdAt: string;
}

export const getCareReportEmailHtml = (params: CareReportEmailParams): string => {
  const reportedAt = new Date(params.createdAt).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  });
  const petsDisplay =
    params.petNames.length > 0 ? escapeHtml(params.petNames.join(', ')) : 'สัตว์เลี้ยงของคุณ';
  // โน้ตมาจากพี่เลี้ยง จึง escape ก่อนแล้วค่อยแปลงการขึ้นบรรทัดเป็น <br>
  const detailHtml = escapeHtml(params.reportDetail).replace(/\r?\n/g, '<br>');
  const photoHtml = params.photoUrl
    ? `<img src="${escapeHtml(params.photoUrl)}" alt="รูปกิจกรรมของ ${petsDisplay}" style="display: block; width: 100%; border-radius: 8px; margin-top: 12px;">`
    : '';

  return `
    <div style="background-color: #FAF5F0; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1F2937;">
      <div style="background-color: #ffffff; max-width: 450px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
            <span style="color: #374151;">🐾</span> <span style="color: #F97316;">PetBuddy</span>
          </h1>
        </div>

        <h2 style="color: #111827; font-size: 20px; text-align: center; margin-top: 0; margin-bottom: 8px;">รายงานการดูแลน้องใหม่</h2>
        <p style="color: #6B7280; text-align: center; font-size: 14px; margin-top: 0; margin-bottom: 24px;">
          รหัสอ้างอิง: #${params.bookingId} · ${reportedAt} น.
        </p>

        <p style="margin-bottom: 16px;">สวัสดีคุณ <strong>${escapeHtml(params.ownerUsername)}</strong>,</p>
        <p style="margin-bottom: 24px;">พี่เลี้ยง <strong>${escapeHtml(params.sitterUsername)}</strong> ส่งรายงานการดูแล <strong>${petsDisplay}</strong> (${escapeHtml(params.serviceName)})</p>

        <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 24px; background-color: #FAFAFA;">
          <p style="margin: 0; font-size: 15px;">${detailHtml}</p>
          ${photoHtml}
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.FRONTEND_URL}/bookings"
             style="background-color: #F97316; color: #ffffff; padding: 14px 24px; border-radius: 8px; text-decoration: none; display: block; font-weight: bold; text-align: center;">
             ดูรายงานทั้งหมด
          </a>
        </div>

        <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            หากมีข้อสงสัย กรุณาติดต่อทีมงาน PetBuddy<br>
            © 2026 PetBuddy. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;
};
