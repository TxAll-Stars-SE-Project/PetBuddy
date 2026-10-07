# PetBuddy API Documentation (Sprint 1 & Sprint 2)

> Changelog:
> - v2.2: เพิ่มเอกสาร API ฝั่ง Sprint 1 ครบถ้วน (Auth, User Profile, Pet Profile, Health Check)
> - v2.1: เปลี่ยนคำ service_type เป็น walking/sitting/boarding/grooming/daycare + เพิ่มฟิลด์ species ใน services + เพิ่ม filter petType ใน §1.1

Base URL: `http://localhost:5000`
Auth: `Header Authorization: Bearer <token>` (เฉพาะ endpoint ที่ระบุ)
Envelope: สำเร็จ = `{ "status": "success", "data": ... }` หรือ `{ "success": true, ... }` / ผิดพลาด = `{ "status": "error", "message": "..." }`

## Enums (คำต้องตรงกันทั้งทีม)
- role: `owner` | `sitter`
- gender: `male` | `female`
- booking_status: `pending` | `waiting_payment` | `deposit_paid` | `confirmed` | `rejected` | `cancelled` | `waiting_final_payment` | `completed`
- service_type: `walking` | `sitting` | `boarding` | `grooming` | `daycare`
- species: `dog` | `cat` | `bird` | `exotic`
- payment_plan: `full` | `deposit`
- payment_stage: `deposit` | `final` | `full`
- payment_status: `pending_verifying` | `verified` | `rejected`

## Booking Status Transition
| จาก | เหตุการณ์ | ไป |
|---|---|---|
| pending | sitter accept | waiting_payment |
| pending | sitter reject | rejected |
| pending / waiting_payment / deposit_paid / confirmed | owner cancel | cancelled |
| waiting_payment | verify สลิป deposit ผ่าน | deposit_paid → confirmed (อัตโนมัติ) |
| confirmed | sitter complete (จบงาน) | waiting_final_payment |
| waiting_final_payment | verify สลิป final ผ่าน | completed |

---

# ==========================================
# PART 1: SPRINT 1 APIs (Core & Account Management)
# ==========================================

# S1. Authentication (`/api/auth`)

## S1.1 Register user (Owner / Sitter)

POST /api/auth/register

Header: none (public, require: false)

Request Body:
{
  "username": "somchai",
  "email": "somchai@example.com",
  "password": "Password123",
  "role": "owner",
  "tel": "0812345678",
  "province": "กรุงเทพมหานคร",
  "district": "จตุจักร",
  "subdistrict": "จันทรเกษม",
  "postalCode": "10900",
  "address": "123/45 ซอยพหลโยธิน 32",
  "thaiId": "1234567890123",
  "experience": "เลี้ยงสุนัขมา 5 ปี"
}

หมายเหตุ:
- role: "owner" หรือ "sitter"
- ถ้าเลือก role เป็น "sitter" จำเป็นต้องระบุ thaiId (ต้องผ่านการตรวจเลข 13 หลัก) และระบุ experience (ทางเลือก)
- เบอร์โทร tel จะถูก normalize อัตโนมัติ

Response 201 Created
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "userId": 1,
    "username": "somchai",
    "email": "somchai@example.com",
    "role": "owner"
  }
}

Response 400 Bad Request
{
  "error": "VALIDATION_ERROR",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    { "field": "email", "message": "รูปแบบอีเมลไม่ถูกต้อง" },
    { "field": "password", "message": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }
  ]
}

Response 409 Conflict
{
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "อีเมลนี้ถูกใช้งานไปแล้ว"
}

## S1.2 Login

POST /api/auth/login

Header: none (public, require: false)

Request Body:
{
  "email": "somchai@example.com",
  "password": "Password123",
  "rememberMe": true
}

Response 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "username": "somchai",
    "email": "somchai@example.com",
    "role": "owner"
  }
}

Response 400 Bad Request
{
  "error": "MISSING_FIELDS",
  "message": "Email and password are required"
}

Response 401 Unauthorized
{
  "error": "INVALID_CREDENTIALS"
}

Response 403 Forbidden
{
  "error": "ACCOUNT_DEACTIVATED",
  "message": "บัญชีนี้ถูกปิดใช้งานแล้ว"
}

