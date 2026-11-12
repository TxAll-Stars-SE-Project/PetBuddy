import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isStartDateReached } from "../types/booking.js";

describe("isStartDateReached (D-Day Guard)", () => {
  it("returns true when scheduled date is in the past", () => {
    assert.equal(isStartDateReached("2020-01-01T10:00:00Z"), true);
  });

  it("returns false when scheduled date is in the future", () => {
    assert.equal(isStartDateReached("2099-01-01T10:00:00Z"), false);
  });

  it("returns true for invalid date input fallback", () => {
    assert.equal(isStartDateReached("invalid-date-string"), true);
  });
});