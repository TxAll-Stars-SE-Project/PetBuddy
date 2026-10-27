# PetBuddy API Documentation (Sprint 1, Sprint 2 & Sprint 3)

> Changelog:
> - v3.0: เพิ่มเอกสาร API ฝั่ง Sprint 3 ครบถ้วน (§ PART 3: SPRINT 3 APIs) + เพิ่ม enum in_progress ใน booking_status + อัปเดต Booking Status Transition Table
> - v2.2: เพิ่มเอกสาร API ฝั่ง Sprint 1 ครบถ้วน (Auth, User Profile, Pet Profile, Health Check)
> - v2.1: เปลี่ยนคำ service_type เป็น walking/sitting/boarding/grooming/daycare + เพิ่มฟิลด์ species ใน services + เพิ่ม filter petType ใน §1.1

Base URL: `http://localhost:5000`
Auth: `Header Authorization: Bearer <token>` (เฉพาะ endpoint ที่ระบุ)
Envelope: สำเร็จ = `{ "status": "success", "data": ... }` หรือ `{ "success": true, ... }` / ผิดพลาด = `{ "status": "error", "message": "..." }`

## Enums (คำต้องตรงกันทั้งทีม)
- role: `owner` | `sitter`
- gender: `male` | `female`
- booking_status: `pending` | `waiting_payment` | `deposit_paid` | `confirmed` | `in_progress` | `rejected` | `cancelled` | `waiting_final_payment` | `completed`
- service_type: `walking` | `sitting` | `boarding` | `grooming` | `daycare`
- species: `dog` | `cat` | `bird` | `exotic`
- payment_plan: `full` | `deposit`
- payment_stage: `deposit` | `final` | `full`
- payment_status: `pending_verifying` | `verified` | `rejected`

## Booking Status Transition
| จาก | เหตุการณ์ | ไป | หมายเหตุ |
|---|---|---|---|
| `pending` | Sitter Accept | `waiting_payment` | พี่เลี้ยงรับงาน รอการชำระเงิน |
| `pending` | Sitter Reject | `rejected` | พี่เลี้ยงปฏิเสธคำขอ |
| `pending` / `waiting_payment` | Owner Cancel (US 6-3) | `cancelled` | ยกเลิกได้ก่อนคอนเฟิร์ม ไม่ต้องคืนเงิน |
| `waiting_payment` | Verify สลิป deposit ผ่าน | `deposit_paid` | ชำระมัดจำ 30% ล็อกคิวงานแล้ว |
| `waiting_payment` | Verify สลิป full ผ่าน | `confirmed` | ชำระเต็มจำนวน 100% ล็อกคิวงานแล้ว |
| `confirmed` / `deposit_paid` | Sitter Start Service (US 7-2) | `in_progress` | พี่เลี้ยงกด "เริ่มงาน" เมื่อถึงวันนัดหมาย |
| `in_progress` | Sitter Complete (แผน deposit) | `waiting_final_payment` | งานเสร็จ รอ Owner จ่าย 70% ที่เหลือ |
| `in_progress` | Sitter Complete (แผน full) | `completed` | งานเสร็จและจ่ายครบแล้ว จบงานสมบูรณ์ |
| `waiting_final_payment` | Verify สลิป final ผ่าน (US 6-5) | `completed` | ชำระงวดสุดท้าย 70% เรียบร้อย ปิดงาน |
| `completed` | Owner Review (US 7-1) | `completed` | เขียนรีวิว 1-5 ดาว |

---

# ==========================================
# PART 1: SPRINT 1 APIs (Core & Account Management)
# ==========================================

# S1. Authentication (`/api/auth`)

---

## S1.1 Register user (Owner / Sitter)

ลงทะเบียนผู้ใช้ใหม่เข้าสู่ระบบ รองรับทั้ง Pet Owner และ Pet Sitter

```http
POST /api/auth/register
```

* **Header:** none (public, require: false)
* **Content-Type:** `application/json`

### Request Body:
```json
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
```