## S1.3 Logout

POST /api/auth/logout

Header Authorization: Bearer <token>

Response 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}

Response 401 Unauthorized
{
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}

## S1.4 Forgot password

POST /api/auth/forgot-password

Header: none (public, require: false)

Request Body:
{
  "email": "somchai@example.com"
}

Response 200 OK
{
  "success": true,
  "message": "If that email exists, a reset link has been sent."
}

หมายเหตุ: ตอบ 200 เสมอเพื่อป้องกัน account enumeration

Response 400 Bad Request
{
  "error": "MISSING_FIELDS"
}

## S1.5 Reset password

POST /api/auth/reset-password

Header: none (public, require: false)

Request Body:
{
  "token": "d7a4f9b23c4a5b6c...",
  "newPassword": "NewPassword123"
}

Response 200 OK
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}

Response 400 Bad Request
{
  "error": "TOKEN_INVALID"
}
(หรือ TOKEN_EXPIRED / SAME_AS_OLD_PASSWORD / INVALID_PASSWORD)

## S1.6 Deactivate account (Soft delete)

DELETE /api/auth/account

Header Authorization: Bearer <token>

Request Body:
{
  "password": "Password123"
}

Response 200 OK
{
  "success": true,
  "message": "ปิดบัญชีเรียบร้อยแล้ว"
}

Response 400 Bad Request
{
  "error": "MISSING_FIELDS",
  "message": "กรุณากรอกรหัสผ่าน"
}

Response 401 Unauthorized
{
  "error": "INVALID_PASSWORD",
  "message": "รหัสผ่านไม่ถูกต้อง"
}

Response 409 Conflict
{
  "error": "ALREADY_DEACTIVATED",
  "message": "บัญชีนี้ถูกปิดใช้งานไปแล้ว"
}

---

# S2. Users & Profile (`/api/users`)

## S2.1 Get my profile

GET /api/users/me

Header Authorization: Bearer <token>

Response 200 OK (Owner role)
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "somchai",
    "email": "somchai@example.com",
    "tel": "0812345678",
    "province": "กรุงเทพมหานคร",
    "district": "จตุจักร",
    "subdistrict": "จันทรเกษม",
    "postalCode": "10900",
    "address": "123/45 ซอยพหลโยธิน 32",
    "role": "owner",
    "pets": [
      {
        "petid": 1,
        "name": "ถุงเงิน",
        "species": "cat",
        "breed": "Scottish Fold",
        "gender": "male",
        "birthDate": "2022-05-15",
        "age": 2,
        "weight": 4.5,
        "allergy": "อาหารทะเล",
        "imageUrl": "https://supabase.../pets/1.jpg"
      }
    ]
  }
}

Response 200 OK (Sitter role)
{
  "success": true,
  "data": {
    "userId": 2,
    "username": "sitter_jane",
    "email": "jane@example.com",
    "tel": "0898765432",
    "province": "กรุงเทพมหานคร",
    "district": "พญาไท",
    "subdistrict": "สามเสนใน",
    "postalCode": "10400",
    "address": "99 ถนนพหลโยธิน",
    "role": "sitter",
    "thaiId": "1234567890123",
    "experience": "มีประสบการณ์ดูแลสัตว์เลี้ยง 3 ปี"
  }
}

Response 401 Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}

## S2.2 Update my profile

PUT /api/users/me

Header Authorization: Bearer <token>

Request Body:
{
  "username": "somchai_updated",
  "tel": "0823456789",
  "province": "กรุงเทพมหานคร",
  "district": "ลาดพร้าว",
  "subdistrict": "ลาดพร้าว",
  "postalCode": "10230",
  "address": "55/1 ถนนลาดพร้าว",
  "experience": "เลี้ยงสุนัขมา 6 ปี"
}

หมายเหตุ: ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข (Partial update), ฟิลด์ experience แก้ไขได้เฉพาะ role sitter

Response 200 OK
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "somchai_updated",
    "email": "somchai@example.com",
    "tel": "0823456789",
    "province": "กรุงเทพมหานคร",
    "district": "ลาดพร้าว",
    "subdistrict": "ลาดพร้าว",
    "postalCode": "10230",
    "address": "55/1 ถนนลาดพร้าว",
    "role": "owner",
    "pets": []
  }
}

