# 🐾 Pet Profile Management API Specification

เอกสารอธิบายรายละเอียดการใช้งาน API สำหรับจัดการโปรไฟล์สัตว์เลี้ยง (`Add Pet` และ `Edit Pet`) สำหรับทีม Frontend และ Backend

---

## 🔐 1. General Conventions & Authentication

* **Base URL**: `/api/pets`
* **Authentication**: ต้องแนบ Bearer Token ใน Request Header ทุกครั้ง
  ```http
  Authorization: Bearer <jwt_token>
  ```
* **Authorization / Role**: เฉพาะผู้ใช้ที่มีบทบาทเป็น **`owner` (Pet Owner)** เท่านั้น (หาก role ไม่ถูกต้องจะคืนค่า `403 FORBIDDEN`)
* **Content-Type**:
  * หากมีการอัปโหลดไฟล์รูปภาพ: ใช้ **`multipart/form-data`**
  * หากแก้ไขเฉพาะข้อความ (ไม่มีไฟล์ภาพ): สามารถใช้ **`application/json`** หรือ `multipart/form-data` ก็ได้

---

## 🐶 2. Add Pet (สร้างโปรไฟล์สัตว์เลี้ยงใหม่)

สร้างสัตว์เลี้ยงตัวใหม่ของเจ้าของที่ล็อกอินอยู่ พร้อมรองรับการอัปโหลดรูปภาพขึ้น Cloud Storage

* **Method**: `POST`
* **Path**: `/api/pets` (หรือ `/api/pets/add`)
* **Auth**: `Bearer Token` (Role: `owner`)
* **Content-Type**: `multipart/form-data`

### 📥 Request Body (Fields)

| Field | Type | Required? | รายละเอียดและข้อกำหนด |
| :--- | :--- | :---: | :--- |
| `name` | String | **Yes** | ชื่อสัตว์เลี้ยง (1 - 50 ตัวอักษร, ห้ามตั้งซ้ำกับสัตว์เลี้ยงตัวอื่นของตนเอง) |
| `species` | String | No | ประเภท/ชนิดสัตว์ เช่น `Dog`, `Cat`, `สุนัข`, `แมว` (สูงสุด 50 ตัวอักษร) |
| `breed` | String | No | พันธุ์สัตว์เลี้ยง เช่น `Golden Retriever`, `Persian` (สูงสุด 50 ตัวอักษร) |
| `birthday` / `b_date` | String | No | วันเกิดรูปแบบ `YYYY-MM-DD` (เช่น `2023-01-15`) *ระบบจะคำนวณ `age` ให้อัตโนมัติ* |
| `age` | Number | No | อายุสัตว์เลี้ยง (กรณีไม่ระบุวันเกิด ส่งอายุ 0 - 100 ระบบจะคำนวณวันเกิดคร่าวๆ ให้) |
| `gender` | String | No | เพศของสัตว์เลี้ยง เช่น `Male`, `Female`, `ผู้`, `เมีย` (สูงสุด 20 ตัวอักษร) |
| `weight` | Number | No | น้ำหนักตัว (กก.) เช่น `12.5` (ตัวเลขบวก ไม่เกิน 999.99) |
| `notes` / `allergy` | String | No | ข้อมูลแพ้อาหารหรือหมายเหตุเกี่ยวกับสัตว์เลี้ยง |
| `photo` | File (Binary) | No | ไฟล์รูปภาพสัตว์เลี้ยง (JPEG / PNG) สูงสุด 5MB |

---

### 📤 Responses

#### ✅ 201 Created (สำเร็จ)
```json
{
  "success": true,
  "id": "24",
  "petid": 24,
  "ownerId": "111",
  "ownerid": 111,
  "name": "ข้าวเหนียว",
  "species": "สุนัข",
  "breed": "โกลเด้น รีทรีฟเวอร์",
  "age": 3,
  "b_date": "2023-04-12",
  "gender": "ผู้",
  "weight": 15.5,
  "notes": "นิสัยร่าเริง เป็นมิตร ไม่แพ้อาหาร",
  "allergy": "นิสัยร่าเริง เป็นมิตร ไม่แพ้อาหาร",
  "photo": "https://azprqudssagsgjqupvzt.supabase.co/storage/v1/object/public/petbuddy-images/pets/111/1789212888676-ryffejx.jpg",
  "image_url": "https://azprqudssagsgjqupvzt.supabase.co/storage/v1/object/public/petbuddy-images/pets/111/1789212888676-ryffejx.jpg"
}
```

#### ❌ Error Cases
| Status | Error Code | คำอธิบาย |
| :---: | :--- | :--- |
| **400** | `VALIDATION_ERROR` | ข้อมูลไม่ถูกต้อง เช่น ไม่ได้ส่งชื่อ หรือชื่อยาวเกิน 50 ตัวอักษร |
| **401** | `UNAUTHORIZED` | ไม่ได้ส่ง Token หรือ Token หมดอายุ |
| **403** | `FORBIDDEN` | ผู้ใช้ไม่ใช่ Role `owner` |
| **409** | `PET_NAME_DUPLICATE` | คุณมีสัตว์เลี้ยงชื่อนี้ในระบบอยู่แล้ว กรุณาใช้ชื่ออื่น |
| **500** | `INTERNAL_SERVER_ERROR` | ระบบฐานข้อมูลหรือ Storage ขัดข้อง |

---

## 🐱 3. Edit Pet (แก้ไขโปรไฟล์สัตว์เลี้ยง)

แก้ไขข้อมูลสัตว์เลี้ยง โดยรองรับ **Partial Update** (ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข ฟิลด์อื่นๆ จะคงเดิม) และรองรับการเปลี่ยนรูปภาพใหม่พร้อมลบรูปภาพเก่าออกจากระบบทันที