### หมายเหตุ:
- `role`: `"owner"` หรือ `"sitter"`
- ถ้าเลือก `role` เป็น `"sitter"` จำเป็นต้องระบุ `thaiId` (ต้องผ่านการตรวจเลข 13 หลัก) และระบุ `experience` (ทางเลือก)
- เบอร์โทร `tel` จะถูก normalize อัตโนมัติ

### Response 201 Created
```json
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
```

### Response 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    { "field": "email", "message": "รูปแบบอีเมลไม่ถูกต้อง" },
    { "field": "password", "message": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }
  ]
}
```

### Response 409 Conflict
```json
{
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "อีเมลนี้ถูกใช้งานไปแล้ว"
}
```

---

## S1.2 Login

เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน เพื่อรับ JWT Token

```http
POST /api/auth/login
```

* **Header:** none (public, require: false)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "email": "somchai@example.com",
  "password": "Password123",
  "rememberMe": true
}
```

### Response 200 OK
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "username": "somchai",
    "email": "somchai@example.com",
    "role": "owner"
  }
}
```

### Response 400 Bad Request
```json
{
  "error": "MISSING_FIELDS",
  "message": "Email and password are required"
}
```

### Response 401 Unauthorized
```json
{
  "error": "INVALID_CREDENTIALS"
}
```

### Response 403 Forbidden
```json
{
  "error": "ACCOUNT_DEACTIVATED",
  "message": "บัญชีนี้ถูกปิดใช้งานแล้ว"
}
```

---

## S1.3 Logout

ออกจากระบบ (เคลียร์ Session / Token ในฝั่ง Client)

```http
POST /api/auth/logout
```

* **Header:** `Authorization: Bearer <token>`

### Response 200 OK
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Response 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}
```

---

## S1.4 Forgot password

ร้องขอลิงก์สำหรับรีเซ็ตรหัสผ่านผ่านทางอีเมล

```http
POST /api/auth/forgot-password
```

* **Header:** none (public, require: false)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "email": "somchai@example.com"
}
```

### Response 200 OK
```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent."
}
```
*(หมายเหตุ: ตอบ 200 เสมอเพื่อป้องกัน account enumeration)*

### Response 400 Bad Request
```json
{
  "error": "MISSING_FIELDS"
}
```

---

## S1.5 Reset password

ตั้งรหัสผ่านใหม่โดยใช้ Reset Token ที่ได้รับจากอีเมล

```http
POST /api/auth/reset-password
```

* **Header:** none (public, require: false)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "token": "d7a4f9b23c4a5b6c...",
  "newPassword": "NewPassword123"
}
```

### Response 200 OK
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

### Response 400 Bad Request
```json
{
  "error": "TOKEN_INVALID"
}
```
*(หรือ `TOKEN_EXPIRED` / `SAME_AS_OLD_PASSWORD` / `INVALID_PASSWORD`)*

---

## S1.6 Deactivate account (Soft delete)

ปิดการใช้งานบัญชีผู้ใช้ (Soft Delete โดยการตั้ง `is_active = false`)

```http
DELETE /api/auth/account
```

* **Header:** `Authorization: Bearer <token>`
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "password": "Password123"
}
```

### Response 200 OK
```json
{
  "success": true,
  "message": "ปิดบัญชีเรียบร้อยแล้ว"
}
```

### Response 400 Bad Request
```json
{
  "error": "MISSING_FIELDS",
  "message": "กรุณากรอกรหัสผ่าน"
}
```

### Response 401 Unauthorized
```json
{
  "error": "INVALID_PASSWORD",
  "message": "รหัสผ่านไม่ถูกต้อง"
}
```

### Response 409 Conflict
```json
{
  "error": "ALREADY_DEACTIVATED",
  "message": "บัญชีนี้ถูกปิดใช้งานไปแล้ว"
}
```

---

# S2. Users & Profile (`/api/users`)

---

## S2.1 Get my profile

ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่กำลังล็อกอินอยู่ (คืนข้อมูลสัตว์เลี้ยงสำหรับ Owner และคืนข้อมูลประสบการณ์/บัตรประชาชนสำหรับ Sitter)

```http
GET /api/users/me
```

* **Header:** `Authorization: Bearer <token>`

### Response 200 OK (Owner role)
```json
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
```

### Response 200 OK (Sitter role)
```json
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
```

### Response 401 Unauthorized
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}
```

