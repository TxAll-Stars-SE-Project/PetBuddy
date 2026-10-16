import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import ServiceFormModal from "../components/sitter/ServiceFormModal.jsx";
import DashboardHeader from "../components/sitter/dashboard/DashboardHeader.jsx";
import SitterProfileCard from "../components/sitter/dashboard/SitterProfileCard.jsx";
import RecentBookingsSection from "../components/sitter/dashboard/RecentBookingsSection.jsx";
import MyServicesSection from "../components/sitter/dashboard/MyServicesSection.jsx";
import ServiceFeedbackModal from "../components/sitter/dashboard/ServiceFeedbackModal.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import { toast } from "../utils/toast.js";
import {
  fetchSitterProfile,
  fetchSitterServices,
  createSitterService,
  updateSitterService,
  deleteSitterService,
} from "../services/sitterService.js";
import { getSitterBookings } from "../services/booking.api";
import {
  resolveInitialProfile,
  formatSitterAddress,
  addServiceItem,
  updateServiceItem,
  deleteServiceItem,
} from "../utils/sitterDashboardLogic.js";
import {
  getCachedProfile,
  setCachedProfile,
  getCachedServices,
  setCachedServices,
  addCachedService,
  updateCachedService,
  removeCachedService,
  getCachedBookings,
  setCachedBookings,
} from "../utils/cache/sitterCache.js";

/**
 * SitterDashboardPage
 *
 * Component-driven Sitter Dashboard:
 * - State and Lifecycle are co-located right here (readable from top to bottom).
 * - Instant page transitions using In-Memory Cache (0ms render on re-entry).
 * - Background revalidation updates cache silently.
 * - Real API calls are handled via `services/sitterService.js` and `services/booking.api.ts`.
 * - Pure array transformations are handled via `utils/sitterDashboardLogic.js`.
 * - Read-only pending bookings preview redirects to `/sitter/bookings` for actions.
 */
