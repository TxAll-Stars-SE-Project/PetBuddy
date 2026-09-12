function DeleteAccountModal({
  password,
  error,
  status,
  onPasswordChange,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">

        <h2>ยืนยันการลบบัญชี</h2>

        <p className="delete-modal-warning">
          การลบบัญชีจะไม่สามารถย้อนกลับได้
        </p>

        <p>
          กรุณากรอกรหัสผ่านของคุณ
          เพื่อยืนยันการลบบัญชี
        </p>

        <input
          type="password"
          className="delete-password-input"
          placeholder="กรอกรหัสผ่าน"
          value={password}
          onChange={(e) =>
            onPasswordChange(e.target.value)
          }
          disabled={status === "submitting"}
        />

        {error && (
          <div className="delete-error">
            {error}
          </div>
        )}

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
            type="button"
            className="delete-confirm-button"
            onClick={onConfirm}
            disabled={status === "submitting"}
          >
            {status === "submitting"
              ? "กำลังลบ..."
              : "ยืนยันการลบบัญชี"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default DeleteAccountModal;