---

## S2.2 Update my profile

แก้ไขข้อมูลโปรไฟล์ของผู้ใช้ตนเอง (Partial update)

```http
PUT /api/users/me
```

* **Header:** `Authorization: Bearer <token>`
* **Content-Type:** `application/json`

### Request Body:
```json
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
```

### หมายเหตุ:
- ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข (Partial update)
- ฟิลด์ `experience` แก้ไขได้เฉพาะ role `sitter`

### Response 200 OK
```json
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
```

### Response 400 Bad Request
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    { "field": "tel", "message": "เบอร์โทรศัพท์ไม่ถูกต้อง" }
  ]
}
```

### Response 401 Unauthorized
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}
```

---

## S2.3 Get all users

ดึงรายการผู้ใช้ทั้งหมดในระบบ (สำหรับตรวจสอบหรือใช้งานระดับแอดมิน)

```http
GET /api/users
```

* **Header:** none (Public / Admin)

### Response 200 OK
```json
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
```

---

# S3. Pet Profile Management (`/api/pets`)

---

## S3.1 Create pet profile

เพิ่มข้อมูลสัตว์เลี้ยงตัวใหม่ของ Pet Owner พร้อมอัปโหลดรูปภาพ

```http
POST /api/pets
```
*(รองรับ `POST /api/pets/add` ด้วย)*

* **Header:** `Authorization: Bearer <token>` (role: `owner`)
* **Content-Type:** `multipart/form-data` หรือ `application/json`

### Form Data / Request Body:
- `name`: (string, required, สูงสุด 50 ตัวอักษร) เช่น `"ถุงเงิน"`
- `species`: (string, optional, เช่น `dog`, `cat`, `bird`, `exotic`, สูงสุด 50 ตัวอักษร)
- `breed`: (string, optional, สูงสุด 50 ตัวอักษร) เช่น `"Scottish Fold"`
- `gender`: (string, optional, เช่น `"male"` หรือ `"female"`)
- `b_date`: (string YYYY-MM-DD, optional) เช่น `"2022-05-15"` หรือ `birthday` หรือ `age` (number, 0-100)
- `weight`: (number, optional, หน่วย kg) เช่น `4.5`
- `allergy`: (string, optional) เช่น `"อาหารทะเล"`
- `image`: (binary file, optional) ไฟล์รูปภาพสัตว์เลี้ยง อัปโหลดไปยัง Supabase Storage อัตโนมัติ (หรือระบุ `photo` / `image_url`)

### Response 201 Created
```json
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
```

### Response 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "กรุณากรอกชื่อสัตว์เลี้ยง"
}
```

### Response 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "กรุณาเข้าสู่ระบบ"
}
```

### Response 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Only pet owner can manage pets"
}
```

---

## S3.2 Update pet profile

แก้ไขข้อมูลสัตว์เลี้ยงของ Pet Owner

```http
PUT /api/pets/{id}
```
*(รองรับ `PATCH /api/pets/{id}` ด้วย)*

* **Header:** `Authorization: Bearer <token>` (role: `owner`)
* **Path Variables:** `id` : Pet ID (ตัวเลข)
* **Content-Type:** `multipart/form-data` หรือ `application/json`

### Form Data / Request Body (ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข):
- `name`, `species`, `breed`, `gender`, `b_date`, `weight`, `allergy`, `image`

### Response 200 OK
```json
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
```

### Response 400 Bad Request
```json
{
  "error": "INVALID_PET_ID",
  "message": "รหัสสัตว์เลี้ยงต้องเป็นตัวเลขจำนวนเต็มบวก"
}
```

### Response 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "กรุณาเข้าสู่ระบบ"
}
```

