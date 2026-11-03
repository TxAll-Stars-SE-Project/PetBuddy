import { api } from "./api.js";

export function getBookingPayments(bookingId) {
  return api.get(`/bookings/${bookingId}/payments`);
}

export function uploadPaymentSlip(formData) {
  if (!formData.has("payment_type") && formData.has("payment_stage")) {
    formData.append("payment_type", String(formData.get("payment_stage")));
  }
  return api.post("/payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function verifyPayment(bookingId, paymentId, action) {
  return api.patch(`/bookings/${bookingId}/verify-payment`, { paymentId, action });
}
