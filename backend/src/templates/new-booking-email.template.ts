export interface NewBookingEmailParams {
  sitterUsername: string;
  ownerName: string;
  serviceName: string;
  bookingId: number;
  startTime: string;
  endTime: string;
  totalPrice: number | string;
}

export const getNewBookingEmailHtml = (params: NewBookingEmailParams): string => {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  };
  const formattedStart = new Date(params.startTime).toLocaleString('th-TH', options);
  const formattedEnd = new Date(params.endTime).toLocaleString('th-TH', options);


  return `
    <div style="background-color: #FAF5F0; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1F2937;">
      <div style="background-color: #ffffff; max-width: 450px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        
        <!-- โลโก้ PetBuddy สไตล์หน้า Login -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">
            <span style="color: #374151;">🐾</span> <span style="color: #F97316;">PetBuddy</span>
          </h1>
        </div>

        <!-- หัวข้อ -->
        <h2 style="color: #111827; font-size: 20px; text-align: center; margin-top: 0; margin-bottom: 8px;">มีคำขอจองคิวใหม่เข้ามา!</h2>
        <p style="color: #6B7280; text-align: center; font-size: 14px; margin-top: 0; margin-bottom: 24px;">
          รหัสอ้างอิง: #${params.bookingId}
        </p>

        <!-- เนื้อหาหลัก -->
        <p style="margin-bottom: 16px;">สวัสดีคุณ <strong>${params.sitterUsername}</strong>,</p>
        <p style="margin-bottom: 24px;">คุณ <strong>${params.ownerName}</strong> ได้ส่งคำขอฝากดูแลสัตว์เลี้ยงรายการใหม่มาให้คุณพิจารณา</p>
        
        <!-- กล่องรายละเอียด (UI คล้ายๆ Input box) -->
        <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 24px; background-color: #FAFAFA;">
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>บริการ:</strong> <span style="color: #0D9488; font-weight: bold;">${params.serviceName}</span></p>
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>เวลาเริ่ม:</strong> ${formattedStart} น.</p>
          <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>เวลาสิ้นสุด:</strong> ${formattedEnd} น.</p>
          <div style="border-top: 1px dashed #E5E7EB; margin: 12px 0; padding-top: 12px;">
            <p style="margin: 0; font-size: 16px;"><strong>ยอดรวม:</strong> <span style="color: #F97316; font-weight: bold; font-size: 18px;">${params.totalPrice} บาท</span></p>
          </div>
        </div>
        
        <!-- ปุ่มกด (แบบเดียวกับปุ่มสีส้มในหน้า Login) -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.FRONTEND_URL}/sitter/bookings" 
             style="background-color: #F97316; color: #ffffff; padding: 14px 24px; border-radius: 8px; text-decoration: none; display: block; font-weight: bold; text-align: center;">
             เข้าสู่ระบบเพื่อจัดการคิว
          </a>
        </div>

        <!-- Footer -->
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