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
  const [uploadValidationError, setUploadValidationError] = useState("");

  const bookingId = booking?.bookingId || booking?.id;
  const hasPendingPayment = Boolean(summary?.payments?.some(
    (payment) => payment.payment_status === "pending_verifying",
  ));
  const hasSitterPaymentInfo = Boolean(
    summary?.sitterPaymentInfo?.accountName && summary?.sitterPaymentInfo?.qrCodeUrl,
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadValidationError("");
  };

  const handleFileSelect = (file) => {
    const validation = validateSlipFile(file);
    if (!validation.isValid) {
      clearSelectedFile();
      setUploadValidationError(validation.errorMsg);
      return;
    }

    setUploadValidationError("");
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
    if (!selectedFile || !summary || !bookingId || isLoading || hasPendingPayment || !hasSitterPaymentInfo) return;

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
      setUploadValidationError("ไม่พบยอดชำระเงินที่ถูกต้อง กรุณาลองโหลดข้อมูลใหม่");
      return;
    }

    setUploadValidationError("");
    const formData = new FormData();
    formData.append("bookingId", String(bookingId));
    formData.append("amount", String(amount));
    formData.append("payment_stage", paymentStage);
    formData.append("paymentType", "bank_transfer");
    formData.append("slip_image", selectedFile);

    setIsUploading(true);
    let responseData = null;
    try {
      responseData = await uploadPaymentSlip(formData);
    } catch (error) {
      setUploadValidationError(
        error.response?.data?.message || "ไม่สามารถอัปโหลดสลิปได้ กรุณาตรวจสอบสลิปอีกครั้ง",
      );
      return;
    } finally {
      setIsUploading(false);
    }

    clearSelectedFile();
    onClose();
    const paymentStatus = responseData?.data?.payment_status || responseData?.payment_status;
    if (paymentStatus === "verified") {
      toast("ตรวจสอบสลิปผ่านอัตโนมัติ ยืนยันการชำระเงินเรียบร้อยแล้ว", "success");
    } else {
      toast("แนบสลิปการโอนเงินสำเร็จ รอพี่เลี้ยงตรวจสอบ", "success");
    }
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
          {uploadValidationError && (
            <div className="payment-slip-error-alert" role="alert">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="payment-slip-error-content">
                <strong>ไม่สามารถยืนยันสลิปได้</strong>
                <p>{uploadValidationError}</p>
              </div>
            </div>
          )}
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
                !selectedFile ||
                !summary ||
                isLoading ||
                isUploading ||
                hasPendingPayment ||
                !hasSitterPaymentInfo
              }
            >
              {isUploading ? "กำลังตรวจสอบสลิป..." : "ส่งสลิป"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