### Response 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "คุณไม่ใช่เจ้าของสัตว์เลี้ยงนี้"
}
```

### Response 404 Not Found
```json
{
  "error": "PET_NOT_FOUND",
  "message": "ไม่พบข้อมูลสัตว์เลี้ยง"
}
```

---

## S3.3 Delete pet profile

ลบข้อมูลสัตว์เลี้ยงออกจากระบบ

```http
DELETE /api/pets/{id}
```

* **Header:** `Authorization: Bearer <token>` (role: `owner`)
* **Path Variables:** `id` : Pet ID (ตัวเลข)

### Response 204 No Content

### Response 400 Bad Request
```json
{
  "success": false,
  "error": "INVALID_PET_ID",
  "message": "รหัสสัตว์เลี้ยงต้องเป็นตัวเลขจำนวนเต็มบวก"
}
```

### Response 401 Unauthorized
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "ไม่ได้ส่ง Token ใน Header"
}
```

### Response 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "คุณไม่ใช่เจ้าของสัตว์เลี้ยงนี้"
}
```

### Response 404 Not Found
```json
{
  "error": "PET_NOT_FOUND",
  "message": "ไม่พบข้อมูลสัตว์เลี้ยง"
}
```

---

# S4. System Health (`/api/health`)

---

## S4.1 System health check

ตรวจสอบความพร้อมและสถานะการทำงานของระบบเซิร์ฟเวอร์ Backend

```http
GET /api/health
```

* **Header:** none (public)

### Response 200 OK
```json
{
  "status": "ok",
  "timestamp": "2026-10-07T16:50:00.000Z"
}
```

---

# ==========================================
# PART 2: SPRINT 2 APIs (Sitters, Bookings & Operations)
# ==========================================

# 1. Sitter & Search (Public)

---

## 1.1 Get all pet sitters (with filter)

ค้นหาและกรองรายการพี่เลี้ยงสัตว์เลี้ยงตามเงื่อนไข พร้อมระบบแบ่งหน้า (Pagination)

```http
GET /api/sitters/
```

* **Header:** none (public, require: false)

### Query Examples:
```http
GET /api/sitters/
GET /api/sitters/?category=sitting&maxPrice=500
GET /api/sitters/?q=somchai
GET /api/sitters/?province=กรุงเทพมหานคร&district=บางรัก&petType=cat&minPrice=100&maxPrice=500
GET /api/sitters/?minRating=4&sort=priceAsc
GET /api/sitters/?page=2&limit=12
```

### Parameters (ทุกตัวเป็น optional และใช้ร่วมกันแบบ AND):
- `q`: คำค้นหาตามชื่อผู้ใช้ (`username`) ของพี่เลี้ยง ตรงบางส่วนและไม่สนตัวพิมพ์เล็ก/ใหญ่ (ไม่เกิน 100 ตัวอักษร)
- `province`: จังหวัด (ชื่อไทยหรืออังกฤษ ตรงกับข้อมูลที่อยู่ของระบบ)
- `district`: อำเภอ/เขต (ต้องส่งคู่กับ `province` และต้องอยู่ในจังหวัดนั้น)
- `category`: กรองตาม `service_type` (`walking` | `sitting` | `boarding` | `grooming` | `daycare`)
- `petType`: กรองตามชนิดสัตว์ที่บริการนั้นรับ (`dog` | `cat` | `bird` | `exotic`)
- `minPrice`: ราคาขั้นต่ำ (จำนวนเต็ม 0 - 1,000,000)
- `maxPrice`: ราคาสูงสุด (จำนวนเต็ม 0 - 1,000,000, ต้องไม่น้อยกว่า `minPrice`)
- `minRating`: คะแนนเฉลี่ยขั้นต่ำ (จำนวนเต็ม 1 - 5) sitter ที่ยังไม่มีรีวิวจะไม่ถูกแสดงเมื่อส่งค่านี้
- `sort`: วิธีเรียง: `rating` (ค่าเริ่มต้น) | `priceAsc` | `priceDesc`
- `page`: หน้าที่ต้องการ (จำนวนเต็ม 1 - 100,000, ค่าเริ่มต้น 1)
- `limit`: จำนวนรายการต่อหน้า (จำนวนเต็ม 1 - 50, ค่าเริ่มต้น 12)

### กติกาและการทำงาน:
- คืน 1 แถวต่อ 1 sitter ที่เป็น active และมีอย่างน้อย 1 service (published) ที่ตรงเงื่อนไข category + petType + ราคา พร้อมกัน
- `services` ในแต่ละแถวคือเฉพาะ service ที่ตรงเงื่อนไข เรียงราคาน้อย→มาก
- `minPrice` (ในผลลัพธ์) = ราคาต่ำสุดของ services ที่ตรงเงื่อนไข
- การเรียง (ทำก่อนแบ่งหน้า): `rating` = คะแนนเฉลี่ยมาก→น้อย (sitter ที่ยังไม่มีรีวิวอยู่ท้ายสุด) แล้วตามด้วย `reviewCount` มาก→น้อย; `priceAsc` / `priceDesc` = เรียงตาม `minPrice` ในผลลัพธ์; ทุกแบบใช้ `sitterId` น้อย→มากเป็นตัวตัดสินสุดท้าย เพื่อให้ลำดับคงที่ข้ามหน้า
- pagination จะนับตามจำนวน sitter (ไม่ใช่จำนวน service)
- ถ้า page เกินจำนวนหน้าทั้งหมด จะได้ data เป็น `[]` (ยังเป็น 200) พร้อม pagination ตามจริง
- `rating` = คะแนนเฉลี่ยของ review_score ทุกรีวิวของ sitter (ไม่นับรีวิวที่ไม่มีคะแนน) ปัด 1 ตำแหน่ง; `reviewCount` = จำนวนรีวิวที่มีคะแนน; sitter ที่ยังไม่มีรีวิว rating = null, reviewCount = 0
- `minRating` และ sort rating ใช้ค่าเฉลี่ยจริง (ก่อนปัด)

### Response 200 OK
```json
{
  "status": "success",
  "data": [
    {
      "sitterId": 1,
      "username": "somchai",
      "province": "กรุงเทพมหานคร",
      "district": "บางรัก",
      "services": [
        {
          "serviceId": 3,
          "serviceName": "Cat sitting at home",
          "serviceType": "sitting",
          "species": ["cat"],
          "price": 300,
          "description": null,
          "status": "published",
          "createdAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "minPrice": 300,
      "rating": null,
      "reviewCount": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  }
}
```

### Response 400 Bad Request (Query ไม่ถูกต้อง)
```json
{
  "status": "error",
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    { "field": "category", "message": "category must be one of: walking, sitting, boarding, grooming, daycare" }
  ]
}
```

---

## 1.2 Get sitter profile

ดึงข้อมูลโปรไฟล์สาธารณะของพี่เลี้ยงตามรหัส

```http
GET /api/sitters/{sitterID}
```

* **Header:** none (public)
* **Path Variables:** `sitterID` (integer)

### Query Examples:
```http
GET /api/sitters/1
```

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "sitterId": 1,
    "username": "somchai",
    "province": "Bangkok",
    "rating": 4.8
  }
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Sitter not found"
}
```

---

## 1.3 Get sitter's services

ดึงรายการบริการที่เผยแพร่ (`published`) ของพี่เลี้ยงคนนั้น

```http
GET /api/sitters/{sitterID}/services
```

* **Header:** none (public)
* **Path Variables:** `sitterID` (integer)

### Query Examples:
```http
GET /api/sitters/1/services
```

### Response 200 OK
```json
{
  "status": "success",
  "data": [
    {
      "serviceId": 1,
      "serviceName": "รับเลี้ยงแมวข้ามคืน",
      "serviceType": "sitting",
      "species": ["dog", "cat"],
      "price": 350,
      "description": "..."
    }
  ]
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Sitter not found"
}
```

---

## 1.4 Get sitter's reviews

ดึงประวัติรีวิวและความคิดเห็นของผู้ใช้ที่มีต่อพี่เลี้ยง

```http
GET /api/sitters/{sitterID}/reviews
```

* **Header:** none (public)
* **Path Variables:** `sitterID` (integer)

### Query Examples:
```http
GET /api/sitters/1/reviews
```

### Response 200 OK
```json
{
  "status": "success",
  "data": [
    {
      "reviewId": 1,
      "rating": 5,
      "comment": "ดูแลดีมาก",
      "ownerName": "tanin",
      "createdAt": "2026-09-01T10:00:00Z"
    }
  ]
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Sitter not found"
}
```

---

## 1.5 Get sitter's busy slots

ดึงช่วงเวลาที่พี่เลี้ยงติดภารกิจ/มีการจองอยู่แล้วในวันที่กำหนด เพื่อป้องกันการจองเวลาชนกัน

```http
GET /api/sitters/{sitterID}/busy-slots?date={selectedDate}
```

* **Header:** none (public)
* **Path Variables:** `sitterID` (integer)
* **Query Parameters:** `date` (string YYYY-MM-DD, required)

### Query Examples:
```http
GET /api/sitters/1/busy-slots?date=2026-09-20
```

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "date": "2026-09-20",
    "busySlots": [
      {
        "starttime": "2026-09-20T09:00:00Z",
        "endtime": "2026-09-20T12:00:00Z"
      }
    ]
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid or missing date parameter"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Sitter not found"
}
```

---

# 2. Booking (Pet Owner)

---

## 2.1 Get my pets

ดึงรายการสัตว์เลี้ยงของ Owner ที่ล็อกอินอยู่เพื่อนำไปใช้เลือกในการจอง

```http
GET /api/pets/my-pets
```

* **Header:** `Authorization: Bearer <token>` (role: `owner`)

### Response 200 OK
```json
{
  "status": "success",
  "data": [
    {
      "petId": 1,
      "petName": "เหมียว",
      "petType": "cat",
      "age": 2
    }
  ]
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

---

## 2.2 Create booking request (multi-pet)

ส่งคำขอจองบริการใหม่ รองรับการเลือกสัตว์เลี้ยงหลายตัวพร้อมกัน

```http
POST /api/bookings
```

* **Header:** `Authorization: Bearer <token>` (role: `owner`)
* **Content-Type:** `application/json`

### Request Body:
```json
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
```

### หมายเหตุ:
- `totalPrice` และ `depositAmount` คำนวณฝั่ง Backend เท่านั้น (rate * hours * จำนวนสัตว์เลี้ยง)

### Response 201 Created
```json
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
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Validation failed"
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Only pet owner can create booking"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Sitter, service or pet not found"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Time slot overlaps with an existing booking"
}
```

---

## 2.3 Get my bookings (owner, multi-pet)

ดึงรายการประวัติการจองทั้งหมดของตนเอง (Owner) พร้อมตัวกรองสถานะ

```http
GET /api/owner/bookings
```

* **Header:** `Authorization: Bearer <token>` (role: `owner`)

### Query Examples:
```http
GET /api/owner/bookings
GET /api/owner/bookings?status=waiting_payment
```

### Response 200 OK
```json
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
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

---

## 2.4 Cancel booking (owner)

เจ้าของสัตว์เลี้ยงกดยกเลิกการจอง

```http
PATCH /api/owner/bookings/{bookingID}/cancel
```

* **Header:** `Authorization: Bearer <token>` (role: `owner`)
* **Path Variables:** `bookingID` (integer)

### Query Examples:
```http
PATCH /api/owner/bookings/1/cancel
```

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "cancelled"
  }
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not the owner of this booking"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Booking not found"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Booking cannot be cancelled in current status"
}
```

---

# 3. Payment

---

## 3.1 Get payment summary

ดึงสรุปยอดชำระเงิน ประวัติการจ่ายเงิน และสลิปที่แนบมาของการจอง

```http
GET /api/bookings/{bookingID}/payments
```

* **Header:** `Authorization: Bearer <token>`
* **Path Variables:** `bookingID` (integer)

### Query Examples:
```http
GET /api/bookings/1/payments
```

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
    "payments": [
      {
        "paymentId": 1,
        "amount": 1890,
        "payment_stage": "deposit",
        "payment_status": "pending_verifying",
        "paid_at": "2026-09-10T14:00:00Z"
      }
    ]
  }
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not a participant of this booking"
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

## 3.2 Submit payment slip

อัปโหลดไฟล์สลิปหลักฐานการโอนเงิน (รองรับการชำระเงินมัดจำและการชำระส่วนที่เหลือ)

```http
POST /api/payments
```

* **Header:** `Authorization: Bearer <token>`
* **Content-Type:** `multipart/form-data`

### Request Body (Multipart Form-Data):
- `bookingId`: (integer, required) รหัสการจอง เช่น `1`
- `amount`: (number, required) ยอดเงิน เช่น `1890` (ต้องตรงกับยอดที่ Backend คำนวณ)
- `payment_stage`: (string, required) `"deposit"` | `"final"` | `"full"`
- `paymentType`: (string, required) `"bank_transfer"`
- `slip_image`: (file, required) ไฟล์สลิปโอนเงิน

### หมายเหตุ:
- `amount` ต้องตรงกับยอดที่ Backend คำนวณ (`deposit` ครั้งแรก / ส่วนที่เหลือตอน `final`)

### Response 201 Created
```json
{
  "status": "success",
  "data": {
    "paymentId": 1,
    "payment_status": "pending_verifying",
    "slip_image": "https://storage.../slip-1.jpg"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid file type or size / missing fields"
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Booking not found"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Amount mismatch or stage already paid"
}
```

---

## 3.3 Verify payment slip (sitter)

พี่เลี้ยงตรวจสอบและยืนยันความถูกต้องของสลิปโอนเงิน

```http
PATCH /api/bookings/{bookingID}/verify-payment
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter` ของ booking นี้)
* **Path Variables:** `bookingID` (integer)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "paymentId": 1,
  "action": "verify"
}
```
*(action: `"verify"` | `"reject"`)*

### ผลข้างเคียง (Side Effects):
- verify `deposit` ➔ booking เป็น `deposit_paid` (ล็อกคิวงาน รอกดเริ่มงาน)
- verify `full` ➔ booking เป็น `confirmed` (ชำระเต็มจำนวน ล็อกคิวงาน)
- verify `final` ➔ booking เป็น `completed`

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "paymentId": 1,
    "payment_status": "verified",
    "bookingstatus": "deposit_paid"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid action"
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not the assigned sitter of this booking"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Booking or payment not found"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Payment already verified or rejected"
}
```

