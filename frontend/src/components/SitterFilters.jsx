import ThaiAddressSelects from "./ThaiAddressSelects.jsx";
import { PET_TYPES, SERVICE_TYPES, SORT_OPTIONS } from "../utils/sitterOptions.js";

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="chip-row">
      <button type="button" className={`chip-btn${value === "" ? " active" : ""}`} onClick={() => onChange("")}>
        ทั้งหมด
      </button>
      {Object.entries(options).map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={`chip-btn${value === key ? " active" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function SitterFilters({ filters, priceError, resetKey, onChange, onAreaChange, onReset }) {
  return (
    <section className="filter-card" aria-label="ตัวกรอง">
      <div className="filter-grid">
        {/* key เปลี่ยนตอนล้างตัวกรอง เพราะ ThaiAddressSelects เก็บ id ที่เลือกไว้ใน state ของตัวเอง */}
        <ThaiAddressSelects key={resetKey} mode="filter" value={filters} onChange={onAreaChange} />

        <div className="filter-field">
          <span className="label">ราคา (บาท)</span>
          <div className="price-row">
            <input
              className="input" type="number" min="0" inputMode="numeric" placeholder="ต่ำสุด"
              aria-label="ราคาต่ำสุด" value={filters.min} onChange={(e) => onChange({ min: e.target.value })}
            />
            <span>–</span>
            <input
              className="input" type="number" min="0" inputMode="numeric" placeholder="สูงสุด"
              aria-label="ราคาสูงสุด" value={filters.max} onChange={(e) => onChange({ max: e.target.value })}
            />
          </div>
          {priceError && <div className="field-error">{priceError}</div>}
        </div>

        <div className="filter-field">
          <span className="label">คะแนนขั้นต่ำ</span>
          <div className="star-select">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i} type="button" aria-label={`${i} ดาวขึ้นไป`}
                className={`star-btn${i <= filters.rating ? " on" : ""}`}
                // กดซ้ำที่ค่าเดิมเพื่อล้างตัวกรองคะแนน
                onClick={() => onChange({ rating: filters.rating === i ? 0 : i })}
              >
                ★
              </button>
            ))}
            <span className="star-hint">{filters.rating ? `${filters.rating} ดาวขึ้นไป` : "ทั้งหมด"}</span>
          </div>
        </div>

        <div className="filter-field filter-wide">
          <span className="label">ประเภทสัตว์เลี้ยง</span>
          <ChipGroup options={PET_TYPES} value={filters.pet} onChange={(pet) => onChange({ pet })} />
        </div>

        <div className="filter-field filter-wide">
          <span className="label">ประเภทบริการ</span>
          <ChipGroup options={SERVICE_TYPES} value={filters.service} onChange={(service) => onChange({ service })} />
        </div>
      </div>

      <div className="filter-actions">
        <div className="sort-wrap">
          <label htmlFor="filter-sort">เรียงตาม</label>
          <select id="filter-sort" className="input" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn--ghost btn--small" onClick={onReset}>ล้างตัวกรอง</button>
      </div>
    </section>
  );
}
