function Button({ loading = false, disabled = false, children, ...rest }) {
  return (
    <button className="btn" disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner" aria-hidden="true"></span>}
      <span>{loading ? "กำลังประมวลผล…" : children}</span>
    </button>
  );
}
export default Button;