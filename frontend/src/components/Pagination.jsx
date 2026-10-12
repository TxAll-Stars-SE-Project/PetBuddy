// ปุ่มเปลี่ยนหน้า: « ก่อนหน้า 1 … 4 [5] 6 … 20 ถัดไป »
const SIBLINGS = 1;

// รายการเลขหน้าที่จะแสดง (null = จุดไข่ปลา) เช่น [1, null, 4, 5, 6, null, 20]
export function getPageItems(page, totalPages) {
  const wanted = new Set([1, totalPages, page]);
  for (let d = 1; d <= SIBLINGS; d++) {
    wanted.add(page - d);
    wanted.add(page + d);
  }
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items = [];
  pages.forEach((p, i) => {
    const prev = pages[i - 1];
    if (prev !== undefined && p - prev === 2) items.push(prev + 1); // เว้นแค่หน้าเดียว แสดงเลขแทน …
    else if (prev !== undefined && p - prev > 2) items.push(null);
    items.push(p);
  });
  return items;
}

export default function Pagination({ page, totalPages, disabled, onChange }) {
  if (totalPages <= 1) return null;
  const go = (p) => !disabled && p >= 1 && p <= totalPages && p !== page && onChange(p);

  return (
    <nav className="pagination" aria-label="เปลี่ยนหน้า">
      <button type="button" className="page-btn" disabled={disabled || page <= 1} onClick={() => go(page - 1)}>
        ‹ ก่อนหน้า
      </button>
      {getPageItems(page, totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="page-gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={p} type="button" disabled={disabled}
            className={`page-btn${p === page ? " active" : ""}`}
            aria-label={`หน้า ${p}`} aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className="page-btn" disabled={disabled || page >= totalPages} onClick={() => go(page + 1)}>
        ถัดไป ›
      </button>
    </nav>
  );
}