Response 400 Bad Request
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    { "field": "tel", "message": "เบอร์โทรศัพท์ไม่ถูกต้อง" }
  ]
}

Response 401 Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}

## S2.3 Get all users

GET /api/users

Header: none (Public / Admin)

Response 200 OK
{
  "success": true,
  "data": [
    {
      "userid": 1,
      "username": "somchai",
      "email": "somchai@example.com",
      "tel": "0812345678",
      "province": "กรุงเทพมหานคร",
      "is_active": true,
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ]
}

---

# S3. Pet Profile Management (`/api/pets`)

## S3.1 Create pet profile

POST /api/pets
(รองรับ POST /api/pets/add ด้วย)

Header Authorization: Bearer <token> (role: owner)
Content-Type: multipart/form-data หรือ application/json

Form Data / Request Body:
- name: "ถุงเงิน" (string, required, สูงสุด 50 ตัวอักษร)
- species: "cat" (string, optional, สูงสุด 50 ตัวอักษร เช่น dog, cat, bird, exotic)
- breed: "Scottish Fold" (string, optional, สูงสุด 50 ตัวอักษร)
- gender: "male" (string, optional, เช่น male หรือ female)
- b_date: "2022-05-15" (string YYYY-MM-DD, optional) หรือ birthday หรือ age (number, 0-100)
- weight: 4.5 (number, optional, หน่วย kg)
- allergy: "อาหารทะเล" (string, optional)
- image: <File> (binary, optional รูปภาพสัตว์เลี้ยง อัปโหลดไปยัง Supabase Storage อัตโนมัติ) หรือ photo / image_url

Response 201 Created
{
  "success": true,
  "petid": 1,
  "ownerid": 1,
  "name": "ถุงเงิน",
  "species": "cat",
  "breed": "Scottish Fold",
  "gender": "male",
  "b_date": "2022-05-15T00:00:00.000Z",
  "weight": 4.5,
  "allergy": "อาหารทะเล",
  "image_url": "https://<supabase-storage-url>/pets/1-1726000000.jpg"
}

Response 400 Bad Request
{
  "error": "VALIDATION_ERROR",
  "message": "กรุณากรอกชื่อสัตว์เลี้ยง"
}

Response 401 Unauthorized
{
  "error": "UNAUTHORIZED",
  "message": "กรุณาเข้าสู่ระบบ"
}

Response 403 Forbidden
{
  "error": "FORBIDDEN",
  "message": "Only pet owner can manage pets"
}

## S3.2 Update pet profile

PUT /api/pets/{id}
(รองรับ PATCH /api/pets/{id} ด้วย)

Header Authorization: Bearer <token> (role: owner)
Path Variables:
  - id : Pet ID (ตัวเลข)
Content-Type: multipart/form-data หรือ application/json

Form Data / Request Body (ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข):
- name, species, breed, gender, b_date, weight, allergy, image

Response 200 OK
{
  "success": true,
  "petid": 1,
  "ownerid": 1,
  "name": "ถุงเงินสุดหล่อ",
  "species": "cat",
  "breed": "Scottish Fold",
  "gender": "male",
  "b_date": "2022-05-15T00:00:00.000Z",
  "weight": 4.8,
  "allergy": "อาหารทะเล",
  "image_url": "https://<supabase-storage-url>/pets/1-1726005000.jpg"
}

Response 400 Bad Request
{
  "error": "INVALID_PET_ID",
  "message": "รหัสสัตว์เลี้ยงต้องเป็นตัวเลขจำนวนเต็มบวก"
}

Response 401 Unauthorized
{
  "error": "UNAUTHORIZED",
  "message": "กรุณาเข้าสู่ระบบ"
}

Response 403 Forbidden
{
  "error": "FORBIDDEN",
  "message": "คุณไม่ใช่เจ้าของสัตว์เลี้ยงนี้"
}

Response 404 Not Found
{
  "error": "PET_NOT_FOUND",
  "message": "ไม่พบข้อมูลสัตว์เลี้ยง"
}

## S3.3 Delete pet profile

DELETE /api/pets/{id}

Header Authorization: Bearer <token> (role: owner)
Path Variables:
  - id : Pet ID (ตัวเลข)

Response 204 No Content

Response 400 Bad Request
{
  "success": false,
  "error": "INVALID_PET_ID",
  "message": "รหัสสัตว์เลี้ยงต้องเป็นตัวเลขจำนวนเต็มบวก"
}

Response 401 Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}

