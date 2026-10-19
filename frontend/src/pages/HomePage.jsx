import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // 👈 [เพิ่มส่วนนี้: useNavigate]
import Navbar from "../components/Navbar.jsx";
import Pagination from "../components/Pagination.jsx";
import SitterCard, { SitterCardSkeleton } from "../components/SitterCard.jsx";
import SitterFilters from "../components/SitterFilters.jsx";
import BookingModal from "../components/BookingModal.jsx"; // 👈 [เพิ่มส่วนนี้: นำเข้า BookingModal]
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { searchSitters } from "../services/sitters.js";
import { DEFAULT_FILTERS, getPriceError } from "../utils/sitterOptions.js";

const SKELETON_COUNT = 4;

export default function HomePage() {
  const navigate = useNavigate(); // 👈 [เพิ่มส่วนนี้: เรียกใช้ navigate]
  const [selectedSitterForBooking, setSelectedSitterForBooking] = useState(null); // 👈 [เพิ่มส่วนนี้: State เก็บพี่เลี้ยงที่เลือกจอง]

  // คำค้นหาจาก Navbar อยู่ใน URL (?q=) เพื่อให้ใช้ได้จากทุกหน้า รีเฟรชแล้วไม่หาย และแชร์ลิงก์ได้
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ status: "loading", sitters: [], pagination: null });
  const resultsRef = useRef(null);

  // ช่องราคาพิมพ์ทีละตัวอักษร → หน่วงก่อนยิง API; ตัวกรองอื่นกดแล้วยิงทันที
  const debouncedMin = useDebouncedValue(filters.min);
  const debouncedMax = useDebouncedValue(filters.max);
  const query = useMemo(
    () => ({ ...filters, q, min: debouncedMin, max: debouncedMax }),
    [filters, q, debouncedMin, debouncedMax]
  );
  // หน้าปัจจุบันผูกกับชุดตัวกรอง: ตัวกรอง/คำค้นเปลี่ยนเมื่อไหร่ก็กลับไปหน้า 1 อัตโนมัติ
  const queryKey = JSON.stringify(query);
  const [pageState, setPageState] = useState({ key: queryKey, page: 1 });
  const page = pageState.key === queryKey ? pageState.page : 1;
  const setPage = (p) => setPageState({ key: queryKey, page: p });
  // ตรวจจากค่าที่พิมพ์อยู่ (ไม่ debounce) เพื่อแจ้งผู้ใช้ทันที และไม่ยิง request ที่จะโดน 400
  const priceError = getPriceError(filters);

  useEffect(() => {
    if (priceError) return;
    const controller = new AbortController();
    setResult((r) => ({ ...r, status: "loading" }));
    searchSitters(query, page, { signal: controller.signal })
      .then(({ sitters, pagination }) => setResult({ status: "success", sitters, pagination }))
      .catch(() => {
        if (controller.signal.aborted) return; // request เก่าถูกยกเลิกเพราะตัวกรองเปลี่ยน
        setResult((r) => ({ ...r, status: "error" }));
      });
    return () => controller.abort();
  }, [query, page, priceError, reloadKey]);

  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));
  // ThaiAddressSelects ส่ง patch ที่มี province/district (+ ตำบล ซึ่งตัวกรองไม่ใช้) → เก็บเฉพาะที่ใช้
  const updateArea = (patch) =>
    setFilters((f) => ({
      ...f,
      ...("province" in patch && { province: patch.province }),
      ...("district" in patch && { district: patch.district }),
    }));
  const clearKeyword = () =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      return next;
    });
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setResetKey((k) => k + 1);
    clearKeyword();
  };

  const { status, sitters, pagination } = result;

  // ผลลัพธ์ลดลงจนหน้าที่เปิดอยู่เกินจำนวนหน้า (เช่น sitter ถูกปิดบัญชี) → ย้อนไปหน้าสุดท้าย
  useEffect(() => {
    if (status === "success" && pagination && pagination.total > 0 && sitters.length === 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  });

  const changePage = (p) => {
    setPage(p);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const showSkeleton = status === "loading" && sitters.length === 0;

  let countText = "";
  if (status === "loading") countText = "กำลังโหลด…";
  else if (status === "success") countText = `${pagination?.total ?? sitters.length} คน`;

  return (
    <div>
      <Navbar />
      <main className="home-main search-page">
        <h1 className="page-title">ค้นหาพี่เลี้ยงสัตว์เลี้ยง</h1>
        <p className="section-sub">
          กรองตามพื้นที่ ประเภทสัตว์ ราคา และคะแนนรีวิว เพื่อหาพี่เลี้ยงที่เหมาะกับน้อง ๆ ของคุณ
        </p>

        {q && (
          <div className="search-chip">
            <span>ค้นหา: <strong>{q}</strong></span>
            <button type="button" aria-label="ล้างคำค้นหา" onClick={clearKeyword}>×</button>
          </div>
        )}

        <SitterFilters
          filters={filters}
          priceError={priceError}
          resetKey={resetKey}
          onChange={updateFilters}
          onAreaChange={updateArea}
          onReset={resetFilters}
        />

        <div className="result-head" ref={resultsRef}>
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
            {sitters.map((s) => (
              <SitterCard
                key={s.sitterId}
                sitter={s}
                onBook={setSelectedSitterForBooking} // 👈 [เพิ่มส่วนนี้: ส่งฟังก์ชันรับพี่เลี้ยงที่ถูกกดจองไปให้ SitterCard]
              />
            ))}
          </div>
        )}

        {status !== "error" && pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            disabled={status === "loading"}
            onChange={changePage}
          />
        )}
      </main>

      {/* 👈 [เพิ่มส่วนนี้: Component Pop-up จองบริการ] */}
      <BookingModal
        sitter={selectedSitterForBooking}
        isOpen={!!selectedSitterForBooking}
        onClose={() => setSelectedSitterForBooking(null)}
        onSuccess={() => navigate("/bookings")}
      />
    </div>
  );
}