import { api } from "./api.js";

export function getBookingPayments(bookingId) {
  return api.get(`/bookings/${bookingId}/payments`);
}

export function uploadPaymentSlip(formData) {
  return api.post("/payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function verifyPayment(bookingId, paymentId, action) {
  return api.patch(`/bookings/${bookingId}/verify-payment`, { paymentId, action });
}