Response 403 Forbidden
{
  "error": "FORBIDDEN",
  "message": "คุณไม่ใช่เจ้าของสัตว์เลี้ยงนี้"
}

Response 404 Not Found
{
  "error": "PET_NOT_FOUND",
  "message": "ไม่พบข้อมูลสัตว์เลี้ยง"
}

---

# S4. System Health (`/api/health`)

## S4.1 System health check

GET /api/health

Header: none (public)

Response 200 OK
{
  "status": "ok",
  "timestamp": "2026-10-07T16:50:00.000Z"
}

---

# ==========================================
# PART 2: SPRINT 2 APIs (Sitters, Bookings & Operations)
# ==========================================

# 1. Sitter & Search (Public)

## 1.1 Get all pet sitters (with filter)

GET /api/sitters/

Header: none (public, require: false)

Query Examples:
GET /api/sitters/
GET /api/sitters/?category=sitting&price=500
GET /api/sitters/?category=sitting&petType=cat&price=500

Parameters:
  - category : กรองตาม service_type (walking/sitting/boarding/grooming/daycare)
  - petType  : กรองตามชนิดสัตว์ที่บริการนั้นรับ (species)
  - price    : กรองราคาสูงสุด

Response 200 OK
{
  "status": "success",
  "data": [
    { "sitterId": 1, "username": "somchai", "serviceType": "sitting", "species": ["dog", "cat"], "rating": 4.8 }
  ]
}

## 1.2 Get sitter profile

GET /api/sitters/{sitterID}

Path Variables:
  - sitterID

Query Examples:
GET /api/sitters/1

Response 200 OK
{
  "status": "success",
  "data": { "sitterId": 1, "username": "somchai", "province": "Bangkok", "rating": 4.8 }
}

Response 404 Not Found
{
  "status": "error",
  "message": "Sitter not found"
}

## 1.3 Get sitter's services

GET /api/sitters/{sitterID}/services

Path Variables:
  - sitterID

Query Examples:
GET /api/sitters/1/services

Response 200 OK
{
  "status": "success",
  "data": [
    { "serviceId": 1, "serviceName": "รับเลี้ยงแมวข้ามคืน", "serviceType": "sitting", "species": ["dog", "cat"], "price": 350, "description": "..." }
  ]
}

Response 404 Not Found
{
  "status": "error",
  "message": "Sitter not found"
}

## 1.4 Get sitter's reviews

GET /api/sitters/{sitterID}/reviews

Path Variables:
  - sitterID

Query Examples:
GET /api/sitters/1/reviews

Response 200 OK
{
  "status": "success",
  "data": [
    { "reviewId": 1, "rating": 5, "comment": "ดูแลดีมาก", "ownerName": "tanin", "createdAt": "2026-09-01T10:00:00Z" }
  ]
}

Response 404 Not Found
{
  "status": "error",
  "message": "Sitter not found"
}

## 1.5 Get sitter's busy slots

GET /api/sitters/{sitterID}/busy-slots?date={selectedDate}

Path Variables:
  - sitterID

Query Examples:
GET /api/sitters/1/busy-slots?date=2026-09-20

Response 200 OK
{
  "status": "success",
  "data": {
    "date": "2026-09-20",
    "busySlots": [
      { "starttime": "2026-09-20T09:00:00Z", "endtime": "2026-09-20T12:00:00Z" }
    ]
  }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Invalid or missing date parameter"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Sitter not found"
}

---

# 2. Booking (Pet Owner)

## 2.1 Get my pets

GET /api/pets/my-pets

Header Authorization: Bearer <token>

