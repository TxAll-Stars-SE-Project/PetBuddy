export interface BookingCancelledEmailParams {
  sitterUsername: string;
  ownerName: string;
  serviceName: string;
  bookingId: number;
  startTime: string;
  endTime: string;
  petNames: string[];
  totalPrice: number | string;
  depositPaid: boolean;
}

// ชื่อผู้ใช้/บริการมาจากผู้ใช้ จึง escape ก่อนใส่ลง HTML
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const getBookingCancelledEmailHtml = (params: BookingCancelledEmailParams): string => {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  };
  const formattedStart = new Date(params.startTime).toLocaleString('th-TH', options);
  const formattedEnd = new Date(params.endTime).toLocaleString('th-TH', options);
  const petsDisplay =
    params.petNames.length > 0 ? escapeHtml(params.petNames.join(', ')) : 'สัตว์เลี้ยงของลูกค้า';

  const depositNote = params.depositPaid
    ? 'เจ้าของสัตว์เลี้ยงได้ชำระค่ามัดจำแล้ว และค่ามัดจำนี้จะไม่ถูกคืนตามนโยบายของ PetBuddy'
    : 'การจองนี้ยังไม่มีการชำระเงิน จึงไม่มีผลต่อรายได้ของคุณ';

  return `
    <div style="background-color: #FAF5F0; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1F2937;">
      <div style="background-color: #ffffff; max-width: 450px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
            <span style="color: #374151;">🐾</span> <span style="color: #F97316;">PetBuddy</span>
          </h1>
        </div>

        <h2 style="color: #111827; font-size: 20px; text-align: center; margin-top: 0; margin-bottom: 8px;">การจองถูกยกเลิก</h2>
        <p style="color: #6B7280; text-align: center; font-size: 14px; margin-top: 0; margin-bottom: 24px;">
          รหัสอ้างอิง: #${params.bookingId}
        </p>

        <p style="margin-bottom: 16px;">สวัสดีคุณ <strong>${escapeHtml(params.sitterUsername)}</strong>,</p>
        <p style="margin-bottom: 24px;">คุณ <strong>${escapeHtml(params.ownerName)}</strong> ได้ยกเลิกการจองบริการของคุณ ช่วงเวลาดังกล่าวจึงว่างสำหรับรับงานอื่น</p>

        <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 16px; background-color: #FAFAFA;">
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>บริการ:</strong> <span style="color: #0D9488; font-weight: bold;">${escapeHtml(params.serviceName)}</span></p>
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>สัตว์เลี้ยง:</strong> ${petsDisplay}</p>
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>เวลาเริ่ม:</strong> ${formattedStart} น.</p>
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>เวลาสิ้นสุด:</strong> ${formattedEnd} น.</p>
          <div style="border-top: 1px dashed #E5E7EB; margin: 12px 0 0 0; padding-top: 12px;">
            <p style="margin: 0; font-size: 16px;"><strong>ยอดรวม:</strong> <span style="color: #6B7280; font-weight: bold; font-size: 18px; text-decoration: line-through;">${params.totalPrice} บาท</span></p>
          </div>
        </div>

        <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #B45309;">
          ${depositNote}
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.FRONTEND_URL}/sitter/bookings"
             style="background-color: #F97316; color: #ffffff; padding: 14px 24px; border-radius: 8px; text-decoration: none; display: block; font-weight: bold; text-align: center;">
             ดูรายการจองของคุณ
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
