function DeleteAccountModal({
  error,
  status,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
          <h2>ยืนยันการปิดใช้งานบัญชี</h2>

          <p className="delete-modal-warning">
            คุณแน่ใจหรือไม่ว่าต้องการปิดใช้งานบัญชี?
          </p>

          <p>
            การปิดใช้งานจะทำให้คุณถูกออกจากระบบทันทีและไม่สามารถเข้าสู่ระบบได้อีก
          </p>

          {error && <div className="delete-error">{error}</div>}

          <div className="delete-modal-actions">
            <button
              type="button"
              className="delete-cancel-button"
              onClick={onCancel}
              disabled={status === "submitting"}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="delete-confirm-button"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "กำลังปิดใช้งาน..." : "ยืนยันปิดใช้งาน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteAccountModal;