---

# 4. Sitter Management

---

## 4.1 Get my services

ดึงรายการบริการทั้งหมดของตนเอง (Sitter) ที่เคยสร้างไว้

```http
GET /api/sitter/services/me
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)

### Response 200 OK
```json
{
  "status": "success",
  "data": [
    {
      "serviceId": 1,
      "serviceName": "รับเลี้ยงแมวข้ามคืน",
      "serviceType": "sitting",
      "species": ["dog", "cat"],
      "price": 350,
      "description": "..."
    }
  ]
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Sitter role required"
}
```

---

## 4.2 Create service

พี่เลี้ยงสร้างบริการใหม่ที่ต้องการเปิดรับดูแลสัตว์เลี้ยง

```http
POST /api/sitter/services/
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "serviceName": "รับเลี้ยงแมวข้ามคืน",
  "serviceType": "sitting",
  "species": ["dog", "cat"],
  "price": 350,
  "description": "มีประสบการณ์ 5 ปี"
}
```

### Response 201 Created
```json
{
  "status": "success",
  "data": {
    "serviceId": 1,
    "serviceName": "รับเลี้ยงแมวข้ามคืน",
    "species": ["dog", "cat"],
    "price": 350
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Validation failed"
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Sitter role required"
}
```

---

## 4.3 Edit service

แก้ไขรายละเอียดและราคาของบริการเดิม

```http
PATCH /api/sitter/services/{serviceID}
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)
* **Path Variables:** `serviceID` (integer)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "price": 400,
  "serviceType": "boarding",
  "species": ["cat"],
  "description": "อัปเดตแล้ว"
}
```

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "serviceId": 1,
    "price": 400,
    "description": "อัปเดตแล้ว"
  }
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not the owner of this service"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Service not found"
}
```

