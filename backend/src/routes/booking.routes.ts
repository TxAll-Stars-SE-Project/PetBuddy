import { Router } from 'express';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { cancelBooking, createBooking } from '../controllers/booking.controller.js';
import {
  getPaymentSummaryController,
  verifyPaymentSlipController,
} from '../controllers/payment/payment.controller.js';

const router = Router();

// POST /api/bookings
router.post('/', requireAuth, authorize('owner'), createBooking);

// PATCH /api/bookings/:bookingId  (owner cancels own booking)
router.patch('/:bookingId', requireAuth, authorize('owner'), cancelBooking);

// GET /api/bookings/:bookingID/payments (US 6-1 & US 6-2: ดึงสรุปยอดชำระเงิน, QR Code พี่เลี้ยง และประวัติสลิป)
router.get('/:bookingID/payments', requireAuth, getPaymentSummaryController);

// PATCH /api/bookings/:bookingID/verify-payment (US 6-2: พี่เลี้ยงตรวจสอบยืนยันหรือปฏิเสธสลิป)
router.patch(
  '/:bookingID/verify-payment',
  requireAuth,
  requireRole('sitter'),
  verifyPaymentSlipController
);

export default router;
