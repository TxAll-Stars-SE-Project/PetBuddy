# PetBuddy API Documentation — Sprint 3 (Sitters, Bookings & Operations)

> **Sprint 3 APIs:** เอกสารสัญญาการเชื่อมต่อ API สำหรับ Sprint 3 ทั้งหมด  
> **Base URL:** `http://localhost:5000`  
> **Auth:** `Header Authorization: Bearer <token>`  
> **Envelope Standard:**  
> - สำเร็จ: `{ "status": "success", "data": ... }` หรือ `{ "success": true, ... }`  
> - ผิดพลาด: `{ "status": "error", "message": "..." }` หรือ `{ "success": false, "error": "...", "message": "..." }`

---

## 📌 Enums & Shared Types (Sprint 3 Aligned)

- **role:** `owner` | `sitter`
- **booking_status:** `pending` | `waiting_payment` | `deposit_paid` | `confirmed` | `in_progress` | `rejected` | `cancelled` | `waiting_final_payment` | `completed`
- **payment_plan:** `full` | `deposit`
- **payment_stage:** `deposit` | `final` | `full`
- **payment_status:** `pending_verifying` | `verified` | `rejected`
- **service_status_action / booking_action:** `accept` | `reject` | `start` | `complete`

---

## 🔄 End-to-End Booking Status Transition

```
[แผน Deposit 30%]: waiting_payment ──► deposit_paid ──┐
                                                      ├──► in_progress ──► waiting_final_payment ──► completed
[แผน Full 100%]:   waiting_payment ──► confirmed    ──┘         │                                         ▲
                                                                │                                         │
                                                                └── (ถ้าเป็น Full กดจบงานข้ามไป completed เลย)
```

| จากสถานะ | เหตุการณ์ / Action | ไปสถานะ | หมายเหตุ |
|---|---|---|---|
| `pending` | Sitter Accept | `waiting_payment` | พี่เลี้ยงรับงาน รอการชำระเงิน |
| `pending` | Sitter Reject | `rejected` | พี่เลี้ยงปฏิเสธคำขอ |
| `pending` / `waiting_payment` | Owner Cancel (US 6-3) | `cancelled` | ยกเลิกได้ก่อนคอนเฟิร์ม ไม่ต้องคืนเงิน |
| `waiting_payment` | Verify สลิป `deposit` ผ่าน | `deposit_paid` | ชำระมัดจำ 30% ล็อกคิวงานแล้ว |
| `waiting_payment` | Verify สลิป `full` ผ่าน | `confirmed` | ชำระเต็มจำนวน 100% ล็อกคิวงานแล้ว |
| `confirmed` / `deposit_paid` | Sitter Start Service (US 7-2) | `in_progress` | พี่เลี้ยงกด "เริ่มงาน" เมื่อถึงวันนัดหมาย |
| `in_progress` | Sitter Complete (แผน `deposit`) | `waiting_final_payment` | งานเสร็จ รอ Owner จ่าย 70% ที่เหลือ |
| `in_progress` | Sitter Complete (แผน `full`) | `completed` | งานเสร็จและจ่ายครบแล้ว จบงานสมบูรณ์ |
| `waiting_final_payment` | Verify สลิป `final` ผ่าน (US 6-5) | `completed` | ชำระงวดสุดท้าย 70% เรียบร้อย ปิดงาน |
| `completed` | Owner Review (US 7-1) | `completed` | เขียนรีวิว 1-5 ดาว และคำนวณคะแนนเฉลี่ย |

---

# 1. Sitter Payout & Payment Info (`US 2-2`)

จัดการข้อมูลบัญชีรับเงินและรูปภาพ QR Code สำหรับพี่เลี้ยงสัตว์เลี้ยง

---

## 1.1 Get my payment information (Sitter)

ดึงข้อมูลบัญชีและ QR Code ของพี่เลี้ยงที่กำลังล็อกอินอยู่ เพื่อแสดงผลในหน้า Edit Profile

```http
GET /api/sitter/payment-info
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)

### Response 200 OK
```json
{
  "success": true,
  "data": {
    "sitterId": 12,
    "accountName": "สมชาย รักสัตว์",
    "qrCodeUrl": "https://storage.supabase.co/.../qrcodes/12/1729728000-qr.png",
    "hasPaymentInfo": true
  }
}
```
*(หากยังไม่เคยตั้งค่า: `accountName: null`, `qrCodeUrl: null`, `hasPaymentInfo: false`)*

### Response 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "success": false,
  "message": "Sitter role required"
}
```

---

## 1.2 Create or Update payment information (Sitter)

บันทึกหรืออัปเดตข้อมูลบัญชีและอัปโหลดรูปภาพ QR Code (Multipart Form-Data)

