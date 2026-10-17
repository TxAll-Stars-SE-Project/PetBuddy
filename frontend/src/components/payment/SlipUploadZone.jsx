import { useRef, useState } from "react";

export default function SlipUploadZone({
  selectedFile,
  previewUrl,
  onFileSelect,
  onRemoveFile,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file) => {
    if (file) onFileSelect(file);
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="payment-slip-zone">
      <input
        ref={fileInputRef}
        className="payment-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        aria-label="เลือกรูปสลิปการชำระเงิน"
      />
      {selectedFile && previewUrl ? (
        <div className="payment-slip-preview">
          <img src={previewUrl} alt="ตัวอย่างสลิปการชำระเงิน" />
          <div className="payment-slip-actions">
            <button
              type="button"
              className="payment-secondary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              เปลี่ยนรูป
            </button>
            <button type="button" className="payment-remove-button" onClick={onRemoveFile}>
              ลบรูป
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`payment-dropzone${isDragging ? " payment-dropzone--dragging" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <span>ลากรูปสลิปมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</span>
          <small>รองรับ JPEG, PNG, WEBP ขนาดไม่เกิน 5MB</small>
        </button>
      )}
    </div>
  );
}
