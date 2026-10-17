import { useEffect, useState } from "react";
import { uploadPaymentSlip } from "../../services/payment.api.js";
import { toast } from "../../utils/toast.js";
import { validateSlipFile } from "../../utils/paymentValidation.js";
import PaymentSummary from "./PaymentSummary.jsx";
import SlipUploadZone from "./SlipUploadZone.jsx";

export default function PaymentModal({
  isOpen,
  onClose,
  booking,
  summary,
  isLoading = false,
  isError = false,
  onRetry,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const bookingId = booking?.bookingId || booking?.id;
  const hasPendingPayment = Boolean(summary?.payments?.some(
    (payment) => payment.payment_status === "pending_verifying",
  ));

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleFileSelect = (file) => {
    const validation = validateSlipFile(file);
    if (!validation.isValid) {
      clearSelectedFile();
      toast(validation.errorMsg, "error");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    if (isUploading) return;
    clearSelectedFile();
    onClose();
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile || !summary || !bookingId || isLoading || hasPendingPayment) return;

    const paymentStage = summary.payment_stage
      || (summary.bookingstatus === "waiting_final_payment"
        ? "final"
        : summary.paymentplan === "deposit"
          ? "deposit"
          : "full");
    const amount = paymentStage === "final"
      ? Number(summary.remainingAmount)
      : paymentStage === "deposit"
        ? Number(summary.depositAmount)
        : Number(summary.totalPrice);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast("ไม่พบยอดชำระเงินที่ถูกต้อง กรุณาลองโหลดข้อมูลใหม่", "error");
      return;
    }

    const formData = new FormData();
    formData.append("bookingId", String(bookingId));
    formData.append("amount", String(amount));
    formData.append("payment_stage", paymentStage);
    formData.append("paymentType", "bank_transfer");
    formData.append("slip_image", selectedFile);

    setIsUploading(true);
    try {
      await uploadPaymentSlip(formData);
    } catch (error) {
      toast(error.response?.data?.message || "ไม่สามารถอัปโหลดสลิปได้", "error");
      return;
    } finally {
      setIsUploading(false);
    }

    clearSelectedFile();
    onClose();
    toast("แนบสลิปการโอนเงินสำเร็จ รอพี่เลี้ยงตรวจสอบ", "success");
    onSuccess?.();
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="delete-modal-overlay" onClick={handleClose}>
      <div
        className="delete-modal payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="payment-modal-title">แนบสลิปการชำระเงิน</h2>
        <p className="payment-modal-sub">การจอง #{bookingId}</p>

        {isLoading && <p className="payment-load-message">กำลังโหลดข้อมูลการชำระเงิน...</p>}
        {isError && (
          <div className="payment-load-error" role="alert">
            <span>โหลดข้อมูลการชำระเงินไม่สำเร็จ</span>
            <button type="button" onClick={onRetry}>
              ลองโหลดอีกครั้ง
            </button>
          </div>
        )}

        <PaymentSummary summary={summary} booking={booking} isError={isError} />

        <form onSubmit={handleUpload}>
          <SlipUploadZone
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            onRemoveFile={clearSelectedFile}
          />
          <div className="delete-modal-actions payment-modal-actions">
            <button
              type="button"
              className="delete-cancel-button"
              onClick={handleClose}
              disabled={isUploading}
            >
              ปิด
            </button>
            <button
              type="submit"
              className="profile-save-button"
              disabled={
                !selectedFile || !summary || isLoading || isUploading || hasPendingPayment
              }
            >
              {isUploading ? "กำลังส่งสลิป..." : "ส่งสลิป"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