```http
POST /api/sitter/payment-info
PATCH /api/sitter/payment-info
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)
* **Content-Type:** `multipart/form-data`

### Request Body (Multipart Form-Data):
- `accountName`: (string, optional ใน PATCH, required ใน POST) ชื่อบัญชีปลายทาง เช่น `"สมชาย รักสัตว์"`
- `qrCode`: (file, optional ใน PATCH, required ใน POST) ไฟล์รูปภาพ QR Code (`.jpg`, `.jpeg`, `.png`, `.webp`, ขนาดไม่เกิน 5MB)

### Response 200 OK / 201 Created
```json
{
  "success": true,
  "message": "บันทึกข้อมูลการรับเงินสำเร็จ",
  "data": {
    "accountName": "สมชาย รักสัตว์",
    "qrCodeUrl": "https://storage.supabase.co/.../qrcodes/12/1729728000-qr.png"
  }
}
```

### Response 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid file type or size exceeds 5MB limit"
}
```

---

# 2. Payment Enhancements & Final Payment (`US 6-2 & US 6-5`)

---

## 2.1 Get payment summary with Sitter QR Code (`US 6-2`)

ดึงสรุปยอดเงินและ QR Code ของพี่เลี้ยงผู้รับงาน เพื่อนำไปแสดงใน PaymentModal ของฝั่ง Owner

```http
GET /api/bookings/{bookingID}/payments
```

