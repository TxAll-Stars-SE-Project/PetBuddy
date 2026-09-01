function AlertBanner({ type = "error", children }) {
  const icon = type === "error" ? "⚠" : type === "success" ? "✅" : "ℹ";
  return <div className={"banner banner--" + type}>{icon} <span>{children}</span></div>;
}
export default AlertBanner;