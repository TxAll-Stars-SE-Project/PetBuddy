// frontend/src/utils/bookingStatusConfig.js

export const BOOKING_STATUS_CONFIG = {
    pending: {
      label: "รอพี่เลี้ยงตอบรับ",
      badgeClass: "booking-badge booking-badge--muted",
      description: "ยื่นใบจองแล้ว รอยืนยันจากพี่เลี้ยง",
      allowedActions: {
        sitter: ["accept", "reject"],
        owner: ["cancel"],
      },
    },
    waiting_payment: {
      label: "รอชำระเงิน",
      badgeClass: "booking-badge booking-badge--warning",
      description: "พี่เลี้ยงตอบรับแล้ว กรุณาชำระเงินมัดจำหรือเต็มจำนวน",
      allowedActions: {
        sitter: [],
        owner: ["pay", "cancel"],
      },
    },
    deposit_paid: {
      label: "ชำระมัดจำแล้ว",
      badgeClass: "booking-badge booking-badge--success",
      description: "ล็อกคิวสำเร็จ รอถึงวันนัดหมายเพื่อเริ่มงาน",
      allowedActions: {
        sitter: ["start"],
        owner: ["cancel"],
      },
    },
    confirmed: {
      label: "ยืนยันการจองแล้ว",
      badgeClass: "booking-badge booking-badge--success",
      description: "ชำระเงินเต็มจำนวนแล้ว รอถึงวันนัดหมาย",
      allowedActions: {
        sitter: ["start"],
        owner: [],
      },
    },
    in_progress: {
      label: "กำลังให้บริการ",
      badgeClass: "booking-badge booking-badge--warning",
      description: "พี่เลี้ยงกำลังดูแลสัตว์เลี้ยง สามารถส่ง Care Report ได้",
      allowedActions: {
        sitter: ["send_report", "complete"],
        owner: [],
      },
    },
    waiting_final_payment: {
      label: "รอชำระส่วนที่เหลือ",
      badgeClass: "booking-badge booking-badge--warning",
      description: "พี่เลี้ยงดูแลเสร็จแล้ว กรุณาชำระยอดคงเหลือ 70%",
      allowedActions: {
        sitter: [],
        owner: ["pay_final"],
      },
    },
    completed: {
      label: "เสร็จสิ้น",
      badgeClass: "booking-badge booking-badge--muted",
      description: "รายการจองเสร็จสมบูรณ์",
      allowedActions: {
        sitter: [],
        owner: ["review"],
      },
    },
    rejected: {
      label: "ถูกปฏิเสธ",
      badgeClass: "booking-badge booking-badge--error",
      description: "พี่เลี้ยงปฏิเสธคำขอจอง",
      allowedActions: {
        sitter: [],
        owner: [],
      },
    },
    cancelled: {
      label: "ยกเลิกแล้ว",
      badgeClass: "booking-badge booking-badge--error",
      description: "รายการจองถูกยกเลิกแล้ว",
      allowedActions: {
        sitter: [],
        owner: [],
      },
    },
  };
  
  export const getBookingStatusInfo = (status) => {
    return (
      BOOKING_STATUS_CONFIG[status] || {
        label: status || "ไม่ระบุสถานะ",
        badgeClass: "booking-badge booking-badge--muted",
        description: "",
        allowedActions: { sitter: [], owner: [] },
      }
    );
  };