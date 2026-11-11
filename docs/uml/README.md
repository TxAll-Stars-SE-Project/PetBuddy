# 🐾 PetBuddy - REST API UML Profile Diagrams (`.mmd`)

รวบรวมไฟล์ Mermaid (`.mmd`) ของระบบ PetBuddy ตามมาตรฐาน **UML Profile for REST API Design** สอดคล้องกับสถาปัตยกรรม Database จริง 100%

## 📐 กฎและสัญลักษณ์ที่ใช้ใน Diagram
1. **`«Application»`:** จุดเริ่มต้น API ทั้งระบบ (Root `"/"`)
2. **`«Path»`:** เส้นทาง URI ชี้ไปยัง Resource (ใช้สัญลักษณ์ `«Path»` เพื่อไม่ให้ทับซ้อนกับแท็ก HTML/SVG)
3. **`«Resource»`:** กล่อง Resource สะท้อน Entity/Table จริงใน Database พร้อม HTTP Operations (`GET()`, `POST()`, `PUT()`, `PATCH()`, `DELETE()`)
4. **`«Representation»`:** กล่อง Schema/DTO ข้อมูลที่รับเข้าหรือส่งออก เชื่อมด้วย `«use»`
5. **Hierarchical & Pure CRUD Standard:**
   - **Slide 19 Standard (CRUD):** จัดโครงสร้าง 4 กล่อง (Collection ➔ `/{id}` ➔ Instance) แชร์ Representation เดียวกัน (`pets_crud.mmd`, `sitter_services_crud.mmd`)
   - **Slide 28 Standard (Hierarchy):** เชื่อมโยง Sub-resources ที่เป็น Entity จริงใน Database (`sitters.mmd` ➔ `Services`, `Reviews`) ตัด Calculated Data ที่ไม่มี Entity จริงออก

---

## 📂 รายการไฟล์ Diagram และความครอบคลุม 100% ของ Database & Routes จริง

| ไฟล์ Mermaid | Entity / ตารางใน DB | Express Routes ที่รองรับ | รูปแบบตามสไลด์ |
|---|---|---|---|
| [`overview.mmd`](./overview.mmd) | ระบบโดยรวม | เชื่อมโยงทุก Module จาก Root `/api` | System Architecture |
| [`pets_crud.mmd`](./pets_crud.mmd) | ตาราง `pet` | `GET /my-pets`, `POST /`, `GET /:id`, `PATCH /:id`, `PUT /:id`, `DELETE /:id` | **Slide 19** (4 กล่อง 4 เส้น) |
| [`sitter_services_crud.mmd`](./sitter_services_crud.mmd) | ตาราง `services` | `GET /me`, `POST /`, `PATCH /:serviceID`, `DELETE /:serviceID` | **Slide 19** (4 กล่อง 4 เส้น) |
| [`sitters.mmd`](./sitters.mmd) | ตาราง `petsitter`, `services`, `review` | `GET /` (QueryParam), `GET /:sitterID`, `GET /:sitterID/services`, `GET /:sitterID/reviews` | **Slide 28** (ลำดับชั้น Sub-resources) |
| [`auth.mmd`](./auth.mmd) | การยืนยันตัวตน User | `POST /register`, `POST /login`, `POST /logout`, `POST /forgot-password`, `POST /reset-password`, `DELETE /account` | Auth Endpoints |
| [`users.mmd`](./users.mmd) | ตาราง `USER` | `GET /`, `GET /me`, `PUT /me` | Instance Path (`/me`) |
| [`bookings.mmd`](./bookings.mmd) | ตาราง `booking`, `payment` | `POST /api/bookings`, `PATCH /:bookingId`, `GET /:bookingID/payments`, `PATCH /:bookingID/verify-payment`, `GET /owner/bookings`, `GET /sitter/bookings`, `PATCH /sitter/bookings/:id` | Nested Resources |
| [`sitter_payment_crud.mmd`](./sitter_payment_crud.mmd) | ฟิลด์ QR Code บน `petsitter` | `GET /`, `POST /`, `PATCH /`, `DELETE /` | CRUD Resource |
| [`payments.mmd`](./payments.mmd) | ตาราง `payment` | `POST /api/payments` (Upload Slip) | Slip Submission |
| [`reviews.mmd`](./reviews.mmd) | ตาราง `review` | `POST /api/reviews` (Create Review) | Review Submission |

---

## 🛠 วิธีเปิดดู Diagram บน Draw.io หรือ Mermaid Live
- Copy โค้ดในไฟล์ `.mmd` แต่ละไฟล์
- เปิด [Mermaid Live Editor](https://mermaid.live/) หรือใน **Draw.io** (`Arrange` ➔ `Insert` ➔ `Advanced` ➔ `Mermaid`)
- เส้นเชื่อมความสัมพันธ์ทั้งหมดใช้ `«Path»` และ `«use»` ไม่เกิดปัญหาตัวอักษรหายหรือแสดงเป็น `< >` แน่นอน
