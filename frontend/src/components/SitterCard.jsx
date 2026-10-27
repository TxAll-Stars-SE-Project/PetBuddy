import { Link } from "react-router-dom";
import { PET_TYPES, SERVICE_TYPES } from "../utils/sitterOptions.js";

function Stars({ rating }) {
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? "★" : <span key={i} className="off">★</span>
      )}
    </span>
  );
}

// 1. 👈 [เพิ่มส่วนนี้: รับ prop onBook เพิ่มเข้ามา]
export default function SitterCard({ sitter, onBook }) {
  const { sitterId, username, province, district, services, minPrice, rating, reviewCount } = sitter;
  // API คืน service ที่ตรงเงื่อนไขทุกรายการ (ชื่อซ้ำได้) → แสดงเป็นประเภทที่ไม่ซ้ำกัน
  const serviceTypes = [...new Set(services.map((s) => s.serviceType))];
  const petTypes = [...new Set(services.flatMap((s) => s.species))];

  return (
    <article className="sitter-card">
      <div className="sitter-top">
        <div className="sitter-avatar">{username.charAt(0).toUpperCase()}</div>
        <div>
          <h3 className="sitter-name">{username}</h3>
          <p className="sitter-area">📍 {[province, district].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      <div className="rating-row">
        {rating === null ? (
          <span className="no-review">ยังไม่มีรีวิว</span>
        ) : (
          <>
            <Stars rating={rating} />
            <span className="rating-num">{Number(rating).toFixed(1)}</span>
            <span className="rating-count">({reviewCount} รีวิว)</span>
          </>
        )}
      </div>

      <div>
        <div className="row-label">บริการ</div>
        <div className="tags">
          {serviceTypes.map((t) => (
            <span key={t} className="tag tag--service">{SERVICE_TYPES[t] ?? t}</span>
          ))}
        </div>
      </div>

      <div>
        <div className="row-label">สัตว์เลี้ยงที่รับ</div>
        <div className="tags">
          {petTypes.map((p) => (
            <span key={p} className="tag">{PET_TYPES[p] ?? p}</span>
          ))}
        </div>
      </div>

      <div className="sitter-foot">
        <div className="sitter-price">
          <small>เริ่มต้น</small>
          <strong>฿{minPrice.toLocaleString()}</strong> <span>บาท</span>
        </div>

        {/* 2. 👈 [เพิ่มส่วนนี้: ใส่ container คลุมปุ่มดูโปรไฟล์และเพิ่มปุ่มจองบริการ] */}
        <div style={{ display: "flex", gap: "8px" }}>
          <Link className="btn btn--small btn--ghost" to={`/sitters/${sitterId}`}>
            ดูโปรไฟล์
          </Link>

          {onBook && (
            <button
              type="button"
              className="btn btn--small"
              onClick={() => onBook(sitter)}
            >
              จองบริการ
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function SitterCardSkeleton() {
  return (
    <div className="sitter-card" aria-hidden="true">
      <div className="sitter-top">
        <div className="skel skel--avatar" />
        <div style={{ flex: 1 }}>
          <div className="skel" style={{ height: 16, width: "55%", marginBottom: 8 }} />
          <div className="skel" style={{ height: 12, width: "40%" }} />
        </div>
      </div>
      <div className="skel" style={{ height: 14, width: "45%" }} />
      <div className="skel" style={{ height: 24, width: "80%" }} />
      <div className="skel" style={{ height: 24, width: "60%" }} />
      <div className="sitter-foot">
        <div className="skel" style={{ height: 28, width: 90 }} />
        <div className="skel" style={{ height: 36, width: 100, borderRadius: 12 }} />
      </div>
    </div>
  );
}