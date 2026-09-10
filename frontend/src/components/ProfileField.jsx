function ProfileField({
  label,
  value,
  field,
  type = "text",
  isEditing,
  error,
  onChange,
}) {
  return (
    <div className="profile-row">
      <span className="profile-label">
        {label}
      </span>

      <div className="profile-field-container">
        {isEditing ? (
          <>
            <input
              type={type}
              className={`profile-input ${
                error ? "profile-input-error" : ""
              }`}
              value={value || ""}
              onChange={(e) =>
                onChange(field, e.target.value)
              }
            />

            {error && (
              <div className="profile-field-error">
                {error}
              </div>
            )}
          </>
        ) : (
          <span className="profile-value">
            {value || "-"}
          </span>
        )}
      </div>
    </div>
  );
}

export default ProfileField;
