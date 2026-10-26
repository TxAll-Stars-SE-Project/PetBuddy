import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { getSitterServices } from "../services/sitters";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/BookingModal";
import Button from "../components/ui/Button";

// Helper to safely extract array from any API response envelope
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.items)) return res.data.items;
  if (Array.isArray(res.data?.bookings)) return res.data.bookings;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.bookings)) return res.bookings;
  return [];
};

// Map species values from DB to Thai display labels
const formatSpeciesName = (species) => {
  if (!species) return "";
  const s = String(species).trim().toLowerCase();
  
  if (s === "dog" || s === "สุนัข") return "สุนัข";
  if (s === "cat" || s === "แมว") return "แมว";
  if (s === "bird" || s === "นก") return "นก";
  if (s === "exotic" || s === "สัตว์แปลก" || s === "สัตว์มหัศจรรย์") return "สัตว์แปลก";
  
  return species;
};

// Map serviceType from DB to readable Thai categories
const formatServiceType = (type) => {
  if (!type) return "ทั่วไป";
  const t = String(type).trim().toLowerCase();
  
  if (t === "daycare" || t.includes("รายวัน")) return "ฝากเลี้ยงรายวัน";
  if (t === "boarding" || t.includes("ค้างคืน")) return "ฝากเลี้ยงค้างคืน";
  if (t === "walking" || t.includes("เดิน")) return "พาเดินเล่น";
  if (t === "grooming" || t.includes("อาบน้ำ")) return "อาบน้ำตัดขน";
  if (t === "sitting" || t.includes("ที่พัก")) return "ดูแลถึงที่พัก";
  
  return type;
};

// Determine pricing unit label based on serviceType
const getServiceUnit = (svc) => {
  if (!svc) return "฿";
  const rawType = String(svc.serviceType || svc.serviceName || "").toLowerCase();

  if (rawType.includes("walking") || rawType.includes("เดินเล่น") || rawType.includes("พาเดิน")) {
    return "/ ชม.";
  }
  if (rawType.includes("daycare") || rawType.includes("รายวัน")) {
    return "/ วัน";
  }
  if (rawType.includes("boarding") || rawType.includes("ค้างคืน")) {
    return "/ คืน";
  }
  if (rawType.includes("grooming") || rawType.includes("อาบน้ำ") || rawType.includes("sitting")) {
    return "/ ครั้ง";
  }
  return "";
};

