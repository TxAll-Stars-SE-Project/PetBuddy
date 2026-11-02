import test from 'node:test';
import assert from 'node:assert/strict';
import { getBookingReviewState, REVIEW_WINDOW_MS, REVIEW_WINDOW_DAYS } from '../utils/reviewStorage.js';

test('getBookingReviewState', async (t) => {
  await t.test('returns not_completed when bookingstatus is not completed', () => {
    const booking = { bookingId: 1, bookingstatus: 'confirmed' };
    const res = getBookingReviewState(booking, {});
    assert.equal(res.state, 'not_completed');
    assert.equal(res.canReview, false);
  });

  await t.test('returns reviewed when review is already saved', () => {
    const booking = {
      bookingId: 10,
      bookingstatus: 'completed',
      endtime: new Date().toISOString(),
    };
    const saved = {
      10: {
        bookingId: 10,
        rating: 5,
        comment: 'Great service!',
        status: 'reviewed',
      },
    };
    const res = getBookingReviewState(booking, saved);
    assert.equal(res.state, 'reviewed');
    assert.equal(res.canReview, false);
    assert.equal(res.rating, 5);
  });

  await t.test('returns pending_review and canReview=true within 14 days', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const booking = {
      bookingId: 20,
      bookingstatus: 'completed',
      endtime: fiveDaysAgo,
    };
    const res = getBookingReviewState(booking, {});
    assert.equal(res.state, 'pending_review');
    assert.equal(res.canReview, true);
    assert.equal(typeof res.daysRemaining, 'number');
    assert.ok(res.daysRemaining > 0 && res.daysRemaining <= REVIEW_WINDOW_DAYS);
  });

  await t.test('returns expired_auto_reviewed, isExpired=true and canReview=false after 14 days', () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const booking = {
      bookingId: 30,
      bookingstatus: 'completed',
      endtime: fifteenDaysAgo,
    };
    const res = getBookingReviewState(booking, {});
    assert.equal(res.state, 'expired_auto_reviewed');
    assert.equal(res.canReview, false);
    assert.equal(res.isExpired, true);
  });

  await t.test('flags isUrgent=true when 2 days or fewer remain', () => {
    const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString();
    const booking = {
      bookingId: 40,
      bookingstatus: 'completed',
      endtime: thirteenDaysAgo,
    };
    const res = getBookingReviewState(booking, {});
    assert.equal(res.state, 'pending_review');
    assert.equal(res.canReview, true);
    assert.equal(res.isUrgent, true);
    assert.ok(res.daysRemaining <= 2);
  });
});