export default function SitterDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Sitter Profile State (Initialized from cache for instant 0ms transitions)
  const defaultProfile = {
    name: user?.username || "พี่เลี้ยงสัตว์เลี้ยง",
    username: user?.username || "sitter",
    tel: user?.tel || "",
    address: user?.address || "",
    experience: user?.experience || "",
    rating: 5.0,
    reviewCount: 0,
  };

  const [sitterProfile, setSitterProfile] = useState(() => {
    const cached = getCachedProfile();
    if (cached) return cached;
    return resolveInitialProfile(user, defaultProfile);
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(() => !getCachedProfile());

  // 2. Services List State (Initialized from cache for instant 0ms transitions)
  const [services, setServices] = useState(() => getCachedServices() || []);
  const [isLoadingServices, setIsLoadingServices] = useState(() => !getCachedServices());

  // 3. Bookings List State (Initialized from cache for instant 0ms transitions)
  const [bookings, setBookings] = useState(() => getCachedBookings() || []);
  const [isLoadingBookings, setIsLoadingBookings] = useState(() => !getCachedBookings());

  // 4. Service Modals State (Co-located, unified states — no flag explosion!)
  // null = modal closed, {} = add new, { serviceId: ... } = edit
  const [editingService, setEditingService] = useState(null);
  // null = feedback closed, { type: 'create'|'edit', data: ... } = feedback open
  const [feedback, setFeedback] = useState(null);
  // null = confirm modal closed, serviceId = open delete confirmation
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // 5. Fetch Profile, Bookings & Services on Mount (Background Revalidation)
  useEffect(() => {
    let isMounted = true;

    // Fetch profile
    fetchSitterProfile()
      .then((data) => {
        if (data && isMounted) {
          const fullAddress = formatSitterAddress(data);
          setSitterProfile((prev) => {
            const updated = {
              ...prev,
              name: data.username || prev.name,
              username: data.username || prev.username,
              tel: data.tel || prev.tel,
              address: fullAddress || prev.address,
              experience: data.experience || prev.experience,
            };
            setCachedProfile(updated);
            return updated;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    // Fetch bookings (GET /api/sitter/bookings)
    getSitterBookings()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setBookings(data);
          setCachedBookings(data);
        }
      })
      .catch((err) => {
        console.warn("Notice: /api/sitter/bookings unreachable or offline:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBookings(false);
      });

    // Fetch services (GET /api/sitter/services/me)
    fetchSitterServices()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setServices(data);
          setCachedServices(data);
        }
      })
      .catch((err) => {
        console.warn("Notice: /api/sitter/services/me unreachable or offline:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingServices(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 6. Service CRUD Handlers
  const handleSaveService = async (payload) => {
    const isEdit = Boolean(editingService?.serviceId || editingService?.serviceid);
    const targetId = editingService?.serviceId || editingService?.serviceid;

    setEditingService(null); // Close form modal immediately

    if (isEdit) {
      try {
        const serverData = await updateSitterService(targetId, payload);
        const merged = { ...payload, ...(serverData || {}), serviceId: targetId };
        setServices((prev) => updateServiceItem(prev, targetId, merged));
        updateCachedService(targetId, merged);
        setFeedback({ type: "edit", data: merged });
      } catch (err) {
        console.error("Failed to update service:", err);
        toast("เกิดข้อผิดพลาดในการแก้ไขบริการ กรุณาลองใหม่อีกครั้ง");
      }
    } else {
      try {
        const savedData = await createSitterService(payload);
        const newService = {
          ...payload,
          ...(savedData || {}),
          serviceId: savedData?.serviceId || Date.now(),
        };
        setServices((prev) => addServiceItem(prev, newService));
        addCachedService(newService);
        setFeedback({ type: "create", data: newService });
      } catch (err) {
        console.error("Failed to create service:", err);
        toast("เกิดข้อผิดพลาดในการสร้างบริการ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  const handleDeleteService = (serviceId) => {
    setServiceToDelete(serviceId);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    const targetId = serviceToDelete;
    setServiceToDelete(null);

    try {
      await deleteSitterService(targetId);
      setServices((prev) => deleteServiceItem(prev, targetId));
      removeCachedService(targetId);
      toast("ลบบริการเรียบร้อยแล้ว", "success");
    } catch (err) {
      console.error("Failed to delete service:", err);
      toast("เกิดข้อผิดพลาดในการลบบริการ กรุณาลองใหม่อีกครั้ง", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7EF] text-[#1F2937]">
      {/* Top Main Navigation */}
      <Navbar />

      <main className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Top Header / Sub-banner */}
        <DashboardHeader username={sitterProfile.name} />

        {/* Section 1: Sitter Profile Card */}
        <SitterProfileCard
          profile={sitterProfile}
          isLoading={isLoadingProfile}
          onEditProfile={() => navigate("/profile")}
        />

        {/* Section 2: Recent Pending Bookings Preview Section (Read-Only) */}
        <RecentBookingsSection
          bookings={bookings}
          isLoading={isLoadingBookings}
          onViewAll={() => navigate("/sitter/bookings")}
        />

        {/* Section 3: My Services Section */}
        <MyServicesSection
          services={services}
          isLoading={isLoadingServices}
          onAddService={() => setEditingService({})}
          onEditService={(service) => setEditingService(service)}
          onDeleteService={handleDeleteService}
        />
      </main>

      {/* Service Form Modal (Rendered only when editingService is not null) */}
      {editingService && (
        <ServiceFormModal
          serviceToEdit={
            editingService.serviceId || editingService.serviceid
              ? editingService
              : null
          }
          onClose={() => setEditingService(null)}
          onSave={handleSaveService}
        />
      )}

      {/* Service Feedback Modal (Rendered only when feedback is not null) */}
      {feedback && (
        <ServiceFeedbackModal
          type={feedback.type}
          serviceData={feedback.data}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      {serviceToDelete && (
        <ConfirmModal
          title="ยืนยันการลบบริการ"
          message="คุณแน่ใจหรือไม่ว่าต้องการลบบริการนี้? บริการจะถูกนำออกจากรายการของคุณ"
          confirmText="ลบบริการ"
          cancelText="ยกเลิก"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setServiceToDelete(null)}
        />
      )}
    </div>
  );
}
