import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FILTERS, getPriceError, PET_TYPES, SERVICE_TYPES, SORT_OPTIONS } from "../utils/sitterOptions.js";

describe("getPriceError (mirrors the backend rules so no request is sent that would 400)", () => {
  it("no error for the defaults / empty inputs", () => {
    assert.equal(getPriceError(DEFAULT_FILTERS), "");
    assert.equal(getPriceError({ min: "", max: "" }), "");
  });

  it("no error for a valid range, including equal bounds and 0 .. 1,000,000", () => {
    assert.equal(getPriceError({ min: "100", max: "500" }), "");
    assert.equal(getPriceError({ min: "300", max: "300" }), "");
    assert.equal(getPriceError({ min: "0", max: "1000000" }), "");
  });

  it("accepts only one side of the range", () => {
    assert.equal(getPriceError({ min: "100", max: "" }), "");
    assert.equal(getPriceError({ min: "", max: "100" }), "");
  });

  it("rejects non-integers, negatives and signs", () => {
    for (const bad of ["abc", "-1", "1.5", "1e3", "+5", " 5"]) {
      assert.notEqual(getPriceError({ min: bad, max: "" }), "", `min=${bad}`);
      assert.notEqual(getPriceError({ min: "", max: bad }), "", `max=${bad}`);
    }
  });

  it("rejects values above 1,000,000", () => {
    assert.notEqual(getPriceError({ min: "1000001", max: "" }), "");
    assert.notEqual(getPriceError({ min: "", max: "1000001" }), "");
  });

  it("rejects min greater than max", () => {
    assert.notEqual(getPriceError({ min: "500", max: "100" }), "");
  });

  it("compares numerically, not as strings", () => {
    assert.equal(getPriceError({ min: "9", max: "10" }), "");
    assert.notEqual(getPriceError({ min: "10", max: "9" }), "");
  });
});

describe("filter option tables match the backend enums", () => {
  it("pet types", () => assert.deepEqual(Object.keys(PET_TYPES), ["dog", "cat", "bird", "exotic"]));
  it("service types", () =>
    assert.deepEqual(Object.keys(SERVICE_TYPES), ["walking", "sitting", "boarding", "grooming", "daycare"]));
  it("sort options", () =>
    assert.deepEqual(SORT_OPTIONS.map((o) => o.value), ["rating", "priceAsc", "priceDesc"]));
  it("defaults: no filters, rating sort", () => {
    assert.equal(DEFAULT_FILTERS.sort, "rating");
    assert.equal(DEFAULT_FILTERS.rating, 0);
    assert.equal(DEFAULT_FILTERS.pet, "");
    assert.equal(DEFAULT_FILTERS.service, "");
  });
});