export default function SitterDetailPage() {
  const { sitterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const auth = useAuth() || {};
  const user = auth.user;
  const token = auth.token;

  const passedSitter = location.state?.sitter || null;
  const initialServiceId = String(
    location.state?.serviceId ??
    location.state?.serviceid ??
    location.state?.selectedServiceId ??
    location.state?.service?.serviceId ??
    location.state?.service?.serviceid ??
    location.state?.service?.id ??
    ""
  );

  const [sitter, setSitter] = useState(passedSitter);
  const [services, setServices] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // 1. Fetch Sitter Profile & All Services
  useEffect(() => {
    async function fetchSitterData() {
      setLoading(true);
      try {
        const servicesRes = await getSitterServices(sitterId);
        const serviceList = extractArray(servicesRes);
        
        console.log("BACKEND SERVICES DATA:", serviceList);
        setServices(serviceList);

        if (!passedSitter) {
          const sitterRes = await api.get(`/sitters?limit=100`);
          const allSitters = extractArray(sitterRes);
          const currentSitter = Array.isArray(allSitters)
            ? allSitters.find((s) => String(s.sitterId || s.userId || s.id) === String(sitterId))
            : null;

          if (currentSitter) {
            setSitter(currentSitter);
          } else {
            setSitter({
              sitterId: Number(sitterId),
              username: serviceList[0]?.serviceName ? `พี่เลี้ยง (${serviceList[0].serviceName})` : "พี่เลี้ยงสัตว์เลี้ยง",
              province: "",
              district: "",
              rating: null,
              reviewCount: 0,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load sitter details:", err);
        setError("ไม่สามารถโหลดข้อมูลพี่เลี้ยงได้");
      } finally {
        setLoading(false);
      }
    }

    if (sitterId) fetchSitterData();
  }, [sitterId, passedSitter]);

  // 2. Fetch User Bookings
  const fetchUserBookings = useCallback(async () => {
    const authToken = token || localStorage.getItem("token") || localStorage.getItem("accessToken");
    const reqHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    const candidateEndpoints = [
      "/owner/bookings",
      "/bookings/owner",
      "/users/me/bookings",
      "/bookings/user",
      "/bookings"
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const res = await api.get(endpoint, { headers: reqHeaders });
        const list = extractArray(res);
        if (Array.isArray(list) && list.length > 0) {
          setUserBookings(list);
          return;
        }
      } catch (_) {
        // Continue to fallback endpoint
      }
    }
  }, [token]);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings, user]);

  // 3. Collect active and pending booked service IDs and names from My Bookings
  const bookedServiceIdentifiers = useMemo(() => {
    const activeBookedIds = new Set();
    const activeBookedNames = new Set();

    (userBookings || []).forEach((b) => {
      const rawStatus = String(
        b?.bookingStatus || b?.status || b?.booking_status || b?.state || ""
      ).trim().toLowerCase();

      const isInactive = [
        "cancelled",
        "canceled",
        "rejected",
        "completed",
        "finished",
        "expired",
        "ยกเลิกแล้ว",
        "ปฏิเสธแล้ว",
        "เสร็จสิ้น",
      ].includes(rawStatus);

      if (!isInactive) {
        const sId =
          b?.serviceId ??
          b?.serviceid ??
          b?.service_id ??
          b?.sitter_service_id ??
          b?.service?.serviceId ??
          b?.service?.id;

        if (sId !== undefined && sId !== null) {
          activeBookedIds.add(String(sId));
          activeBookedIds.add(Number(sId));
        }

        const sName =
          b?.serviceName ||
          b?.servicename ||
          b?.service_name ||
          b?.serviceType ||
          b?.service?.serviceName;

        if (sName) {
          activeBookedNames.add(String(sName).trim().toLowerCase());
        }
      }
    });

    return { ids: activeBookedIds, names: activeBookedNames };
  }, [userBookings]);

  // 4. Filter dropdown items (Standardized for camelCase Backend)
  const availableServices = useMemo(() => {
    return (services || []).filter((svc) => {
      if (!svc) return false;

      // Status check (if provided by Backend)
      if (svc.status && ["draft", "inactive", "disabled", "ปิดรับบริการ"].includes(String(svc.status).toLowerCase())) {
        return false;
      }
      if (svc.isActive === false || svc.is_active === false) {
        return false;
      }

      // Backend Standard Keys
      const sId = svc.serviceId ?? svc.serviceid ?? svc.id;
      const sName = svc.serviceName ?? svc.servicename;

      const isBookedById =
        sId !== undefined &&
        sId !== null &&
        (bookedServiceIdentifiers.ids.has(String(sId)) || bookedServiceIdentifiers.ids.has(Number(sId)));

      const isBookedByName =
        sName && bookedServiceIdentifiers.names.has(String(sName).trim().toLowerCase());

      return !(isBookedById || isBookedByName);
    });
  }, [services, bookedServiceIdentifiers]);

  // 5. Keep selectedServiceId valid
  useEffect(() => {
    if (availableServices.length > 0) {
      const isStillAvailable = availableServices.some(
        (s) => String(s?.serviceId || s?.serviceid || s?.id) === String(selectedServiceId)
      );
      if (!selectedServiceId || !isStillAvailable) {
        const defaultId = availableServices[0]?.serviceId || availableServices[0]?.serviceid || availableServices[0]?.id;
        setSelectedServiceId(String(defaultId || ""));
      }
    }
  }, [availableServices, selectedServiceId]);

  const activeService = useMemo(() => {
    return availableServices.find(
      (s) => String(s?.serviceId || s?.serviceid || s?.id) === String(selectedServiceId)
    );
  }, [availableServices, selectedServiceId]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>กำลังโหลดข้อมูล...</div>;
  if (error || !sitter) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>{error || "ไม่พบข้อมูลพี่เลี้ยง"}</p>
        <button onClick={() => navigate(-1)}>กลับหน้าหลัก</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}
      >
        ← กลับไปหน้าค้นหา
      </button>

      {/* Sitter Profile Overview Header */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "24px", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#111827" }}>
              {sitter.username || sitter.fullname}
            </h1>
            <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "14px" }}>
              📍 {[sitter.province, sitter.district].filter(Boolean).join(" · ") || "ไม่ระบุพื้นที่"}
            </p>
            <div style={{ fontSize: "14px", color: "#d97706", fontWeight: "500" }}>
              ⭐ {sitter.rating !== null && sitter.rating !== undefined ? Number(sitter.rating).toFixed(1) : "ไม่มีรีวิว"} ({sitter.reviewCount || 0} รีวิว)
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Dropdown */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 16px 0", color: "#374151" }}>เลือกบริการที่ต้องการดูรายละเอียด</h2>

        {availableServices.length === 0 ? (
          <div style={{ padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#991b1b", fontSize: "14px" }}>
            {services.length === 0
              ? "พี่เลี้ยงท่านนี้ยังไม่ได้เปิดให้บริการในขณะนี้"
              : "ℹ️ ไม่มีบริการที่เปิดรับอยู่ในขณะนี้ หรือคุณได้ทำการจองบริการที่เปิดสาธารณะทั้งหมดเรียบร้อยแล้ว"}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#4b5563", marginBottom: "6px" }}>
                รายการบริการที่พร้อมให้บริการ ({availableServices.length} รายการ)
              </label>
              <select
                className="input"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "15px" }}
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                {availableServices.map((svc) => {
                  const sId = svc.serviceId || svc.serviceid || svc.id;
                  const sName = svc.serviceName || svc.servicename;
                  const price = Number(svc.price || 0).toLocaleString();
                  const unit = getServiceUnit(svc);

                  return (
                    <option key={sId} value={sId}>
                      {sName} — ฿{price} {unit}
                    </option>
                  );
                })}
              </select>
            </div>

            {activeService && (
              <div 
                style={{
                  background: "#f9fafb",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  marginTop: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#111827" }}>
                      {activeService.serviceName || activeService.servicename}
                    </h3>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      หมวดหมู่: {formatServiceType(activeService.serviceType || activeService.servicetype)}
                    </span>
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--primary, #f97316)" }}>
                    ฿{Number(activeService.price || 0).toLocaleString()} <span style={{ fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>{getServiceUnit(activeService)}</span>
                  </div>
                </div>

                {activeService.description && (
                  <div style={{ margin: "12px 0", color: "#4b5563", fontSize: "14px", lineHeight: "1.5" }}>
                    <strong>รายละเอียดบริการ:</strong>
                    <p style={{ margin: "4px 0 0 0" }}>{activeService.description}</p>
                  </div>
                )}

                {activeService.species && activeService.species.length > 0 && (
                  <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>ประเภทสัตว์เลี้ยงที่รับฝาก:</span>
                    {activeService.species.map((sp, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {formatSpeciesName(sp)}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                  <Button onClick={() => setIsBookingOpen(true)}>
                    จองบริการนี้
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BookingModal
        sitter={sitter}
        selectedService={activeService}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          setIsBookingOpen(false);
          fetchUserBookings();
        }}
      />
    </div>
  );
}