* **Method**: `PATCH` (แนะนำ) หรือ `PUT`
* **Path**: `/api/pets/:id` (เช่น `/api/pets/24`)
* **Auth**: `Bearer Token` (Role: `owner` และต้องเป็นเจ้าของสัตว์เลี้ยงตัวนี้)
* **Content-Type**: `multipart/form-data` (กรณีมีรูป) หรือ `application/json` (กรณีแก้แค่ข้อความ)

### 📥 Request Body (Fields)
*ทุกฟิลด์เป็น **Optional** ส่งเฉพาะฟิลด์ที่ต้องการเปลี่ยน*

| Field | Type | รายละเอียดและข้อกำหนด |
| :--- | :--- | :--- |
| `name` | String | ชื่อสัตว์เลี้ยงใหม่ (ถ้าส่งมาต้องไม่เป็นค่าว่าง และไม่ซ้ำกับตัวอื่นของตนเอง) |
| `species` | String / Null | ประเภทสัตว์เลี้ยง (ส่ง `null` หรือ string ว่างเพื่อล้างค่า) |
| `breed` | String / Null | พันธุ์สัตว์เลี้ยง |
| `birthday` / `b_date` | String / Null | วันเกิดใหม่ `YYYY-MM-DD` |
| `age` | Number / Null | อายุใหม่ |
| `gender` | String / Null | เพศใหม่ |
| `weight` | Number / Null | น้ำหนักใหม่ |
| `notes` / `allergy` | String / Null | ข้อมูลแพ้อาหารหรือหมายเหตุใหม่ |
| `photo` | File (Binary) | ไฟล์รูปภาพใหม่ **(หากส่งไฟล์ใหม่เข้ามา ระบบจะลบรูปภาพเก่าใน Supabase Storage ทิ้งอัตโนมัติ)** |

---

### 📤 Responses

#### ✅ 200 OK (สำเร็จ)
```json
{
  "success": true,
  "id": "24",
  "petid": 24,
  "ownerId": "111",
  "ownerid": 111,
  "name": "ข้าวจ้าว",
  "species": "สุนัข",
  "breed": "โกลเด้น รีทรีฟเวอร์",
  "age": 3,
  "b_date": "2023-04-12",
  "gender": "ผู้",
  "weight": 15.5,
  "notes": "นิสัยร่าเริง เป็นมิตร ไม่แพ้อาหาร",
  "allergy": "นิสัยร่าเริง เป็นมิตร ไม่แพ้อาหาร",
  "photo": "https://azprqudssagsgjqupvzt.supabase.co/storage/v1/object/public/petbuddy-images/pets/111/1789213071252-xkjnb4l.png",
  "image_url": "https://azprqudssagsgjqupvzt.supabase.co/storage/v1/object/public/petbuddy-images/pets/111/1789213071252-xkjnb4l.png"
}
```

#### ❌ Error Cases
| Status | Error Code | คำอธิบาย |
| :---: | :--- | :--- |
| **400** | `INVALID_PET_ID` | `:id` ใน URL ไม่ใช่ตัวเลขจำนวนเต็มบวก |
| **400** | `VALIDATION_ERROR` | ข้อมูลที่ส่งมาแก้ไขไม่ถูกต้อง เช่น ส่งชื่อเป็นค่าว่าง |
| **401** | `UNAUTHORIZED` | ไม่ได้ส่ง Token หรือ Token หมดอายุ |
| **403** | `FORBIDDEN` | คุณไม่มีสิทธิ์แก้ไขสัตว์เลี้ยงตัวนี้ (สัตว์เลี้ยงเป็นของผู้อื่น) |
| **404** | `PET_NOT_FOUND` | ไม่พบสัตว์เลี้ยงรหัสนี้ในระบบ |
| **409** | `PET_NAME_DUPLICATE` | ชื่อใหม่ที่เปลี่ยนไปซ้ำกับสัตว์เลี้ยงตัวอื่นของตนเอง |
| **500** | `INTERNAL_SERVER_ERROR` | ระบบฐานข้อมูลขัดข้อง |

---

## 🗑️ 4. Delete Pet (ลบสัตว์เลี้ยง)

* **Method**: `DELETE`
* **Path**: `/api/pets/:id`
* **Auth**: `Bearer Token` (Role: `owner`)
* **Response**: `204 No Content` (เมื่อลบสำเร็จ ระบบจะทำการล้างไฟล์รูปภาพออกจาก Supabase Storage ให้อัตโนมัติ)

---

## 💡 5. Storage Lifecycle & Error Handling Features

1. **ป้องกันไฟล์ขยะตกค้าง (Prevent Orphaned Files)**:
   - ตรวจสอบความถูกต้องของ Input (Validate First) ก่อนการอัปโหลดไฟล์ขึ้น Storage เสมอ
2. **ระบบ Rollback อัตโนมัติ**:
   - หากอัปโหลดรูปภาพใหม่ขึ้น Cloud สำเร็จแล้ว แต่เกิดข้อผิดพลาดในการบันทึก Database (เช่น ชื่อซ้ำ `409`) ระบบจะลบรูปภาพใหม่ที่เพิ่งอัปโหลดออกจาก Cloud ทันที
3. **ระบบจัดการรูปภาพเก่า (Auto Old Image Cleanup)**:
   - เมื่อทำการแก้ไขรูปภาพ (`PATCH /api/pets/:id`) หรือลบสัตว์เลี้ยง (`DELETE /api/pets/:id`) รูปภาพเดิมที่อยู่ใน Supabase Storage จะถูกสั่งลบออกอย่างปลอดภัยทันที