---

## 4.4 Delete service

ลบบริการของตนเอง (ลบได้เฉพาะบริการที่ไม่มีคิวการจองค้างอยู่)

```http
DELETE /api/sitter/services/{serviceID}
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)
* **Path Variables:** `serviceID` (integer)

### Query Examples:
```http
DELETE /api/sitter/services/1
```

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "serviceId": 1
  }
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not the owner of this service"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Service not found"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Service has active bookings"
}
```

---

## 4.5 Get my bookings (sitter, multi-pet)

ดึงคำขอจองบริการทั้งหมดของพี่เลี้ยง พร้อมตัวกรองตามสถานะ

```http
GET /api/sitter/bookings
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)

### Query Examples:
```http
GET /api/sitter/bookings
GET /api/sitter/bookings?status=pending
```

### Response 200 OK
```json
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
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Sitter role required"
}
```

---

## 4.6 Update booking status (accept / reject / start / complete)

พี่เลี้ยงตอบรับคำขอ ปฏิเสธ หรือกดจบงาน

```http
PATCH /api/sitter/bookings/{bookingID}
```

* **Header:** `Authorization: Bearer <token>` (role: `sitter`)
* **Path Variables:** `bookingID` (integer)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "action": "accept"
}
```
*(action: `"accept"` | `"reject"` | `"start"` | `"complete"`)*

