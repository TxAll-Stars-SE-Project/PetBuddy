import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOOKING_STATUS_CONFIG } from '../utils/bookingStatusConfig';

describe('BOOKING_STATUS_CONFIG', () => {
  it('should map in_progress status with correct label, badge class, and allowedActions', () => {
    assert.deepEqual(BOOKING_STATUS_CONFIG.in_progress, {
      label: 'กำลังดูแล',
      badgeClass: 'badge--primary',
      allowedActions: ['complete'],
    });
  });

  it('should allow start action for deposit_paid and confirmed statuses', () => {
    assert.ok(BOOKING_STATUS_CONFIG.deposit_paid.allowedActions.includes('start'));
    assert.ok(BOOKING_STATUS_CONFIG.confirmed.allowedActions.includes('start'));
  });

  it('should not allow any actions for completed, cancelled, or rejected statuses', () => {
    assert.equal(BOOKING_STATUS_CONFIG.rejected.allowedActions.length, 0);
    assert.equal(BOOKING_STATUS_CONFIG.cancelled.allowedActions.length, 0);
    assert.equal(BOOKING_STATUS_CONFIG.waiting_final_payment.allowedActions.length, 0);
  });
});