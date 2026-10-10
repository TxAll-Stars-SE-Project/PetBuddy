// ค่าที่ใช้ร่วมกับ API เพื่อจำกัดสถานะและประเภทต่างๆ ให้ตรงกับข้อมูล booking
export type BookingStatus =
  | 'pending'
  | 'waiting_payment'
  | 'deposit_paid'
  | 'confirmed'
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
}

export interface ServiceInfo {
  serviceId: number;
  servicetype: ServiceType;
  title: string;
}

export interface BookingPetInfo {
  id: number;
  name: string;
  type: string;
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
  owner: OwnerInfo;
  pets?: BookingPetInfo[];
  service: ServiceInfo;
}

export type BookingAction = 'accept' | 'reject' | 'complete';