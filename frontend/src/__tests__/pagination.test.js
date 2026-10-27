import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPageItems } from "../components/Pagination.jsx";

describe("getPageItems", () => {
  it("middle page: 1 … 4 5 6 … 20", () => {
    assert.deepEqual(getPageItems(5, 20), [1, null, 4, 5, 6, null, 20]);
  });

  it("near the end: 1 … 16 17 18 19 20 (a single skipped page shows its number, not …)", () => {
    assert.deepEqual(getPageItems(17, 20), [1, null, 16, 17, 18, 19, 20]);
  });

  it("near the start: 1 2 3 4 … 20", () => {
    assert.deepEqual(getPageItems(3, 20), [1, 2, 3, 4, null, 20]);
  });

  it("first page: 1 2 … 20", () => {
    assert.deepEqual(getPageItems(1, 20), [1, 2, null, 20]);
  });

  it("last page: 1 … 19 20", () => {
    assert.deepEqual(getPageItems(20, 20), [1, null, 19, 20]);
  });

  it("shows every page when there are only a few", () => {
    assert.deepEqual(getPageItems(1, 1), [1]);
    assert.deepEqual(getPageItems(2, 3), [1, 2, 3]);
    assert.deepEqual(getPageItems(3, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(getPageItems(4, 7), [1, 2, 3, 4, 5, 6, 7]);
  });

  it("returns nothing when there are no pages", () => {
    assert.deepEqual(getPageItems(1, 0), []);
  });

  it("for every page of every total up to 40: first, last and current are shown, in order, without duplicates, and gaps hide at least 2 pages", () => {
    for (let total = 1; total <= 40; total++) {
      for (let page = 1; page <= total; page++) {
        const items = getPageItems(page, total);
        const numbers = items.filter((p) => p !== null);
        const label = `page ${page}/${total}`;
        assert.equal(numbers[0], 1, label);
        assert.equal(numbers[numbers.length - 1], total, label);
        assert.ok(numbers.includes(page), label);
        assert.deepEqual(numbers, [...new Set(numbers)].sort((a, b) => a - b), label);
        items.forEach((p, i) => {
          if (p !== null) return;
          // … never at the ends and always stands for 2+ hidden pages
          assert.ok(i > 0 && i < items.length - 1, `${label}: dangling …`);
          assert.ok(items[i + 1] - items[i - 1] > 2, `${label}: … hides fewer than 2 pages`);
        });
      }
    }
  });
});