Response 200 OK
{
  "status": "success",
  "data": [
    { "petId": 1, "petName": "เหมียว", "petType": "cat", "age": 2 }
  ]
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

## 2.2 Create booking request (multi-pet)

POST /api/bookings

Header Authorization: Bearer <token> (role: owner)

Request Body:
{
  "sitterId": 1,
  "serviceId": 1,
  "starttime": "2026-09-20T09:00:00Z",
  "endtime": "2026-09-20T18:00:00Z",
  "paymentplan": "deposit",
  "note": "ฝากดูแลหน่อยครับ",
  "pets": [
    { "petId": 1, "petNote": "แมวขี้อาย" },
    { "petId": 2, "petNote": null }
  ]
}

หมายเหตุ: totalPrice/depositAmount คำนวณฝั่ง Backend เท่านั้น (rate * hours * จำนวนペット)

Response 201 Created
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "pending",
    "totalPrice": 6300,
    "depositAmount": 1890,
    "pets": [
      { "petId": 1, "petName": "เหมียว", "petNote": "แมวขี้อาย" },
      { "petId": 2, "petName": "หมาหมาน", "petNote": null }
    ]
  }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Validation failed"
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Only pet owner can create booking"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Sitter, service or pet not found"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Time slot overlaps with an existing booking"
}

## 2.3 Get my bookings (owner, multi-pet)

GET /api/owner/bookings

Header Authorization: Bearer <token> (role: owner)

Query Examples:
GET /api/owner/bookings
GET /api/owner/bookings?status=waiting_payment

Response 200 OK
{
  "status": "success",
  "data": [
    {
      "bookingId": 1,
      "sitterName": "somchai",
      "serviceName": "รับเลี้ยงแมว",
      "starttime": "2026-09-20T09:00:00Z",
      "endtime": "2026-09-20T18:00:00Z",
      "bookingstatus": "waiting_payment",
      "totalPrice": 6300,
      "pets": [
        { "petId": 1, "petName": "เหมียว", "petNote": "แมวขี้อาย" }
      ]
    }
  ]
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

## 2.4 Cancel booking (owner)

PATCH /api/owner/bookings/{bookingID}/cancel

Header Authorization: Bearer <token> (role: owner)

Path Variables:
  - bookingID

Query Examples:
PATCH /api/owner/bookings/1/cancel

Response 200 OK
{
  "status": "success",
  "data": { "bookingId": 1, "bookingstatus": "cancelled" }
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Not the owner of this booking"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Booking not found"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Booking cannot be cancelled in current status"
}

---

# 3. Payment

## 3.1 Get payment summary

GET /api/bookings/{bookingID}/payments

Header Authorization: Bearer <token>

Path Variables:
  - bookingID

Query Examples:
GET /api/bookings/1/payments

Response 200 OK
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "waiting_payment",
    "totalPrice": 6300,
    "paymentplan": "deposit",
    "depositAmount": 1890,
    "remainingAmount": 4410,
    "payments": [
      { "paymentId": 1, "amount": 1890, "payment_stage": "deposit", "payment_status": "pending_verifying", "paid_at": "2026-09-10T14:00:00Z" }
    ]
  }
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Not a participant of this booking"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Booking not found"
}

## 3.2 Submit payment slip

POST /api/payments

Header Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body (form-data):
bookingId: 1
amount: 1890
payment_stage: "deposit"
paymentType: "bank_transfer"
slip_image: <file>

หมายเหตุ: amount ต้องตรงกับยอดที่ Backend คำนวณ (deposit ครั้งแรก / ส่วนที่เหลือตอน final)

Response 201 Created
{
  "status": "success",
  "data": {
    "paymentId": 1,
    "payment_status": "pending_verifying",
    "slip_image": "https://storage.../slip-1.jpg"
  }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Invalid file type or size / missing fields"
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Booking not found"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Amount mismatch or stage already paid"
}

## 3.3 Verify payment slip (sitter)

PATCH /api/bookings/{bookingID}/verify-payment

Header Authorization: Bearer <token> (role: sitter ของ booking นี้)

Path Variables:
  - bookingID

Request Body:
{
  "paymentId": 1,
  "action": "verify"
}
(action: "verify" | "reject")

ผลข้างเคียง: verify deposit → booking เป็น deposit_paid แล้ว confirmed อัตโนมัติ / verify final → booking เป็น completed

Response 200 OK
{
  "status": "success",
  "data": { "paymentId": 1, "payment_status": "verified", "bookingstatus": "deposit_paid" }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Invalid action"
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Not the assigned sitter of this booking"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Booking or payment not found"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Payment already verified or rejected"
}

---

# 4. Sitter Management

