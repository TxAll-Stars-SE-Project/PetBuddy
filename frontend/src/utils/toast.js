function toast(message, type = "success") {
  window.dispatchEvent(new CustomEvent("pb:toast", { detail: { message, type } }));
}
export { toast };