import { useEffect, useState } from "react";
import { getBookingPayments, uploadPaymentSlip } from "../../services/payment.api.js";
import { toast } from "../../utils/toast.js";
import { validateSlipFile } from "../../utils/paymentValidation.js";
import PaymentSummary from "./PaymentSummary.jsx";
import SlipUploadZone from "./SlipUploadZone.jsx";

function getResponseData(response) {
  return response?.data?.data ?? response?.data;
}

export default function PaymentModal({ isOpen, onClose, booking, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const bookingId = booking?.bookingId || booking?.id;

  useEffect(() => {
    if (!isOpen || !bookingId) {
      setPaymentSummary(null);
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);
    setSummaryError(false);
    setPaymentSummary(null);

    getBookingPayments(bookingId)
      .then((response) => {
        const data = getResponseData(response);
        if (!data || typeof data !== "object" || !Array.isArray(data.payments)) {
          throw new Error("รูปแบบข้อมูลสรุปการชำระเงินไม่ถูกต้อง");
        }
        if (isCurrent) setPaymentSummary(data);
      })
      .catch((error) => {
        if (!isCurrent) return;
        const fallbackAmount = booking?.totalprice || booking?.totalPrice || 0;
        setSummaryError(true);
        setPaymentSummary({
          bookingId,
          bookingstatus: booking?.bookingstatus,
          totalPrice: fallbackAmount,
          depositAmount: fallbackAmount,
          remainingAmount: fallbackAmount,
          paymentplan: "full",
          payment_stage: "full",
          payments: [],
        });
        toast(
          error.response?.data?.message || "ไม่สามารถโหลดข้อมูลการชำระเงินได้ กรุณาลองใหม่อีกครั้ง",
          "error",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, bookingId, booking, reloadKey]);

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
    setPaymentSummary(null);
    onClose();
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile || !paymentSummary || !bookingId) return;

    const paymentStage = paymentSummary.payment_stage
      || (paymentSummary.bookingstatus === "waiting_final_payment"
        ? "final"
        : paymentSummary.paymentplan === "deposit"
          ? "deposit"
          : "full");
    const amount = paymentStage === "final"
      ? Number(paymentSummary.remainingAmount)
      : paymentStage === "deposit"
        ? Number(paymentSummary.depositAmount)
        : Number(paymentSummary.totalPrice);

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
    let result;
    try {
      const response = await uploadPaymentSlip(formData);
      result = getResponseData(response);
    } catch (error) {
      toast(
        error.response?.data?.message || "ไม่สามารถส่งสลิปได้ กรุณาลองใหม่อีกครั้ง",
        "error",
      );
      return;
    } finally {
      setIsUploading(false);
    }

    toast("ส่งสลิปการชำระเงินเรียบร้อยแล้ว");
    onSuccess?.(result);
    handleClose();
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
        {summaryError && (
          <div className="payment-load-error" role="alert">
            <span>โหลดข้อมูลการชำระเงินไม่สำเร็จ</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              ลองโหลดอีกครั้ง
            </button>
          </div>
        )}

        <PaymentSummary summary={paymentSummary} booking={booking} isError={summaryError} />

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
              disabled={!selectedFile || !paymentSummary || isLoading || isUploading}
            >
              {isUploading ? "กำลังส่งสลิป..." : "ส่งสลิป"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