## 4.1 Get my services

GET /api/sitter/services/me

Header Authorization: Bearer <token> (role: sitter)

Response 200 OK
{
  "status": "success",
  "data": [
    { "serviceId": 1, "serviceName": "รับเลี้ยงแมวข้ามคืน", "serviceType": "sitting", "species": ["dog", "cat"], "price": 350, "description": "..." }
  ]
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Sitter role required"
}

## 4.2 Create service

POST /api/sitter/services/

Header Authorization: Bearer <token> (role: sitter)

Request Body:
{
  "serviceName": "รับเลี้ยงแมวข้ามคืน",
  "serviceType": "sitting",
  "species": ["dog", "cat"],
  "price": 350,
  "description": "มีประสบการณ์ 5 ปี"
}

Response 201 Created
{
  "status": "success",
  "data": { "serviceId": 1, "serviceName": "รับเลี้ยงแมวข้ามคืน", "species": ["dog", "cat"], "price": 350 }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Validation failed"
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Sitter role required"
}

## 4.3 Edit service

PATCH /api/sitter/services/{serviceID}

Header Authorization: Bearer <token> (role: sitter)

Path Variables:
  - serviceID

Request Body:
{
  "price": 400,
  "serviceType": "boarding",
  "species": ["cat"],
  "description": "อัปเดตแล้ว"
}

Response 200 OK
{
  "status": "success",
  "data": { "serviceId": 1, "price": 400, "description": "อัปเดตแล้ว" }
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Not the owner of this service"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Service not found"
}

## 4.4 Delete service

DELETE /api/sitter/services/{serviceID}

Header Authorization: Bearer <token> (role: sitter)

Path Variables:
  - serviceID

Query Examples:
DELETE /api/sitter/services/1

Response 200 OK
{
  "status": "success",
  "data": { "serviceId": 1 }
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Not the owner of this service"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Service not found"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Service has active bookings"
}

## 4.5 Get my bookings (sitter, multi-pet)

GET /api/sitter/bookings

Header Authorization: Bearer <token> (role: sitter)

Query Examples:
GET /api/sitter/bookings
GET /api/sitter/bookings?status=pending

Response 200 OK
{
  "status": "success",
  "data": [
    {
      "bookingId": 1,
      "ownerName": "tanin",
      "serviceName": "รับเลี้ยงแมว",
      "starttime": "2026-09-20T09:00:00Z",
      "endtime": "2026-09-20T18:00:00Z",
      "bookingstatus": "pending",
      "pets": [
        { "petId": 1, "petName": "เหมียว", "petNote": "แมวขี้อาย" },
        { "petId": 2, "petName": "หมาหมาน", "petNote": null }
      ]
    }
  ]
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Sitter role required"
}

## 4.6 Update booking status (accept / reject / complete)

PATCH /api/sitter/bookings/{bookingID}

Header Authorization: Bearer <token> (role: sitter)

Path Variables:
  - bookingID

Request Body:
{
  "action": "accept"
}
(action: "accept" | "reject" | "complete")

ผลของ action:
- accept  : pending → waiting_payment
- reject  : pending → rejected
- complete: confirmed → waiting_final_payment

Response 200 OK
{
  "status": "success",
  "data": { "bookingId": 1, "bookingstatus": "waiting_payment" }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Invalid action"
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Not the assigned sitter of this booking"
}

Response 404 Not Found
{
  "status": "error",
  "message": "Booking not found"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Invalid status transition"
}

---

# 5. Review (Optional — นอก scope Sprint 2, เผื่อ Sprint หน้า)

## 5.1 Create review

POST /api/reviews

Header Authorization: Bearer <token> (role: owner)

Request Body:
{
  "bookingId": 1,
  "rating": 5,
  "comment": "ดูแลดีมาก"
}

Response 201 Created
{
  "status": "success",
  "data": { "reviewId": 1, "rating": 5, "comment": "ดูแลดีมาก" }
}

Response 400 Bad Request
{
  "status": "error",
  "message": "Rating must be 1-5"
}

Response 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}

Response 403 Forbidden
{
  "status": "error",
  "message": "Only the owner of this booking can review"
}

Response 409 Conflict
{
  "status": "error",
  "message": "Booking not completed or already reviewed"
}