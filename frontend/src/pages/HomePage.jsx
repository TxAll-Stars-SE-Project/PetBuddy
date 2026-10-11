import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import SitterCard, { SitterCardSkeleton } from "../components/SitterCard.jsx";
import SitterFilters from "../components/SitterFilters.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { searchSitters } from "../services/sitters.js";
import { DEFAULT_FILTERS, getPriceError } from "../utils/sitterOptions.js";

const SKELETON_COUNT = 4;

export default function HomePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ status: "loading", sitters: [] });

  // ช่องราคาพิมพ์ทีละตัวอักษร → หน่วงก่อนยิง API; ตัวกรองอื่นกดแล้วยิงทันที
  const debouncedMin = useDebouncedValue(filters.min);
  const debouncedMax = useDebouncedValue(filters.max);
  const query = useMemo(
    () => ({ ...filters, min: debouncedMin, max: debouncedMax }),
    [filters, debouncedMin, debouncedMax]
  );
  // ตรวจจากค่าที่พิมพ์อยู่ (ไม่ debounce) เพื่อแจ้งผู้ใช้ทันที และไม่ยิง request ที่จะโดน 400
  const priceError = getPriceError(filters);

  useEffect(() => {
    if (priceError) return;
    const controller = new AbortController();
    setResult((r) => ({ ...r, status: "loading" }));
    searchSitters(query, { signal: controller.signal })
      .then((sitters) => setResult({ status: "success", sitters }))
      .catch(() => {
        if (controller.signal.aborted) return; // request เก่าถูกยกเลิกเพราะตัวกรองเปลี่ยน
        setResult((r) => ({ ...r, status: "error" }));
      });
    return () => controller.abort();
  }, [query, priceError, reloadKey]);

  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));
  // ThaiAddressSelects ส่ง patch ที่มี province/district (+ ตำบล ซึ่งตัวกรองไม่ใช้) → เก็บเฉพาะที่ใช้
  const updateArea = (patch) =>
    setFilters((f) => ({
      ...f,
      ...("province" in patch && { province: patch.province }),
      ...("district" in patch && { district: patch.district }),
    }));
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setResetKey((k) => k + 1);
  };

  const { status, sitters } = result;
  const showSkeleton = status === "loading" && sitters.length === 0;

  let countText = "";
  if (status === "loading") countText = "กำลังโหลด…";
  else if (status === "success") countText = `${sitters.length} คน`;

  return (
    <div>
      <Navbar />
      <main className="home-main search-page">
        <h1 className="page-title">ค้นหาพี่เลี้ยงสัตว์เลี้ยง</h1>
        <p className="section-sub">
          กรองตามพื้นที่ ประเภทสัตว์ ราคา และคะแนนรีวิว เพื่อหาพี่เลี้ยงที่เหมาะกับน้อง ๆ ของคุณ
        </p>

        <SitterFilters
          filters={filters}
          priceError={priceError}
          resetKey={resetKey}
          onChange={updateFilters}
          onAreaChange={updateArea}
          onReset={resetFilters}
        />

        <div className="result-head">
          <h2>พี่เลี้ยงทั้งหมด</h2>
          <span className="result-count">{countText}</span>
        </div>

        {showSkeleton && (
          <div className="sitter-list">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => <SitterCardSkeleton key={i} />)}
          </div>
        )}

        {status === "error" && (
          <div className="state-box state-box--error">
            <div className="emoji">⚠️</div>
            <h3>โหลดรายชื่อพี่เลี้ยงไม่สำเร็จ</h3>
            <p>เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</p>
            <button type="button" className="btn" onClick={() => setReloadKey((k) => k + 1)}>ลองใหม่</button>
          </div>
        )}

        {status === "success" && sitters.length === 0 && (
          <div className="state-box">
            <div className="emoji">🔍</div>
            <h3>ไม่พบพี่เลี้ยงที่ตรงกับเงื่อนไข</h3>
            <p>ลองปรับตัวกรองหรือล้างตัวกรองเพื่อดูพี่เลี้ยงทั้งหมด</p>
            <button type="button" className="btn btn--ghost" onClick={resetFilters}>ล้างตัวกรอง</button>
          </div>
        )}

        {/* ระหว่างโหลดใหม่ยังแสดงผลลัพธ์เดิมแบบจาง ๆ แทนการกระพริบเป็น skeleton */}
        {sitters.length > 0 && status !== "error" && (
          <div className={`sitter-list${status === "loading" ? " is-loading" : ""}`}>
            {sitters.map((s) => <SitterCard key={s.sitterId} sitter={s} />)}
          </div>
        )}
      </main>
    </div>
  );
}
