import { useEffect, useState } from "react";
import "./VerifyPaymentModal.css";

function MagnifierIcon() {
  return (
    <svg
      aria-hidden="true"
      className="slip-image-viewer__icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.8 7.5v6.6M7.5 10.8h6.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function SlipImageViewer({ imageUrl }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  if (!imageUrl) {
    return <p className="slip-image-viewer__empty">ไม่มีรูปสลิปแนบมา</p>;
  }

  return (
    <>
      <button
        className="slip-image-viewer"
        type="button"
        onClick={() => setIsLightboxOpen(true)}
        aria-label="ขยายรูปสลิป"
      >
        <img className="slip-image-viewer__image" src={imageUrl} alt="สลิปการโอนเงิน" />
        <span className="slip-image-viewer__overlay">
          <MagnifierIcon />
          <span>ขยายรูป</span>
        </span>
      </button>

      {isLightboxOpen && (
        <div
          className="slip-lightbox"
          role="presentation"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="slip-lightbox__content"
            role="dialog"
            aria-modal="true"
            aria-label="รูปสลิปขนาดใหญ่"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="slip-lightbox__close"
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="ปิดรูปขยาย"
            >
              ×
            </button>
            <img src={imageUrl} alt="สลิปการโอนเงินขนาดใหญ่" />
          </div>
        </div>
      )}
    </>
  );
}
