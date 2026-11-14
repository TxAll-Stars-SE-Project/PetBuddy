// ค่าที่ใช้ร่วมกับ API เพื่อจำกัดสถานะและประเภทต่างๆ ให้ตรงกับข้อมูล booking
export type BookingStatus =
  | 'pending'
  | 'waiting_payment'
  | 'deposit_paid'
  | 'confirmed'
  | 'in_progress'
  | 'rejected'
  | 'cancelled'
  | 'waiting_final_payment'
  | 'completed';

export type ServiceType = 'walking' | 'sitting' | 'boarding' | 'grooming' | 'daycare';

export type Species = 'dog' | 'cat' | 'bird' | 'exotic';

export type PaymentPlan = 'full' | 'deposit';

export interface PetInfo {
  petId: number;
  name: string;
  species: Species;
}

export interface OwnerInfo {
  ownerId: number;
  fullname: string;
  phone: string;
  email?: string;
}

export interface ServiceInfo {
  serviceId: number;
  servicetype: ServiceType;
  title: string;
  price?: number;
}

export interface BookingPetInfo {
  petId: number;
  petName: string;
  petNote: string | null;
  species: Species | null;
  breed: string | null;
  imageUrl: string | null;
  id?: number;
  name?: string;
  type?: string;
}

export interface Booking {
  bookingId: number;
  bookingstatus: BookingStatus;
  totalprice: number;
  paymentplan: PaymentPlan;
  starttime: string;
  endtime: string;
  note?: string;
  petName?: string;
  petType?: string;
  ownerName?: string;
  serviceName?: string;
  owner: OwnerInfo;
  pets?: BookingPetInfo[];
  service: ServiceInfo;
}

export interface OwnerBooking {
  bookingId: number;
  bookingstatus: BookingStatus;
  sitterName: string;
  serviceName: string;
  serviceType: ServiceType;
  starttime: string;
  endtime: string;
  totalPrice: number;
  paymentplan: PaymentPlan | null;
  pets: PetInfo[];
}

export type BookingAction = 'accept' | 'reject' | 'start' | 'complete';

/**
 * ตรวจสอบว่าถึงเวลาเริ่มงานตามนัดหมาย (Exact Time) แล้วหรือยัง
 */
export function isStartTimeReached(starttime: string, now: Date = new Date()): boolean {
  const startDate = new Date(starttime);
  if (Number.isNaN(startDate.getTime())) {
    return false;
  }
  return now.getTime() >= startDate.getTime();
}

/**
 * Alias เพื่อ backwards-compatibility กับโค้ดเดิม
 */
export const isStartDateReached = isStartTimeReached;