* **Header:** `Authorization: Bearer <token>` (Owner หรือ Sitter ของการจองนี้)
* **Path Variables:** `bookingID` (integer)

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "waiting_payment",
    "totalPrice": 6300,
    "paymentplan": "deposit",
    "depositAmount": 1890,
    "remainingAmount": 4410,
    "sitterPaymentInfo": {
      "sitterId": 12,
      "accountName": "สมชาย รักสัตว์",
      "qrCodeUrl": "https://storage.supabase.co/.../qrcodes/12/1729728000-qr.png"
    },
    "payments": [
      {
        "paymentId": 1,
        "amount": 1890,
        "payment_stage": "deposit",
        "payment_status": "verified",
        "paid_at": "2026-10-24T10:00:00Z"
      }
    ]
  }
}
```

---

## 2.2 Submit payment slip (Deposit / Final) (`US 6-2 & US 6-5`)

แนบสลิปชำระเงิน (รองรับทั้งเงินมัดจำ `deposit`, จ่ายเต็ม `full`, และงวดสุดท้าย `final`)

```http
POST /api/payments
```

* **Header:** `Authorization: Bearer <token>` (role: `owner` ของการจองนี้)
* **Content-Type:** `multipart/form-data`

### Request Body (Multipart Form-Data):
- `bookingId`: (integer, required) รหัสการจอง เช่น `1`
- `amount`: (number, required) ยอดเงินที่ต้องชำระ (ต้องตรงกับยอดคำนวณของ Backend)
- `payment_stage`: (string, required) `"deposit"` | `"final"` | `"full"`
- `paymentType`: (string, required) `"bank_transfer"`
- `slip_image`: (file, required) ไฟล์สลิปโอนเงิน (`.jpg`, `.jpeg`, `.png`, ไม่เกิน 5MB)

### Response 201 Created (Auto-Verified หรือ รอตรวจ)
```json
{
  "status": "success",
  "data": {
    "paymentId": 2,
    "payment_status": "verified",
    "slip_image": "https://storage.supabase.co/.../slips/slip-2.jpg",
    "bookingstatus": "completed"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Final payment can only be submitted when booking is in waiting_final_payment status"
}
```

---

# 3. Booking Cancellation by Owner (`US 6-3`)

---

## 3.1 Cancel booking (Owner)

เจ้าของสัตว์เลี้ยงกดยกเลิกการจองก่อนได้รับการยืนยัน (ยกเลิกได้เฉพาะสถานะ `pending` หรือ `waiting_payment`)

```http
PATCH /api/bookings/{bookingID}/cancel
```
*(หรือ `PATCH /api/owner/bookings/{bookingID}/cancel`)*

* **Header:** `Authorization: Bearer <token>` (role: `owner` ของการจองนี้)
* **Path Variables:** `bookingID` (integer)

### Request Body:
```json
{
  "reason": "ติดธุระด่วน ไม่สะดวกตามวันเวลาดังกล่าว"
}
```
*(reason: string, optional)*

### Response 200 OK
```json
{
  "status": "success",
  "message": "ยกเลิกการจองเรียบร้อยแล้ว",
  "data": {
    "bookingId": 1,
    "bookingstatus": "cancelled"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Cannot cancel booking after it has been confirmed or deposit paid"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "You are not the owner of this booking"
}
```

---

# 4. Booking Details & Status Visual Timeline (`US 6-4`)

---

## 4.1 Get booking details & status history

ดึงรายละเอียดของการจอง พร้อมประวัติ Timeline ลำดับเหตุการณ์ทั้งหมดสำหรับแสดงผลบนหน้า My Bookings

```http
GET /api/bookings/{bookingID}
```

* **Header:** `Authorization: Bearer <token>` (Owner หรือ Sitter ของการจองนี้)
* **Path Variables:** `bookingID` (integer)

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "in_progress",
    "bookingdate": "2026-10-24T09:00:00Z",
    "starttime": "2026-10-25T10:00:00Z",
    "endtime": "2026-10-25T18:00:00Z",
    "totalPrice": 6300,
    "paymentplan": "deposit",
    "note": "น้องแพ้อาหารทะเล",
    "service": {
      "serviceId": 5,
      "serviceName": "รับฝากเลี้ยงน้องหมา",
      "serviceType": "sitting"
    },
    "sitter": {
      "sitterId": 12,
      "name": "สมชาย รักสัตว์",
      "tel": "0898765432"
    },
    "owner": {
      "ownerId": 3,
      "name": "สมหญิง มีสุข",
      "tel": "0812345678"
    },
    "timeline": [
      { "status": "pending", "time": "2026-10-24T09:00:00Z", "label": "ส่งคำขอจองบริการ" },
      { "status": "waiting_payment", "time": "2026-10-24T09:30:00Z", "label": "พี่เลี้ยงตอบรับคำขอจอง" },
      { "status": "deposit_paid", "time": "2026-10-24T10:00:00Z", "label": "ชำระเงินมัดจำ 30% เรียบร้อย" },
      { "status": "in_progress", "time": "2026-10-25T10:00:00Z", "label": "พี่เลี้ยงเริ่มดูแลสัตว์เลี้ยง" }
    ],
    "pets": [
      {
        "petId": 1,
        "name": "ถุงเงิน",
        "species": "dog",
        "breed": "Golden Retriever"
      }
    ]
  }
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Booking not found"
}
```

---

# 5. Service Status Transitions (`US 7-2`)

---

## 5.1 Update service status (Start & Complete Service)

พี่เลี้ยงกดเริ่มงาน (`start`) หรือกดจบงาน (`complete`) พร้อมระบบตรวจสอบเงื่อนไขเวลาและแผนการชำระเงิน (ใช้งานผ่าน endpoint เดิม `PATCH /api/sitter/bookings/{bookingID}`)

```http
PATCH /api/sitter/bookings/{bookingID}
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter` ของการจองนี้)
* **Path Variables:** `bookingID` (integer)
* **หมายเหตุ:** อัปเกรดจาก endpoint จัดการสถานะเดิมใน Sprint 2 โดยเพิ่ม `action: "start"` และปรับปรุง flow ของ `action: "complete"` ให้รองรับ `in_progress` และแผนการชำระเงินแบบ Deposit vs Full

### Request Body:
```json
{
  "action": "start"
}
```
*(action: `"start"` | `"complete"`)*

### กฎการเปลี่ยนสถานะ (Business Rules):
1. **`action: "start"`:**
   - สถานะปัจจุบันต้องเป็น **`confirmed`** หรือ **`deposit_paid`**
   - เวลาปัจจุบันต้องถึงวันที่กำหนดเริ่มบริการ (`now >= starttime` date)
   - ผลลัพธ์: เปลี่ยนสถานะเป็น **`in_progress`** และส่งอีเมลแจ้งเตือนถึง Pet Owner
2. **`action: "complete"`:**
   - สถานะปัจจุบันต้องเป็น **`in_progress`** (ต้องกดเริ่มงานก่อนเสมอ)
   - ผลลัพธ์:
     - ถ้าแผนการเงินเป็น `"deposit"` ➔ เปลี่ยนเป็น **`waiting_final_payment`**
     - ถ้าแผนการเงินเป็น `"full"` ➔ เปลี่ยนเป็น **`completed`**
   - ส่งอีเมลแจ้งเตือนถึง Pet Owner

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "in_progress",
    "action": "start"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Cannot complete service before starting. Current status must be in_progress."
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not the assigned sitter of this booking"
}
```

---

# 6. Pet Care Daily Reports (`US 7-3`)

---

## 6.1 Submit pet care report with photo (Sitter)

พี่เลี้ยงส่งรายงานการดูแลสัตว์เลี้ยง (บันทึกกิจกรรม, การให้อาหาร พร้อมแนบรูปถ่าย) ส่งได้เฉพาะตอนสถานะเป็น `in_progress`

```http
POST /api/bookings/{bookingID}/reports
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter` ของการจองนี้)
* **Path Variables:** `bookingID` (integer)
* **Content-Type:** `multipart/form-data`

### Request Body (Multipart Form-Data):
- `reportDetail`: (string, required) บันทึกกิจกรรม เช่น `"น้องทานอาหารเม็ดหมดเกลี้ยง อารมณ์ดี วิ่งเล่นรอบสวนครับ"`
- `photo`: (file, optional) ไฟล์รูปถ่ายกิจกรรม (`.jpg`, `.jpeg`, `.png`, `.webp`, ไม่เกิน 5MB)

### Response 201 Created
```json
{
  "status": "success",
  "data": {
    "reportId": 1,
    "bookingId": 1,
    "reportDetail": "น้องทานอาหารเม็ดหมดเกลี้ยง อารมณ์ดี วิ่งเล่นรอบสวนครับ",
    "photoUrl": "https://storage.supabase.co/.../care-reports/1/1729728000-photo.jpg",
    "createdAt": "2026-10-25T12:30:00.000Z"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Care report can only be submitted during active service (status: in_progress)"
}
```

---

## 6.2 Get pet care reports for a booking

ดึงประวัติรายงานการดูแลทั้งหมดของการจอง เพื่อนำไปแสดงผลเป็น Timeline บนหน้าของ Pet Owner และ Pet Sitter

```http
GET /api/bookings/{bookingID}/reports
```

* **Header:** `Authorization: Bearer <token>` (Owner หรือ Sitter ของการจองนี้)
* **Path Variables:** `bookingID` (integer)

### Response 200 OK
```json
{
  "status": "success",
  "data": [
    {
      "reportId": 1,
      "bookingId": 1,
      "reportDetail": "น้องทานอาหารเช้าเรียบร้อยครับ",
      "photoUrl": "https://storage.supabase.co/.../care-reports/1/breakfast.jpg",
      "createdAt": "2026-10-25T08:30:00.000Z"
    },
    {
      "reportId": 2,
      "bookingId": 1,
      "reportDetail": "พาออกไปเดินเล่นที่สวนสาธารณะ ร่าเริงมากครับ",
      "photoUrl": "https://storage.supabase.co/.../care-reports/1/walk.jpg",
      "createdAt": "2026-10-25T15:00:00.000Z"
    }
  ]
}
```

---

# 7. Customer Reviews & Ratings (`US 7-1`)

---

## 7.1 Create booking review (Owner)

เจ้าของสัตว์เลี้ยงส่งรีวิวและให้คะแนน 1-5 ดาว (ส่งได้เฉพาะเมื่อการจองเสร็จสิ้น `completed` และรีวิวได้เพียงครั้งเดียวต่อหนึ่งการจอง)

```http
POST /api/reviews
```

* **Header:** `Authorization: Bearer <token>` (role: `owner` ของการจองนี้)

### Request Body:
```json
{
  "bookingId": 1,
  "rating": 5,
  "comment": "พี่เลี้ยงดูแลน้องดีมาก มีรูปถ่ายอัปเดตสม่ำเสมอ แนะนำเลยครับ!"
}
```

### หมายเหตุ:
- `bookingId`: (integer, required)
- `rating`: (integer, required, 1 - 5)
- `comment`: (string, optional)
- ระบบจะคำนวณคะแนนเฉลี่ย (`averageRating`) และจำนวนรีวิว (`reviewCount`) ของพี่เลี้ยงใหม่อัตโนมัติ

### Response 201 Created
```json
{
  "status": "success",
  "data": {
    "reviewId": 1,
    "bookingId": 1,
    "rating": 5,
    "comment": "พี่เลี้ยงดูแลน้องดีมาก มีรูปถ่ายอัปเดตสม่ำเสมอ แนะนำเลยครับ!"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Rating must be an integer between 1 and 5"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Booking not completed or already reviewed"
}
```

---

## 7.2 Get sitter reviews list (Public)

ดึงรายการรีวิวทั้งหมดของพี่เลี้ยงคนนั้น เพื่อแสดงผลบนหน้าโปรไฟล์สาธารณะ

```http
GET /api/sitters/{sitterID}/reviews
```

* **Header:** none (Public)
* **Path Variables:** `sitterID` (integer)

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "sitterId": 12,
    "averageRating": 4.9,
    "reviewCount": 18,
    "reviews": [
      {
        "reviewId": 1,
        "rating": 5,
        "comment": "พี่เลี้ยงใจดีและเอาใจใส่มากครับ",
        "reviewerName": "สมหญิง",
        "createdAt": "2026-10-25T19:00:00.000Z"
      }
    ]
  }
}
```