### ผลของ action:
- `accept`: `pending` ➔ `waiting_payment`
- `reject`: `pending` ➔ `rejected`
- `start`: `confirmed` / `deposit_paid` ➔ `in_progress` (Sprint 3)
- `complete`: `in_progress` ➔ `waiting_final_payment` (มัดจำ) หรือ `completed` (จ่ายเต็ม) (Sprint 3)
*(ดูรายละเอียดเงื่อนไขและผลลัพธ์ของ Sprint 3 อย่างละเอียดได้ที่ § PART 3: 5.1)*

### Response 200 OK
```json
{
  "status": "success",
  "data": {
    "bookingId": 1,
    "bookingstatus": "waiting_payment"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid action"
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Not the assigned sitter of this booking"
}
```

### Response 404 Not Found
```json
{
  "status": "error",
  "message": "Booking not found"
}
```

### Response 409 Conflict
```json
{
  "status": "error",
  "message": "Invalid status transition"
}
```

---

# 5. Review (Optional — นอก scope Sprint 2, เผื่อ Sprint หน้า)

---

## 5.1 Create review

เจ้าของสัตว์เลี้ยงส่งรีวิวและคะแนน

```http
POST /api/reviews
```

* **Header:** `Authorization: Bearer <token>` (role: `owner`)
* **Content-Type:** `application/json`

### Request Body:
```json
{
  "bookingId": 1,
  "rating": 5,
  "comment": "ดูแลดีมาก"
}
```

### Response 201 Created
```json
{
  "status": "success",
  "data": {
    "reviewId": 1,
    "rating": 5,
    "comment": "ดูแลดีมาก"
  }
}
```

### Response 400 Bad Request
```json
{
  "status": "error",
  "message": "Rating must be 1-5"
}
```

### Response 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Response 403 Forbidden
```json
{
  "status": "error",
  "message": "Only the owner of this booking can review"
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


# ==========================================
# PART 3: SPRINT 3 APIs (Sitters, Bookings & Operations)
# ==========================================

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
- `slip_image`: (file, required) ไฟล์สลิปโอนเงิน (`.jpg`, `.jpeg`, `.png`, `.webp`, ไม่เกิน 5MB)

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

เจ้าของสัตว์เลี้ยงกดยกเลิกการจองก่อนได้รับการยืนยัน (ยกเลิกได้เฉพาะสถานะ `pending` หรือ `waiting_payment` เท่านั้น โดยไม่มีนโยบายคืนเงินเมื่อเข้าสู่สถานะ `deposit_paid` หรือ `confirmed` แล้ว)

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

