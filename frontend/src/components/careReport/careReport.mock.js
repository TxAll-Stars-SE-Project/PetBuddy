// TODO(US7-3 รอบ frontend): ลบไฟล์นี้ทิ้งทั้งไฟล์ตอนต่อ API จริง (merge ครั้งที่ 2)
//   ลบพร้อมกัน: pages/dev/CareReportPreviewPage.jsx + route /dev/care-report ใน App.jsx
//   แทนที่ด้วย services/careReports.js ที่เรียก GET/POST /api/bookings/{bookingID}/reports
//
// mock ตามรูปแบบ GET /api/bookings/{bookingID}/reports (docs/API.md § PART 3: 6.2)
// ใช้กับหน้า preview ระหว่างที่ backend ยังไม่มี endpoint

// รูปตัวอย่างเป็น SVG ในไฟล์ ไม่ต้องพึ่งเน็ต
function mockPhoto(emoji, bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${bg}"/><text x="300" y="235" font-size="140" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

export const MOCK_BOOKING_SUBTITLE = "การจอง #12 · ดูแลสัตว์เลี้ยงที่บ้าน · 🐾 ถั่วเหลือง, มะลิ";

export const MOCK_REPORTS = [
  {
    reportId: 1,
    bookingId: 12,
    reportDetail: "มาถึงบ้านแล้วครับ น้องทั้งสองตัวตื่นเต้นมาก ให้อาหารเช้าเรียบร้อย ทานหมดเกลี้ยง",
    photoUrl: mockPhoto("🍚", "#FFEDD5"),
    createdAt: hoursAgo(27),
  },
  {
    reportId: 2,
    bookingId: 12,
    reportDetail: "พาถั่วเหลืองออกไปเดินเล่นที่สวนหน้าหมู่บ้าน 30 นาที ร่าเริงมากครับ",
    photoUrl: mockPhoto("🐕", "#DCFCE7"),
    createdAt: hoursAgo(23),
  },
  {
    reportId: 3,
    bookingId: 12,
    reportDetail: "มะลินอนกลางวันบนโซฟา ดื่มน้ำแล้ว ไม่มีอาการผิดปกติ",
    photoUrl: null,
    createdAt: hoursAgo(5),
  },
  {
    reportId: 4,
    bookingId: 12,
    reportDetail: "อาหารเย็นเรียบร้อย เล่นลูกบอลด้วยกันก่อนนอนครับ 🎾",
    photoUrl: mockPhoto("🎾", "#E0F2FE"),
    createdAt: hoursAgo(1),
  },
];

let nextId = MOCK_REPORTS.length + 1;

// จำลองการตอบกลับของ POST /api/bookings/{bookingID}/reports
export function buildMockReport({ reportDetail, photo }) {
  return {
    reportId: nextId++,
    bookingId: 12,
    reportDetail,
    photoUrl: photo ? URL.createObjectURL(photo) : null,
    createdAt: new Date().toISOString(),
  };
}
