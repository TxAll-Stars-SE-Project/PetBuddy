import { api } from "./api.js";

export function getBookingPayments(bookingId) {
  return api.get(`/bookings/${bookingId}/payments`);
}

export function uploadPaymentSlip(formData) {
  const stage = formData.has("payment_stage") ? String(formData.get("payment_stage")) : "";
  if (!formData.has("payment_type") && (stage === "deposit" || stage === "final")) {
    formData.append("payment_type", stage);
  }
  return api.post("/payments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function verifyPayment(bookingId, paymentId, action) {
  return api.patch(`/bookings/${bookingId}/verify-payment`, { paymentId, action });
}
